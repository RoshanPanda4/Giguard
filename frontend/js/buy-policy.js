function toggleLanguage() {
    const newLang = i18n.currentLang === 'en' ? 'hi' : 'en';
    i18n.setLanguage(newLang);
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('risk-form');
    const generateBtn = document.getElementById('generate-btn');
    const btnText = generateBtn.querySelector('.btn-text');
    const loader = generateBtn.querySelector('.loader');
    const loadingText = document.getElementById('loading-text');
    
    const policyCard = document.getElementById('policy-card');
    const riskLevelText = document.getElementById('risk-level-text');
    const riskScoreValue = document.getElementById('risk-score-value');
    const riskProgress = document.getElementById('risk-progress');
    const displayPremium = document.getElementById('display-premium');
    const displayCoverage = document.getElementById('display-coverage');
    
    const activateBtn = document.getElementById('activate-btn');

    // Auto-fill form data from user dashboard (via backend profile)
    const token = localStorage.getItem('token');
    if (token) {
        fetch('https://giguard.onrender.com/api/user/profile', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.profile) {
                    const p = data.profile;
                    if (p.name) document.getElementById('name').value = p.name;
                    if (p.platform) document.getElementById('platform').value = p.platform;
                    if (p.zone) document.getElementById('zone').value = p.zone;
                    if (p.income) document.getElementById('daily-income').value = p.income;
                }
            })
            .catch(err => console.log('Profile fetch error:', err));
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const platform = document.getElementById('platform').value;
        const zone = document.getElementById('zone').value;
        const dailyIncome = parseFloat(document.getElementById('daily-income').value);
        const workHours = parseFloat(document.getElementById('work-hours').value);
        
        if(!platform || !zone || isNaN(dailyIncome) || isNaN(workHours)) {
            return showToast('Please fill all fields correctly.', 'error');
        }

        // UI loading
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        loadingText.classList.remove('hidden');
        generateBtn.disabled = true;

        try {
            // Call the correct AI Engine to get dynamic pricing
            const aiPayload = {
                platform,
                zone,
                dailyIncome,
                workHours,
                weather: 'normal',
                reports: 0
            };

            // Pass through our backend proxy to avoid CORS
            const res = await fetch('https://giguard.onrender.com/api/simulation', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify(aiPayload)
            });

            const data = await res.json();

            // restore UI
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            loadingText.classList.add('hidden');
            generateBtn.disabled = false;

            if(res.ok && data.success) {
                // Store globally so the activate button can use it
                window.generatedPolicy = { coverage: data.coverage, premium: data.premium, zone, platform };
                showGeneratedPolicy(data);
            } else {
                showToast(data.error || 'Failed to generate policy', 'error');
            }

        } catch (err) {
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            loadingText.classList.add('hidden');
            generateBtn.disabled = false;
            showToast('Server error connecting to AI API.', 'error');
        }
    });

    activateBtn.addEventListener('click', async () => {
        activateBtn.disabled = true;
        activateBtn.textContent = 'Redirecting to Payment...';
        
        // Save the dynamic AI policy details to BACKEND for the payment page to display
        if (window.generatedPolicy) {
            try {
                await fetch('https://giguard.onrender.com/api/policy/pending', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(window.generatedPolicy)
                });
            } catch (err) {
                console.error("Failed to post pending policy", err);
            }
        }

        // Navigate to payment page
        setTimeout(() => {
            window.location.href = 'payment.html';
        }, 500);
    });

    function showGeneratedPolicy(data) {
        // Map to exact AI properties
        const risk = parseFloat(data.risk) || 0;
        riskScoreValue.textContent = risk.toFixed(2);
        displayPremium.textContent = `₹${data.premium} / week`;
        displayCoverage.textContent = `₹${data.coverage}`;

        let riskText = 'Low';
        let riskClass = 'risk-low';
        let progressPercent = (risk / 1.0) * 100;

        if (risk >= 0.7) {
            riskText = 'High';
            riskClass = 'risk-high';
        } else if (risk >= 0.4) {
            riskText = 'Medium';
            riskClass = 'risk-medium';
        }

        riskLevelText.textContent = riskText;
        riskLevelText.className = `risk-text ${riskClass}`;
        
        riskProgress.style.width = '0%';
        riskProgress.className = `progress-bar ${riskClass}`;
        
        policyCard.classList.remove('hidden');
        policyCard.classList.add('fade-in');

        setTimeout(() => {
            riskProgress.style.width = `${progressPercent}%`;
        }, 100);
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        
        const icon = type === 'success' ? '✓' : '⚠';
        const color = type === 'success' ? '#10b981' : '#ef4444';

        toast.innerHTML = `
            <span style="color:${color}; margin-right:8px;">${icon}</span>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
});