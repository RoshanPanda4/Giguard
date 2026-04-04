/* ====================================================
   riskmap.js — Interactive Canvas Risk Map
   Renders a 2D city-style risk map with:
   - Grid streets
   - Worker markers (dots moving)
   - Delivery zone circles
   - Risk heatmap overlay
   - State transitions: normal / rain / surge
   ==================================================== */

(function () {
    const canvas = document.getElementById('riskMapCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W, H;
    let mapState = 'normal'; // 'normal' | 'rain' | 'surge'
    let transitionProgress = 0;

    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        W = canvas.width = rect.width * window.devicePixelRatio;
        H = canvas.height = rect.height * window.devicePixelRatio;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resize();
    window.addEventListener('resize', resize);

    // Delivery zones
    const deliveryZones = [
        { x: 0.2, y: 0.3, r: 0.08, name: 'Patia' },
        { x: 0.5, y: 0.2, r: 0.1, name: 'KIIT' },
        { x: 0.75, y: 0.35, r: 0.07, name: 'Khandagiri' },
        { x: 0.3, y: 0.65, r: 0.09, name: 'Saheed Nagar' },
        { x: 0.65, y: 0.7, r: 0.08, name: 'Nayapalli' },
        { x: 0.85, y: 0.55, r: 0.06, name: 'Jayadev Vihar' },
    ];

    // Fetch user zone dynamically
    const token = localStorage.getItem("token");
    if (token) {
        fetch('https://giguard.onrender.com/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.profile && data.profile.zone) {
                // check if their zone exists, if not, mutate index 0
                const exists = deliveryZones.find(dz => dz.name === data.profile.zone);
                if (!exists) {
                    deliveryZones[0].name = data.profile.zone;
                }
            }
        })
        .catch(err => console.error("Error fetching user zone:", err));
    }

    // Workers
    const workerDots = [];
    for (let i = 0; i < 80; i++) {
        workerDots.push({
            x: Math.random(),
            y: Math.random(),
            vx: (Math.random() - 0.5) * 0.001,
            vy: (Math.random() - 0.5) * 0.001,
            size: 2 + Math.random() * 2,
        });
    }

    // Get actual pixel coords
    function px(ratioX) { return ratioX * (W / window.devicePixelRatio); }
    function py(ratioY) { return ratioY * (H / window.devicePixelRatio); }

    // Risk colors based on state
    function getZoneColor(zone, state, t) {
        if (state === 'normal') return 'rgba(0, 255, 136, 0.12)';
        if (state === 'rain') {
            // Some zones turn red, some yellow
            const risk = (zone.x + zone.y) > 0.7 ? 'red' : 'yellow';
            if (risk === 'red') return `rgba(255, 64, 96, ${0.15 + Math.sin(t * 3) * 0.08})`;
            return `rgba(255, 193, 7, ${0.12 + Math.sin(t * 2) * 0.05})`;
        }
        if (state === 'surge') {
            return `rgba(255, 64, 96, ${0.2 + Math.sin(t * 5) * 0.1})`;
        }
        return 'rgba(0, 255, 136, 0.12)';
    }

    function getZoneBorder(zone, state) {
        if (state === 'normal') return 'rgba(0, 255, 136, 0.3)';
        if (state === 'rain') {
            const risk = (zone.x + zone.y) > 0.7;
            return risk ? 'rgba(255, 64, 96, 0.5)' : 'rgba(255, 193, 7, 0.4)';
        }
        return 'rgba(255, 64, 96, 0.6)';
    }

    function getWorkerColor(state) {
        if (state === 'normal') return 'rgba(0, 230, 255, 0.8)';
        if (state === 'rain') return 'rgba(255, 193, 7, 0.8)';
        return 'rgba(255, 64, 96, 0.9)';
    }

    let time = 0;

    function draw() {
        time += 0.016;
        const rW = W / window.devicePixelRatio;
        const rH = H / window.devicePixelRatio;

        ctx.clearRect(0, 0, rW, rH);

        // Background
        ctx.fillStyle = '#060c18';
        ctx.fillRect(0, 0, rW, rH);

        // Grid streets
        ctx.strokeStyle = 'rgba(0, 230, 255, 0.04)';
        ctx.lineWidth = 1;
        const gridSpacing = 30;
        for (let x = 0; x < rW; x += gridSpacing) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rH); ctx.stroke();
        }
        for (let y = 0; y < rH; y += gridSpacing) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(rW, y); ctx.stroke();
        }

        // Heatmap blobs (disruption state)
        if (mapState !== 'normal') {
            deliveryZones.forEach(zone => {
                const cx = px(zone.x), cy = py(zone.y);
                const radius = px(zone.r) * 2.5;
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
                if (mapState === 'rain' && (zone.x + zone.y) > 0.7) {
                    grad.addColorStop(0, 'rgba(255, 64, 96, 0.15)');
                    grad.addColorStop(1, 'rgba(255, 64, 96, 0)');
                } else if (mapState === 'surge') {
                    grad.addColorStop(0, 'rgba(255, 64, 96, 0.2)');
                    grad.addColorStop(1, 'rgba(255, 64, 96, 0)');
                } else {
                    grad.addColorStop(0, 'rgba(255, 193, 7, 0.1)');
                    grad.addColorStop(1, 'rgba(255, 193, 7, 0)');
                }
                ctx.fillStyle = grad;
                ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
            });
        }

        // Delivery zones
        deliveryZones.forEach(zone => {
            const cx = px(zone.x), cy = py(zone.y), r = px(zone.r);

            // Fill
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = getZoneColor(zone, mapState, time);
            ctx.fill();

            // Border
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.strokeStyle = getZoneBorder(zone, mapState);
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Pulse ring
            const pulseR = r + Math.sin(time * 2) * 5;
            ctx.beginPath();
            ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
            ctx.strokeStyle = getZoneBorder(zone, mapState).replace(/[\d.]+\)$/, '0.15)');
            ctx.lineWidth = 1;
            ctx.stroke();

            // Zone label
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(zone.name, cx, cy + r + 14);
        });

        // Worker dots
        workerDots.forEach(w => {
            w.x += w.vx;
            w.y += w.vy;
            if (w.x < 0 || w.x > 1) w.vx *= -1;
            if (w.y < 0 || w.y > 1) w.vy *= -1;

            const wx = px(w.x), wy = py(w.y);
            ctx.beginPath();
            ctx.arc(wx, wy, w.size, 0, Math.PI * 2);
            ctx.fillStyle = getWorkerColor(mapState);
            ctx.fill();

            // Glow
            ctx.beginPath();
            ctx.arc(wx, wy, w.size + 3, 0, Math.PI * 2);
            ctx.fillStyle = getWorkerColor(mapState).replace('0.8', '0.15').replace('0.9', '0.15');
            ctx.fill();
        });

        // Claims animation (rain/surge)
        if (mapState !== 'normal' && Math.sin(time * 3) > 0.8) {
            const zone = deliveryZones[Math.floor(time) % deliveryZones.length];
            const cx = px(zone.x), cy = py(zone.y);
            const expandR = 5 + (time % 1) * 30;
            ctx.beginPath();
            ctx.arc(cx, cy, expandR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 64, 96, ${1 - (time % 1)})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        requestAnimationFrame(draw);
    }

    draw();

    // Expose state setter globally
    window.setMapState = function (state) {
        mapState = state;

        // Update button styles (buttons may not exist on simulation dashboard)
        document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('active'));
        const btnNormal = document.getElementById('btnNormal');
        const btnRain = document.getElementById('btnRain');
        const btnSurge = document.getElementById('btnSurge');
        if (state === 'normal' && btnNormal) btnNormal.classList.add('active');
        if (state === 'rain' && btnRain) btnRain.classList.add('active');
        if (state === 'surge' && btnSurge) btnSurge.classList.add('active');

        // Update status indicator
        const statusEl = document.getElementById('mapStatus');
        if (!statusEl) return;
        if (state === 'normal') {
            statusEl.innerHTML = '<span class="status-dot green"></span> All zones operational';
        } else if (state === 'rain') {
            statusEl.innerHTML = '<span class="status-dot red"></span> Rain disruption detected — claims triggering';
        } else {
            statusEl.innerHTML = '<span class="status-dot red"></span> Surge event — all zones disrupted';
        }
    };
})();