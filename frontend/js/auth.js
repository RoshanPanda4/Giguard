const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const tabIndicator = document.querySelector('.tab-indicator');

// Handle Theme Switching for Tabs
function switchTheme(tab) {
    if (tab === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        tabIndicator.style.transform = 'translateX(0)';
    } else {
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        tabIndicator.style.transform = 'translateX(100%)';
    }
}

// Toggle Password Visibility
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const svg = btn.querySelector('svg');
    
    if (input.type === 'password') {
        input.type = 'text';
        // Eye off icon
        svg.innerHTML = `
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        `;
    } else {
        input.type = 'password';
        // Eye icon
        svg.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        `;
    }
}

// Custom Toast Notification System
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' 
        ? `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
        : `<svg class="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

    toast.innerHTML = `
        ${icon}
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Animate out and remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

// Set Button Loading State
function setButtonLoading(btnId, isLoading) {
    const btn = document.getElementById(btnId);
    if (isLoading) {
        btn.classList.add('loading');
    } else {
        btn.classList.remove('loading');
    }
}

// Signup Form Validation & Submission
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const platform = document.getElementById('platform').value;
    const zone = document.getElementById('zone').value.trim();
    const income = document.getElementById('income').value.trim();
    const password = document.getElementById('signupPassword').value;

    // Validation Rules
    if (!name || !phone || !platform || !zone || !income || !password) {
        showToast("Please fill all required fields", "error");
        return;
    }
    
    if (phone.length < 10 || !/^\d+$/.test(phone)) {
        showToast("Invalid phone number length", "error");
        return;
    }
    
    if (isNaN(income) || income <= 0) {
        showToast("Income must be a valid number", "error");
        return;
    }

    setButtonLoading('signupBtn', true);
    
    // Network Request to Backend API
    try {
        const payload = { name, phone, platform, zone, income, password };
        const response = await fetch('https://safegig-pink.vercel.app/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        setButtonLoading('signupBtn', false);

        if (response.ok && data.success) {
            showToast("Account created successfully", "success");
            
            // Auto-switch to login mode and fill email/phone
            setTimeout(() => {
                switchTheme('login');
                document.getElementById('loginEmail').value = phone;
                document.getElementById('signupPassword').value = '';
                signupForm.reset();
            }, 1200);
        } else {
            showToast(data.error || "Failed to create account", "error");
        }
    } catch(error) {
        setButtonLoading('signupBtn', false);
        showToast("Server error. Try again later.", "error");
    }
});

// Login Form Validation & Submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showToast("Please fill all required fields", "error");
        return;
    }

    setButtonLoading('loginBtn', true);

    // Network Request to Backend API
    try {
        const response = await fetch('https://giguard.onrender.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        setButtonLoading('loginBtn', false);
        
        if (response.ok && data.success) {
            showToast("Login successful", "success");
            localStorage.setItem("isAuthenticated", "true");
            localStorage.setItem("userId", data.userId);
            if(data.name) localStorage.setItem("userName", data.name);
            
            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 1200);
        } else {
            showToast(data.error || "Login failed", "error");
        }
    } catch (error) {
        setButtonLoading('loginBtn', false);
        showToast("Server error. Try again later.", "error");
    }
});