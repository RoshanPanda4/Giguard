/* ====================================================
   claim.js — Claim Decision Page Logic
   Reads AI simulation results from localStorage
   and populates claim decision UI
   ==================================================== */

(function () {
    'use strict';

    // ===== Load simulation data from backend =====
    document.addEventListener('DOMContentLoaded', async () => {
        const token = localStorage.getItem('token');
        if (!token) return showEmpty();

        try {
            const res = await fetch('https://giguard.onrender.com/api/simulation/result', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const dbRef = await res.json();
            
            if (!dbRef.success || !dbRef.result) {
                return showEmpty();
            }

            const data = dbRef.result;

            // ===== 1. AI EXPLANATION CARD =====
            populateExplanation(data.explanation);

            // ===== 2. EVENT SUMMARY CARD =====
            populateEvents(data.events);

            // ===== 3. CLAIM DECISION CARD =====
            populateDecision(data.claim, data.risk, data.fraud);

            // ===== 4. SYSTEM IMPACT CARD =====
            populateImpact(data.claim);

            // ===== 5. CTA BUTTON =====
            setupCTA(data.claim);

        } catch (e) {
            console.error("Failed to load claims", e);
            showEmpty();
        }
    });

    function showEmpty() {
        document.getElementById('claimContent').style.display = 'none';
        document.getElementById('emptyState').classList.add('show');
    }

    // ===========================================================
    //  SECTION POPULATORS
    // ===========================================================

    function populateExplanation(explanation) {
        const list = document.getElementById('explanationList');
        if (!list) return;

        list.innerHTML = '';

        // AI explanation can be an object with `factors` array,
        // a plain array of strings, or an object with assorted keys
        let factors = [];

        if (Array.isArray(explanation)) {
            factors = explanation;
        } else if (explanation && typeof explanation === 'object') {
            // Try common keys the AI might return
            if (Array.isArray(explanation.factors)) {
                factors = explanation.factors;
            } else if (Array.isArray(explanation.reasons)) {
                factors = explanation.reasons;
            } else if (explanation.summary) {
                factors.push(explanation.summary);
            }

            // Add any additional fields as explanatory text
            if (explanation.model) factors.push(`Model: ${explanation.model}`);
            if (explanation.confidence) factors.push(`Confidence: ${(explanation.confidence * 100).toFixed(0)}%`);

            // If explanation is an object with string values, extract them
            if (factors.length === 0) {
                Object.entries(explanation).forEach(([key, val]) => {
                    if (typeof val === 'string' || typeof val === 'number') {
                        factors.push(`${formatKey(key)}: ${val}`);
                    } else if (Array.isArray(val)) {
                        val.forEach(item => factors.push(String(item)));
                    }
                });
            }
        }

        // Fallback if nothing was extracted
        if (factors.length === 0) {
            factors = [
                'AI analysis completed',
                `Risk score computed: ${data.risk}`,
                `Claim ${data.claim?.approved ? 'approved' : 'rejected'} based on parametric thresholds`
            ];
        }

        factors.forEach(text => {
            const li = document.createElement('li');
            li.textContent = String(text);
            list.appendChild(li);
        });
    }

    function populateEvents(events) {
        if (!events) return;

        // Rain
        const evtRain = document.getElementById('evtRain');
        const evtRainVal = document.getElementById('evtRainVal');
        if (events.rain) {
            evtRain.classList.add('active');
            const intensity = events.rainIntensity || 'detected';
            evtRainVal.textContent = intensity.charAt(0).toUpperCase() + intensity.slice(1);
            evtRainVal.style.color = intensity === 'high' ? 'var(--danger)' : intensity === 'medium' ? 'var(--warning)' : 'var(--accent-cyan)';
        } else {
            evtRain.classList.add('inactive');
            evtRainVal.textContent = 'Not detected';
        }

        // Surge
        const evtSurge = document.getElementById('evtSurge');
        const evtSurgeVal = document.getElementById('evtSurgeVal');
        if (events.surge) {
            evtSurge.classList.add('active');
            evtSurgeVal.textContent = 'Active';
            evtSurgeVal.style.color = 'var(--danger)';
        } else {
            evtSurge.classList.add('inactive');
            evtSurgeVal.textContent = 'Inactive';
        }

        // Delivery Drop
        const evtDeliveryVal = document.getElementById('evtDeliveryVal');
        const evtDelivery = document.getElementById('evtDelivery');
        if (events.deliveryDrop !== undefined && events.deliveryDrop > 0) {
            evtDelivery.classList.add('active');
            evtDeliveryVal.textContent = events.deliveryDrop + '%';
            if (events.deliveryDrop > 60) evtDeliveryVal.style.color = 'var(--danger)';
            else if (events.deliveryDrop > 30) evtDeliveryVal.style.color = 'var(--warning)';
            else evtDeliveryVal.style.color = 'var(--accent-cyan)';
        } else {
            evtDelivery.classList.add('inactive');
            evtDeliveryVal.textContent = 'Normal';
        }

        // Reports
        const evtReportsVal = document.getElementById('evtReportsVal');
        const evtReports = document.getElementById('evtReports');
        if (events.reportLevel && events.reportLevel !== 'none') {
            evtReports.classList.add('active');
            evtReportsVal.textContent = events.reportLevel.charAt(0).toUpperCase() + events.reportLevel.slice(1);
            if (events.reportLevel === 'high') evtReportsVal.style.color = 'var(--danger)';
            else if (events.reportLevel === 'medium') evtReportsVal.style.color = 'var(--warning)';
            else evtReportsVal.style.color = 'var(--accent-cyan)';
        } else {
            evtReports.classList.add('inactive');
            evtReportsVal.textContent = 'None';
        }
    }

    function populateDecision(claim, risk, fraud) {
        const card = document.getElementById('decisionCard');
        const statusEl = document.getElementById('decisionStatus');
        const textEl = document.getElementById('decisionText');
        const payoutEl = document.getElementById('decPayout');
        const riskEl = document.getElementById('decRisk');
        const reasonEl = document.getElementById('decisionReason');

        if (!claim) return;

        if (claim.approved) {
            card.classList.add('approved');
            statusEl.classList.add('approved');
            textEl.textContent = 'CLAIM APPROVED';
            payoutEl.textContent = '₹' + (claim.payout || 0).toLocaleString();
            payoutEl.style.color = 'var(--success)';
        } else {
            card.classList.add('rejected');
            statusEl.classList.add('rejected');
            textEl.textContent = 'CLAIM REJECTED';
            payoutEl.textContent = '₹0';
            payoutEl.style.color = 'var(--danger)';
        }

        // Risk score
        riskEl.textContent = parseFloat(risk || 0).toFixed(2);
        if (risk > 0.7) riskEl.style.color = 'var(--danger)';
        else if (risk > 0.4) riskEl.style.color = 'var(--warning)';
        else riskEl.style.color = 'var(--accent-cyan)';

        // Reason
        if (claim.reason) {
            reasonEl.style.display = 'block';
            reasonEl.textContent = claim.reason;
            reasonEl.style.borderLeftColor = claim.approved ? 'var(--success)' : 'var(--danger)';
        }

        // Fraud detection
        if (fraud) {
            const fraudBadge = document.createElement('div');
            fraudBadge.style.cssText = `
                margin-top: 1rem;
                padding: 0.6rem 1rem;
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                border-radius: 8px;
                color: var(--danger);
                font-size: 0.85rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            `;
            fraudBadge.innerHTML = '🚨 <span>Fraud Detection: Flagged for review</span>';
            document.querySelector('.decision-content').appendChild(fraudBadge);
        }
    }

    function populateImpact(claim) {
        if (!claim) return;

        const impWorkers = document.getElementById('impWorkers');
        const impPayout = document.getElementById('impPayout');
        const impZones = document.getElementById('impZones');

        // Animate counts
        animateCount(impWorkers, claim.workersAffected || 0);
        animateCount(impPayout, claim.totalPayout || 0, '₹');
        animateCount(impZones, claim.zonesImpacted || 0);
    }

    function setupCTA(claim) {
        const ctaBtn = document.getElementById('ctaBtn');
        if (!claim || !claim.approved) {
            ctaBtn.classList.add('disabled');
            ctaBtn.textContent = '❌ No Payout Available';
            ctaBtn.removeAttribute('href');
        }
    }

    // ===========================================================
    //  HELPERS
    // ===========================================================

    function animateCount(el, target, prefix) {
        prefix = prefix || '';
        const duration = 1200;
        const startTime = performance.now();

        function step(ts) {
            const progress = Math.min((ts - startTime) / duration, 1);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(target * eased);
            el.textContent = prefix + current.toLocaleString();
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    function formatKey(key) {
        return key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, c => c.toUpperCase())
            .trim();
    }

})();
