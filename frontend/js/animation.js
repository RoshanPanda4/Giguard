/* ====================================================
   animations.js — GSAP ScrollTrigger animations
   Handles: hero entrance, architecture flow reveal,
   feature cards, tech stack badges, and section fades
   ==================================================== */

(function () {
    gsap.registerPlugin(ScrollTrigger);

    // --- Hero Entrance Animation ---
    const heroTL = gsap.timeline({ defaults: { ease: 'power3.out' } });

    heroTL
        .from('.hero-badge', { y: 30, opacity: 0, duration: 0.8 })
        .from('.hero-title .line', { y: 60, opacity: 0, duration: 1, stagger: 0.15 }, '-=0.4')
        .from('.hero-subtitle', { y: 30, opacity: 0, duration: 0.8 }, '-=0.5')
        .from('.hero-actions', { y: 30, opacity: 0, duration: 0.8 }, '-=0.4')
        .from('.hero-stats', { y: 40, opacity: 0, duration: 0.8 }, '-=0.3');

    // --- Navbar scroll effect ---
    ScrollTrigger.create({
        start: 'top -80',
        onEnter: () => document.getElementById('navbar').style.borderBottomColor = 'rgba(0,230,255,0.12)',
        onLeaveBack: () => document.getElementById('navbar').style.borderBottomColor = 'rgba(0,230,255,0.06)',
    });

    // --- Section headers fade ---
    gsap.utils.toArray('.section-header').forEach(header => {
        const children = header.children;
        gsap.set(children, { opacity: 0, y: 40 });
        ScrollTrigger.create({
            trigger: header,
            start: 'top 88%',
            onEnter: () => {
                gsap.to(children, {
                    y: 0, opacity: 1, duration: 0.8, stagger: 0.15,
                    ease: 'power3.out',
                });
            },
            once: true,
        });
    });

    // --- Architecture Flow: step-by-step reveal ---
    const archNodes = gsap.utils.toArray('.arch-node');
    const archConnectors = gsap.utils.toArray('.arch-connector');

    // Set initial state
    gsap.set(archNodes, { opacity: 0, y: 30 });
    gsap.set(archConnectors, { scaleX: 0, transformOrigin: 'left center' });

    ScrollTrigger.create({
        trigger: '#archFlow',
        start: 'top 80%',
        onEnter: () => {
            archNodes.forEach((node, i) => {
                gsap.to(node, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', delay: i * 0.15 });
                if (archConnectors[i]) {
                    gsap.to(archConnectors[i], { scaleX: 1, duration: 0.3, ease: 'power2.out', delay: i * 0.15 + 0.15 });
                }
            });
        },
        once: true,
    });

    // --- Feature cards stagger ---
    const featureCards = gsap.utils.toArray('.feature-card');
    gsap.set(featureCards, { opacity: 0, y: 50 });

    ScrollTrigger.create({
        trigger: '.features-grid',
        start: 'top 85%',
        onEnter: () => {
            gsap.to(featureCards, {
                y: 0, opacity: 1, duration: 0.7, stagger: 0.1,
                ease: 'power3.out',
            });
        },
        once: true,
    });

    // --- Simulation dashboard ---
    gsap.set('.sim-controls', { opacity: 0, x: -60 });
    ScrollTrigger.create({
        trigger: '.sim-dashboard',
        start: 'top 85%',
        onEnter: () => {
            gsap.to('.sim-controls', { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
        },
        once: true,
    });

    const metricCards = gsap.utils.toArray('.metric-card');
    gsap.set(metricCards, { opacity: 0, y: 40 });
    ScrollTrigger.create({
        trigger: '.sim-metrics',
        start: 'top 88%',
        onEnter: () => {
            gsap.to(metricCards, {
                y: 0, opacity: 1, duration: 0.6, stagger: 0.12,
                ease: 'power3.out',
            });
        },
        once: true,
    });

    // --- Tech stack badges ---
    ScrollTrigger.create({
        trigger: '.stack-grid',
        start: 'top 85%',
        onEnter: () => {
            gsap.to('.stack-badge', {
                y: 0, opacity: 1, duration: 0.5, stagger: 0.06,
                ease: 'power3.out',
            });
        },
        once: true,
    });

    // --- Map section ---
    gsap.set('.map-wrapper', { opacity: 0, y: 60 });
    ScrollTrigger.create({
        trigger: '.map-wrapper',
        start: 'top 88%',
        onEnter: () => {
            gsap.to('.map-wrapper', { y: 0, opacity: 1, duration: 1, ease: 'power3.out' });
        },
        once: true,
    });

    // --- Scalability section ---
    gsap.set('.scale-visual', { opacity: 0, y: 60 });
    ScrollTrigger.create({
        trigger: '.scale-visual',
        start: 'top 88%',
        onEnter: () => {
            gsap.to('.scale-visual', { y: 0, opacity: 1, duration: 1, ease: 'power3.out' });
        },
        once: true,
    });

    // --- Footer ---
    gsap.set('.footer-content', { opacity: 0, y: 40 });
    ScrollTrigger.create({
        trigger: '.footer-section',
        start: 'top 92%',
        onEnter: () => {
            gsap.to('.footer-content', { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
        },
        once: true,
    });

    // --- Smooth scroll helpers ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // --- Mobile menu toggle ---
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.querySelector('.nav-links');

    function openMobileMenu() {
        navLinks.classList.add('mobile-open');
        mobileToggle.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Inject close button if not already present
        if (!navLinks.querySelector('.mobile-close')) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'mobile-close';
            closeBtn.setAttribute('aria-label', 'Close Menu');
            closeBtn.innerHTML = '✕';
            closeBtn.addEventListener('click', closeMobileMenu);
            navLinks.prepend(closeBtn);
        }
    }

    function closeMobileMenu() {
        navLinks.classList.remove('mobile-open');
        mobileToggle.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            if (navLinks.classList.contains('mobile-open')) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }

    // Auto-close mobile menu when a nav link is tapped
    navLinks.querySelectorAll('a, .btn-cta-nav').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('mobile-open')) {
                closeMobileMenu();
            }
        });
    });

    // --- Fallback: make everything visible after 2 seconds ---
    // In case any ScrollTrigger fails silently
    setTimeout(() => {
        const selectors = [
            '.feature-card', '.arch-node', '.arch-connector',
            '.metric-card', '.stack-badge', '.map-wrapper',
            '.scale-visual', '.sim-controls', '.footer-content',
            '.section-header > *'
        ];
        document.querySelectorAll(selectors.join(', ')).forEach(el => {
            if (parseFloat(getComputedStyle(el).opacity) < 0.1) {
                el.style.opacity = '1';
                el.style.transform = 'none';
                el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            }
        });
    }, 2000);
})();