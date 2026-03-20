/* ====================================================
   simulation.js — Simulation Engine & Dashboard Logic
   Controls: worker generation, event simulation,
   animated metrics, log output, scalability canvas
   ==================================================== */

(function () {
    // --- Simulation State ---
    let simState = {
        workers: 500,
        claims: 0,
        payouts: 0,
        zones: 0,
        rainActive: false,
        reportsActive: false,
        riskActive: false,
    };

    // --- Log ---
    const logEl = document.getElementById('simLog');
    function addLog(msg) {
        if (!logEl) return;
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const ts = new Date().toLocaleTimeString();
        entry.textContent = `[${ts}] ${msg}`;
        logEl.appendChild(entry);
        logEl.scrollTop = logEl.scrollHeight;
    }

    // --- Animate metric value ---
    function animateValue(elId, start, end, duration, prefix, suffix) {
        prefix = prefix || '';
        suffix = suffix || '';
        const el = document.getElementById(elId);
        if (!el) return;
        const range = end - start;
        const startTime = performance.now();

        function step(timestamp) {
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const current = Math.floor(start + range * progress);
            el.textContent = prefix + current.toLocaleString() + suffix;
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    // --- Update fill bars ---
    function updateBars() {
        const fillW = document.getElementById('fillWorkers');
        const fillC = document.getElementById('fillClaims');
        const fillP = document.getElementById('fillPayouts');
        const fillZ = document.getElementById('fillZones');

        if (fillW) fillW.style.width = Math.min((simState.workers / 1000) * 100, 100) + '%';
        if (fillC) fillC.style.width = Math.min((simState.claims / 200) * 100, 100) + '%';
        if (fillP) fillP.style.width = Math.min((simState.payouts / 50000) * 100, 100) + '%';
        if (fillZ) fillZ.style.width = Math.min((simState.zones / 6) * 100, 100) + '%';
    }

    // --- Worker Generation ---
    window.simWorkers = function (count) {
        simState.workers = count;
        animateValue('metricWorkers', parseInt(document.getElementById('metricWorkers').textContent.replace(/,/g, '')) || 0, count, 800);
        addLog(`> Generated ${count} workers`);

        // Update button active states
        document.querySelectorAll('.sim-btn').forEach(b => b.classList.remove('active'));
        event.target.classList.add('active');
        updateBars();
    };

    // --- Event Simulation ---
    window.simEvent = function (type) {
        const btn = document.getElementById(type === 'rain' ? 'simRain' : type === 'reports' ? 'simReports' : 'simRisk');

        if (type === 'rain') {
            simState.rainActive = true;
            if (btn) btn.classList.add('triggered');
            addLog('> 🌧️ Rain event started — weather signals received');
            addLog(`> Disruption detected across delivery zones`);

            simState.zones = 3 + Math.floor(Math.random() * 3);
            animateValue('metricZones', 0, simState.zones, 600);

            // Trigger map
            if (typeof setMapState === 'function') setMapState('rain');

            setTimeout(() => updateBars(), 100);
            
            // Auto trigger AI Risk Engine
            setTimeout(() => {
                if (typeof runBackendSimulation === 'function') {
                    runBackendSimulation();
                }
            }, 2000);
        }

        if (type === 'reports') {
            simState.reportsActive = true;
            if (btn) btn.classList.add('triggered');

            const reportCount = Math.floor(simState.workers * (0.15 + Math.random() * 0.15));
            addLog(`> 📝 ${reportCount} worker reports generated`);
            addLog(`> Reports forwarded to AI Risk Engine`);
            
            // Auto trigger AI Risk Engine
            setTimeout(() => {
                if (typeof runBackendSimulation === 'function') {
                    runBackendSimulation();
                }
            }, 2000);
        }

        if (type === 'risk') {
            simState.riskActive = true;
            if (btn) btn.classList.add('triggered');
            addLog('> 🧠 Risk Engine triggered — analyzing signals...');

            setTimeout(() => {
                const claimCount = Math.floor(simState.workers * (0.08 + Math.random() * 0.12));
                const payoutAmount = claimCount * (150 + Math.floor(Math.random() * 200));

                simState.claims = claimCount;
                simState.payouts = payoutAmount;

                animateValue('metricClaims', 0, claimCount, 1200);
                animateValue('metricPayouts', 0, payoutAmount, 1500, '₹');

                addLog(`> ✅ ${claimCount} claims auto-validated`);
                addLog(`> 💰 ₹${payoutAmount.toLocaleString()} credited to worker wallets`);
                addLog(`> System processing complete.`);

                updateBars();
            }, 1500);
        }
    };

    // ====================================================
    // SCALABILITY CANVAS — Animated dots scaling up
    // ====================================================
    const scaleCanvas = document.getElementById('scaleCanvas');
    if (scaleCanvas) {
        const sCtx = scaleCanvas.getContext('2d');
        let sW, sH;
        let scaleDots = [];
        let targetCount = 10;
        let currentVisible = 0;
        let scaleAnimating = false;

        function resizeScale() {
            const rect = scaleCanvas.parentElement.getBoundingClientRect();
            sW = scaleCanvas.width = rect.width * window.devicePixelRatio;
            sH = scaleCanvas.height = rect.height * window.devicePixelRatio;
            scaleCanvas.style.width = rect.width + 'px';
            scaleCanvas.style.height = rect.height + 'px';
            sCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
        resizeScale();
        window.addEventListener('resize', resizeScale);

        // Pre-generate 1000 dot positions
        for (let i = 0; i < 1000; i++) {
            scaleDots.push({
                x: Math.random(),
                y: Math.random(),
                vx: (Math.random() - 0.5) * 0.0005,
                vy: (Math.random() - 0.5) * 0.0005,
                visible: i < 10,
            });
        }

        function drawScale() {
            const rW = sW / window.devicePixelRatio;
            const rH = sH / window.devicePixelRatio;

            sCtx.clearRect(0, 0, rW, rH);
            sCtx.fillStyle = '#060c18';
            sCtx.fillRect(0, 0, rW, rH);

            // Grid
            sCtx.strokeStyle = 'rgba(0, 230, 255, 0.03)';
            sCtx.lineWidth = 1;
            for (let x = 0; x < rW; x += 40) {
                sCtx.beginPath(); sCtx.moveTo(x, 0); sCtx.lineTo(x, rH); sCtx.stroke();
            }
            for (let y = 0; y < rH; y += 40) {
                sCtx.beginPath(); sCtx.moveTo(0, y); sCtx.lineTo(rW, y); sCtx.stroke();
            }

            // Dots
            let visibleCount = 0;
            scaleDots.forEach(d => {
                if (!d.visible) return;
                visibleCount++;

                d.x += d.vx;
                d.y += d.vy;
                if (d.x < 0 || d.x > 1) d.vx *= -1;
                if (d.y < 0 || d.y > 1) d.vy *= -1;

                const dx = d.x * rW, dy = d.y * rH;
                sCtx.beginPath();
                sCtx.arc(dx, dy, 2, 0, Math.PI * 2);
                sCtx.fillStyle = 'rgba(0, 255, 136, 0.7)';
                sCtx.fill();
            });

            requestAnimationFrame(drawScale);
        }
        drawScale();

        // Scale up animation triggered by scroll
        function triggerScaleAnimation() {
            if (scaleAnimating) return;
            scaleAnimating = true;

            const stages = [10, 100, 1000];
            let stageIdx = 0;

            function nextStage() {
                if (stageIdx >= stages.length) return;
                const target = stages[stageIdx];

                // Reveal dots
                for (let i = 0; i < target; i++) {
                    scaleDots[i].visible = true;
                }

                // Animate counter
                const prev = stageIdx > 0 ? stages[stageIdx - 1] : 0;
                animateValue('scaleNum', prev, target, 1500);

                stageIdx++;
                if (stageIdx < stages.length) {
                    setTimeout(nextStage, 2000);
                }
            }
            nextStage();
        }

        // Use IntersectionObserver for scroll trigger
        const scaleObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    triggerScaleAnimation();
                    scaleObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        scaleObserver.observe(scaleCanvas.parentElement);
    }

    // ====================================================
    // FOOTER CANVAS — Subtle moving network lines
    // ====================================================
    const footerCanvas = document.getElementById('footerCanvas');
    if (footerCanvas) {
        const fCtx = footerCanvas.getContext('2d');
        let fW, fH;

        function resizeFooter() {
            const rect = footerCanvas.parentElement.getBoundingClientRect();
            fW = footerCanvas.width = rect.width * window.devicePixelRatio;
            fH = footerCanvas.height = rect.height * window.devicePixelRatio;
            footerCanvas.style.width = rect.width + 'px';
            footerCanvas.style.height = rect.height + 'px';
            fCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
        resizeFooter();
        window.addEventListener('resize', resizeFooter);

        const fNodes = [];
        for (let i = 0; i < 40; i++) {
            fNodes.push({
                x: Math.random(), y: Math.random(),
                vx: (Math.random() - 0.5) * 0.0003,
                vy: (Math.random() - 0.5) * 0.0003,
            });
        }

        function drawFooter() {
            const rW = fW / window.devicePixelRatio;
            const rH = fH / window.devicePixelRatio;

            fCtx.clearRect(0, 0, rW, rH);

            // Move nodes
            fNodes.forEach(n => {
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > 1) n.vx *= -1;
                if (n.y < 0 || n.y > 1) n.vy *= -1;
            });

            // Draw connections
            fCtx.strokeStyle = 'rgba(0, 230, 255, 0.06)';
            fCtx.lineWidth = 1;
            for (let i = 0; i < fNodes.length; i++) {
                for (let j = i + 1; j < fNodes.length; j++) {
                    const dx = (fNodes[i].x - fNodes[j].x) * rW;
                    const dy = (fNodes[i].y - fNodes[j].y) * rH;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        fCtx.beginPath();
                        fCtx.moveTo(fNodes[i].x * rW, fNodes[i].y * rH);
                        fCtx.lineTo(fNodes[j].x * rW, fNodes[j].y * rH);
                        fCtx.stroke();
                    }
                }
            }

            // Draw dots
            fNodes.forEach(n => {
                fCtx.beginPath();
                fCtx.arc(n.x * rW, n.y * rH, 2, 0, Math.PI * 2);
                fCtx.fillStyle = 'rgba(0, 230, 255, 0.2)';
                fCtx.fill();
            });

            requestAnimationFrame(drawFooter);
        }
        drawFooter();
    }
})();