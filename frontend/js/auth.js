// ========================================
// AUTH + UI + API (FULL REPLACEMENT FILE)
// ========================================

// ------------------ CONFIG ------------------
const API_BASE = "https://giguard.onrender.com/api";

// ------------------ TOKEN ------------------
function setToken(token) {
    localStorage.setItem("token", token);
}

function getToken() {
    return localStorage.getItem("token");
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    window.location.href = "index.html";
}

// ------------------ API CALL ------------------
async function apiFetch(endpoint, options = {}) {
    const token = getToken();

    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(options.headers || {})
        }
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.error || "API error");
    }

    return data;
}

// ------------------ UI ELEMENTS ------------------
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const tabIndicator = document.querySelector('.tab-indicator');

// ------------------ TAB SWITCH ------------------
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

// ------------------ TOAST ------------------
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success'
        ? '✓'
        : '⚠';

    toast.innerHTML = `
        <span style="margin-right:8px;">${icon}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ------------------ BUTTON LOADING ------------------
function setButtonLoading(btnId, isLoading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    if (isLoading) {
        btn.disabled = true;
        btn.innerText = "Processing...";
    } else {
        btn.disabled = false;
        btn.innerText = btnId === 'loginBtn' ? "Login" : "Sign Up";
    }
}

// ========================================
// SIGNUP
// ========================================
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const platform = document.getElementById('platform').value;
    const zone = document.getElementById('zone').value.trim();
    const income = document.getElementById('income').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!name || !phone || !platform || !zone || !income || !password) {
        return showToast("Fill all fields", "error");
    }

    setButtonLoading('signupBtn', true);

    try {
        await apiFetch("/auth/signup", {
            method: "POST",
            body: JSON.stringify({
                name,
                phone,
                platform,
                zone,
                income,
                password
            })
        });

        setButtonLoading('signupBtn', false);
        showToast("Account created successfully");

        setTimeout(() => {
            switchTheme('login');
        }, 1000);

    } catch (err) {
        setButtonLoading('signupBtn', false);
        showToast(err.message || "Signup failed", "error");
    }
});

// ========================================
// LOGIN
// ========================================
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const phone = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!phone || !password) {
        return showToast("Enter credentials", "error");
    }

    setButtonLoading('loginBtn', true);

    try {
        const data = await apiFetch("/auth/login", {
            method: "POST",
            body: JSON.stringify({ phone, password })
        });

        // SAVE AUTH DATA (ONLY TOKEN NOW)
        setToken(data.token);

        setButtonLoading('loginBtn', false);
        showToast("Login successful");

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1000);

    } catch (err) {
        setButtonLoading('loginBtn', false);
        showToast(err.message || "Login failed", "error");
    }
});

// ========================================
// PASSWORD TOGGLE
// ========================================
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    input.type = (input.type === 'password' ? 'text' : 'password');
}

// ========================================
// LANGUAGE TOGGLE
// ========================================
function toggleLanguage() {
    const signupLang = document.getElementById('signupLang');
    if (signupLang) {
        // If coming from signup dropdown
        i18n.setLanguage(signupLang.value);
    } else {
        // Fallback to toggle logic
        const newLang = i18n.currentLang === 'en' ? 'hi' : 'en';
        i18n.setLanguage(newLang);
    }
}

// ------------------ TOAST UPDATED ------------------
function showToast(message, type = 'success', duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success' ? '✓' : '⚠';

    toast.innerHTML = `
        <span style="margin-right:8px;">${icon}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// ========================================
// FORGOT PASSWORD MODAL
// ========================================
function showForgotModal() {
    document.getElementById('forgotPwModal').classList.add('show');
}

function closeForgotModal() {
    document.getElementById('forgotPwModal').classList.remove('show');
    document.getElementById('forgotStep1').style.display = 'block';
    document.getElementById('forgotStep2').style.display = 'none';
}

async function requestOTP() {
    const phone = document.getElementById('forgotPhone').value.trim();
    if (!phone) return showToast("Phone number required", "error");

    try {
        const data = await apiFetch("/auth/forgot", {
            method: "POST",
            body: JSON.stringify({ phone })
        });
        
        showToast("OTP generated successfully!");
        
        // 🔥 FEATURE 1 (REF): SHOW OTP IN TOAST
        if (data.otp) {
            setTimeout(() => {
                showToast(`YOUR OTP: ${data.otp}`, "success", 15000); // Keep for 15s
            }, 1000);
        }

        document.getElementById('forgotStep1').style.display = 'none';
        document.getElementById('forgotStep2').style.display = 'block';
    } catch (err) {
        showToast(err.message, "error");
    }
}

async function resetPassword() {
    const phone = document.getElementById('forgotPhone').value.trim();
    const otp = document.getElementById('otpInput').value.trim();
    const newPassword = document.getElementById('newPassword').value;

    if (!otp || !newPassword) return showToast("All fields required", "error");

    try {
        await apiFetch("/auth/reset", {
            method: "POST",
            body: JSON.stringify({ phone, otp, newPassword })
        });
        
        showToast("Password reset successful! Please login.");
        closeForgotModal();
    } catch (err) {
        showToast(err.message, "error");
    }
}