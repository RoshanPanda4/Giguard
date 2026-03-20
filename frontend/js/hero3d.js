/* ====================================================
   hero3d.js — Three.js 3D City Grid Animation
   Represents the GigGuard delivery network:
   - Grid = City map
   - Moving dots = Gig workers
   - Pulsing clusters = Delivery zones
   - Central glowing node = AI Risk Engine
   - Signal waves = Data flowing to AI node
   ==================================================== */

(function () {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 18, 22);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- City Grid ---
    const gridSize = 40;
    const gridDiv = 30;
    const gridHelper = new THREE.GridHelper(gridSize, gridDiv, 0x0a1a3a, 0x0a1a3a);
    gridHelper.material.opacity = 0.35;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // --- Delivery Zones (pulsing clusters) ---
    const zones = [];
    const zonePositions = [
        { x: -8, z: -6, color: 0x00ff88 },
        { x: 6, z: -8, color: 0x00e6ff },
        { x: -5, z: 7, color: 0x00e6ff },
        { x: 10, z: 5, color: 0x00ff88 },
        { x: 0, z: -12, color: 0x3b82f6 },
    ];

    zonePositions.forEach(zp => {
        const geo = new THREE.RingGeometry(1.2, 1.6, 32);
        const mat = new THREE.MeshBasicMaterial({ color: zp.color, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
        const ring = new THREE.Mesh(geo, mat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(zp.x, 0.05, zp.z);
        scene.add(ring);

        // Inner glow
        const innerGeo = new THREE.CircleGeometry(1.2, 32);
        const innerMat = new THREE.MeshBasicMaterial({ color: zp.color, transparent: true, opacity: 0.06, side: THREE.DoubleSide });
        const inner = new THREE.Mesh(innerGeo, innerMat);
        inner.rotation.x = -Math.PI / 2;
        inner.position.set(zp.x, 0.04, zp.z);
        scene.add(inner);

        zones.push({ ring, inner, baseOpacity: 0.25, zp });
    });

    // --- Central AI Node ---
    const aiNodeGeo = new THREE.OctahedronGeometry(0.8, 0);
    const aiNodeMat = new THREE.MeshBasicMaterial({ color: 0x00e6ff, wireframe: true, transparent: true, opacity: 0.9 });
    const aiNode = new THREE.Mesh(aiNodeGeo, aiNodeMat);
    aiNode.position.set(0, 3, 0);
    scene.add(aiNode);

    // AI glow sphere
    const glowGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00e6ff, transparent: true, opacity: 0.08 });
    const glowSphere = new THREE.Mesh(glowGeo, glowMat);
    glowSphere.position.copy(aiNode.position);
    scene.add(glowSphere);

    // --- Shield Icon (floating above city) ---
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(0, 1.5);
    shieldShape.quadraticCurveTo(1.2, 1, 1.2, 0);
    shieldShape.quadraticCurveTo(1.2, -1.2, 0, -1.8);
    shieldShape.quadraticCurveTo(-1.2, -1.2, -1.2, 0);
    shieldShape.quadraticCurveTo(-1.2, 1, 0, 1.5);

    const shieldGeo = new THREE.ShapeGeometry(shieldShape);
    const shieldMat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.15, side: THREE.DoubleSide });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(0, 7, 0);
    shield.scale.set(0.8, 0.8, 0.8);
    scene.add(shield);

    // Shield wireframe
    const shieldEdge = new THREE.EdgesGeometry(shieldGeo);
    const shieldLine = new THREE.LineSegments(shieldEdge, new THREE.LineBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.5 }));
    shieldLine.position.copy(shield.position);
    shieldLine.scale.copy(shield.scale);
    scene.add(shieldLine);

    // --- Gig Workers (moving dots) ---
    const workers = [];
    const workerCount = 60;

    for (let i = 0; i < workerCount; i++) {
        const geo = new THREE.SphereGeometry(0.08, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00e6ff, transparent: true, opacity: 0.8 });
        const dot = new THREE.Mesh(geo, mat);
        const startX = (Math.random() - 0.5) * gridSize * 0.8;
        const startZ = (Math.random() - 0.5) * gridSize * 0.8;
        dot.position.set(startX, 0.15, startZ);
        scene.add(dot);

        const speed = 0.005 + Math.random() * 0.015;
        const angle = Math.random() * Math.PI * 2;
        workers.push({ mesh: dot, vx: Math.cos(angle) * speed, vz: Math.sin(angle) * speed });
    }

    // --- Connection Lines from zones to AI Node ---
    const connectionLines = [];
    zonePositions.forEach(zp => {
        const points = [
            new THREE.Vector3(zp.x, 0.1, zp.z),
            new THREE.Vector3(zp.x * 0.3, 2, zp.z * 0.3),
            new THREE.Vector3(0, 3, 0)
        ];
        const curve = new THREE.QuadraticBezierCurve3(points[0], points[1], points[2]);
        const curvePoints = curve.getPoints(30);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x00e6ff, transparent: true, opacity: 0.12 });
        const line = new THREE.Line(lineGeo, lineMat);
        scene.add(line);
        connectionLines.push({ line, curve });
    });

    // --- Signal wave particles ---
    const signals = [];
    function createSignal(zoneIdx) {
        const zp = zonePositions[zoneIdx];
        const geo = new THREE.SphereGeometry(0.12, 8, 8);
        const mat = new THREE.MeshBasicMaterial({ color: 0x00ff88, transparent: true, opacity: 0.9 });
        const dot = new THREE.Mesh(geo, mat);
        dot.position.set(zp.x, 0.1, zp.z);
        scene.add(dot);
        signals.push({ mesh: dot, t: 0, curve: connectionLines[zoneIdx].curve, speed: 0.008 + Math.random() * 0.005 });
    }

    // Mouse interactivity
    let mouseX = 0, mouseY = 0;
    document.addEventListener('mousemove', e => {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Disruption state
    let disrupted = false;
    const disruptBtn = document.getElementById('btnSimulateDisruption');
    if (disruptBtn) {
        disruptBtn.addEventListener('click', () => {
            disrupted = !disrupted;
            disruptBtn.querySelector('span').textContent = disrupted ? 'Reset System' : 'Simulate Disruption';
            // Also trigger risk map simulation
            if (disrupted && typeof setMapState === 'function') setMapState('rain');
            if (!disrupted && typeof setMapState === 'function') setMapState('normal');
        });
    }

    // Animation loop
    const clock = new THREE.Clock();

    function animate() {
        const t = clock.getElapsedTime();

        // AI Node rotation & pulse
        aiNode.rotation.y = t * 0.5;
        aiNode.rotation.x = Math.sin(t * 0.3) * 0.2;
        const glowScale = 1 + Math.sin(t * 2) * 0.15;
        glowSphere.scale.set(glowScale, glowScale, glowScale);

        // Shield floating
        shield.position.y = 7 + Math.sin(t * 0.8) * 0.3;
        shieldLine.position.y = shield.position.y;
        shield.rotation.y = t * 0.15;
        shieldLine.rotation.y = shield.rotation.y;

        // Zone pulsing
        zones.forEach((z, i) => {
            const pulse = disrupted
                ? 0.4 + Math.sin(t * 4 + i) * 0.3
                : 0.2 + Math.sin(t * 1.5 + i * 1.2) * 0.1;
            z.ring.material.opacity = pulse;
            z.inner.material.opacity = disrupted ? 0.15 : 0.06;
            if (disrupted) {
                z.ring.material.color.setHex(0xff4060);
                z.inner.material.color.setHex(0xff4060);
            } else {
                z.ring.material.color.setHex(z.zp.color);
                z.inner.material.color.setHex(z.zp.color);
            }
            const s = 1 + Math.sin(t * 2 + i) * 0.08;
            z.ring.scale.set(s, s, s);
        });

        // Worker movement
        const boundary = gridSize * 0.4;
        workers.forEach(w => {
            w.mesh.position.x += w.vx;
            w.mesh.position.z += w.vz;
            if (Math.abs(w.mesh.position.x) > boundary) w.vx *= -1;
            if (Math.abs(w.mesh.position.z) > boundary) w.vz *= -1;
        });

        // Signal waves
        if (Math.random() < (disrupted ? 0.08 : 0.02)) {
            createSignal(Math.floor(Math.random() * zonePositions.length));
        }

        for (let i = signals.length - 1; i >= 0; i--) {
            const s = signals[i];
            s.t += s.speed;
            if (s.t >= 1) {
                scene.remove(s.mesh);
                signals.splice(i, 1);
            } else {
                const p = s.curve.getPoint(s.t);
                s.mesh.position.copy(p);
                s.mesh.material.opacity = 1 - s.t;
            }
        }

        // Camera parallax with mouse
        camera.position.x += (mouseX * 3 - camera.position.x) * 0.02;
        camera.position.z = 22 + mouseY * 2;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    animate();

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
})();