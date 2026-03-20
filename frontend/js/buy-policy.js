document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const form = document.getElementById('risk-form');
    const generateBtn = document.getElementById('generate-btn');
    const btnText = generateBtn.querySelector('.btn-text');
    const loader = generateBtn.querySelector('.loader');
    const loadingText = document.getElementById('loading-text');
    
    // Policy Card Elements
    const policyCard = document.getElementById('policy-card');
    const riskLevelText = document.getElementById('risk-level-text');
    const riskScoreValue = document.getElementById('risk-score-value');
    const riskProgress = document.getElementById('risk-progress');
    const displayPremium = document.getElementById('display-premium');
    const displayCoverage = document.getElementById('display-coverage');
    
    // Activation Elements
    const activateBtn = document.getElementById('activate-btn');
    const statusCard = document.getElementById('status-card');
    const renewalDateSpan = document.getElementById('renewal-date');
    
    // Zone Risk Map
    const zoneRiskMap = {
        'Patia': 0.60,
        'KIIT': 0.65,
        'Khandagiri': 0.72,
        'Saheed Nagar': 0.68
    };

    // Form Submission / Generate Policy
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const platform = document.getElementById('platform').value;
        const zone = document.getElementById('zone').value;
        const dailyIncome = parseFloat(document.getElementById('daily-income').value);
        const workHours = parseFloat(document.getElementById('work-hours').value);
        
        if(!platform || !zone || isNaN(dailyIncome) || isNaN(workHours)) {
            showToast('Please fill all fields correctly.', 'error');
            return;
        }

        // Processing states visuals
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        loadingText.classList.remove('hidden');
        generateBtn.disabled = true;

        try {
            const res = await fetch('https://giguard.onrender.com/api/policy/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform, zone, dailyIncome, workHours })
            });

            const data = await res.json();
            
            // Restore btn
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            loadingText.classList.add('hidden');
            generateBtn.disabled = false;
            
            if(res.ok && data.success) {
                showGeneratedPolicy(data);
            } else {
                showToast(data.error || 'Failed to generate policy', 'error');
            }
        } catch (err) {
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            loadingText.classList.add('hidden');
            generateBtn.disabled = false;
            showToast('Server error connecting to backend API.', 'error');
        }
    });

    function showGeneratedPolicy(data) {
        // Update UI
        riskScoreValue.textContent = data.zoneRisk.toFixed(2);
        displayPremium.textContent = `₹${data.premium} / week`;
        displayCoverage.textContent = `₹${data.coverage}`;

        // Risk Meter Logic
        let riskText = 'Low';
        let riskClass = 'risk-low';
        let progressPercent = (data.zoneRisk / 1.0) * 100;

        if (data.zoneRisk >= 0.7) {
            riskText = 'High';
            riskClass = 'risk-high';
        } else if (data.zoneRisk >= 0.65) {
            riskText = 'Medium';
            riskClass = 'risk-medium';
        }

        riskLevelText.textContent = riskText;
        riskLevelText.className = `risk-text ${riskClass}`;
        
        // Reset progress bar for animation
        riskProgress.style.width = '0%';
        riskProgress.className = `progress-bar ${riskClass}`;
        
        // Show Policy Card
        policyCard.classList.remove('hidden');
        policyCard.classList.add('fade-in');

        // Animate meter slightly after card reveals
        setTimeout(() => {
            riskProgress.style.width = `${progressPercent}%`;
        }, 100);

        // Scroll to card on mobile
        if(window.innerWidth <= 850) {
            policyCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Activate Policy -> Redirect to Payment
    activateBtn.addEventListener('click', () => {
        const originalText = activateBtn.textContent;
        activateBtn.textContent = 'Redirecting...';
        activateBtn.disabled = true;

        setTimeout(() => {
            // Save generated policy info to localStorage to show on payment page
            const platform = document.getElementById('platform').value;
            const zone = document.getElementById('zone').value;
            const premiumText = displayPremium.textContent.replace(' / week', '');
            const coverageText = displayCoverage.textContent.replace('₹', '');
            
            const policyData = {
                platform,
                zone,
                premium: premiumText,
                coverage: coverageText
            };
            
            localStorage.setItem('pendingPolicy', JSON.stringify(policyData));
            window.location.href = 'payment.html';

        }, 800);
    });

    // Custom Toast System
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        const icon = type === 'success' ? '✓' : '⚠';
        const borderColor = type === 'success' ? 'var(--primary-accent)' : 'var(--danger)';
        
        toast.style.borderColor = borderColor;
        
        toast.innerHTML = `
            <span class="toast-icon" style="color: ${borderColor}">${icon}</span>
            <span class="toast-message">${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Trigger reflow & animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Remove after 3s
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 400); // Wait for transition out
        }, 3000);
    }
});
