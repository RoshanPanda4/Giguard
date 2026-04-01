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
            // 🔥 FIXED API CALL
            const res = await fetch('https://giguard.onrender.com/api/simulation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform, zone, dailyIncome, workHours })
            });

            const data = await res.json();

            // restore UI
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
        // 🔥 FIXED DATA KEYS
        riskScoreValue.textContent = data.zoneRisk.toFixed(2);
        displayPremium.textContent = `₹${data.premium} / week`;
        displayCoverage.textContent = `₹${data.coverage}`;

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