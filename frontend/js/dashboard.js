const API_BASE = "https://giguard.onrender.com/api";
const token = localStorage.getItem("token");

// ================== AUTH CHECK ==================
if (!token) {
    window.location.href = "auth.html";
}

// ================== LOGOUT ==================
function logout(e) {
    e.preventDefault();
    localStorage.clear();
    window.location.href = "auth.html";
}

// ------------------ LANGUAGE ------------------
function toggleLanguage() {
    const newLang = i18n.currentLang === 'en' ? 'hi' : 'en';
    i18n.setLanguage(newLang);
}

let userProfile = null;

// ================== USER GREETING ==================
async function loadUser() {
    try {
        const res = await fetch(`${API_BASE}/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success && data.profile) {
            userProfile = data.profile; // Store globally for emergency reporting
            const userName = data.profile.name;
            const photo = data.profile.photo;

            if (userName && document.getElementById("userGreeting")) {
                const hello = i18n.translate("hello");
                document.getElementById("userGreeting").innerHTML = `<span data-i18n="hello">${hello}</span>, ${userName}! 👋`;
            }

            if (photo && document.getElementById("profileImage")) {
                let displayPhoto = photo;
                if (photo.startsWith('/usrphotos')) {
                    displayPhoto = API_BASE.replace('/api', '') + photo;
                }
                document.getElementById("profileImage").src = displayPhoto;
            }
        }
    } catch (err) {
        console.error("Failed to load user profile", err);
    }
}

// ================== FETCH WALLET ==================
async function loadWallet() {
    try {
        const res = await fetch(`${API_BASE}/wallet/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        if (document.getElementById("walletBalance")) {
            document.getElementById("walletBalance").innerText =
                `₹${data.balance || 0}`;
        }

    } catch (err) {
        console.error("Wallet error:", err);
    }
}

// ================== FETCH POLICY ==================
async function loadPolicy() {
    try {
        const res = await fetch(`${API_BASE}/policy/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();

        if (data.success && data.policy) {
            const p = data.policy;

            if (document.getElementById("policyStatus")) {
                document.getElementById("policyStatus").innerText = "ACTIVE";
                document.getElementById("policyStatus").style.color = "#10b981";
            }

            if (document.getElementById("policyCoverage")) {
                document.getElementById("policyCoverage").innerText = `₹${p.coverage}`;
            }

            if (document.getElementById("policyPremium")) {
                document.getElementById("policyPremium").innerText = `₹${p.premium}`;
            }

            if (document.getElementById("policyMessage")) {
                document.getElementById("policyMessage").innerText =
                    "Your policy is active and protecting your income.";
            }

        } else {
            if (document.getElementById("policyStatus")) {
                document.getElementById("policyStatus").innerText = "No Policy";
                document.getElementById("policyStatus").style.color = "#ef4444";
            }

            if (document.getElementById("policyMessage")) {
                document.getElementById("policyMessage").innerText =
                    "You don’t have an active policy. Get protected now.";
            }
        }

    } catch (err) {
        console.error("Policy error:", err);
    }
}

// ================== LOAD HISTORY ==================
async function loadHistory() {
    try {
        const res = await fetch(`${API_BASE}/wallet/history`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        const container = document.getElementById("historyList");

        if (!container) return;

        container.innerHTML = "";

        if (!data.length) {
            container.innerHTML =
                `<div style="color: var(--text-muted); font-size: 0.9rem;">No recent history.</div>`;
            return;
        }

        data.forEach(item => {
            const div = document.createElement("div");
            div.className = "history-item";

            div.innerHTML = `
                <div class="history-info">
                    <div class="event-name">${item.type}</div>
                    <div class="event-date">${new Date(item.date).toLocaleDateString()}</div>
                </div>
                <div class="history-amount ${item.amount < 0 ? "debit" : ""}">
                    ${item.amount < 0 ? "-" : "+"}₹${Math.abs(item.amount)}
                </div>
            `;

            container.appendChild(div);
        });

    } catch (err) {
        console.error("History error:", err);
    }
}

// ================== WITHDRAW ==================
async function withdrawFunds() {
    try {
        const res = await fetch(`${API_BASE}/wallet/withdraw`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ amount: 100 }) // temp
        });

        const data = await res.json();

        alert(data.message || "Withdraw processed");

        loadWallet();
        loadHistory();

    } catch (err) {
        console.error("Withdraw error:", err);
    }
}

// ================== PHOTO UPLOAD ==================
function setupPhotoUpload() {
    const uploadBtn = document.getElementById("uploadBtn");
    const photoInput = document.getElementById("photoInput");
    const profileImage = document.getElementById("profileImage");

    if (!uploadBtn || !photoInput) return;

    uploadBtn.onclick = () => {
        photoInput.click();
    };

    photoInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("photo", file);

        try {
            const res = await fetch(`${API_BASE}/user/upload-photo`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (data.url && profileImage) {
                let displayPhoto = data.url;
                if (data.url.startsWith('/usrphotos')) {
                    displayPhoto = API_BASE.replace('/api', '') + data.url;
                }
                profileImage.src = displayPhoto;

                // Update the user's permanent profile string
                await fetch(`${API_BASE}/user/profile`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ photo: data.url })
                });
            }

        } catch (err) {
            console.error("Upload error:", err);
        }
    });
}

// ================== EMERGENCY REPORTING ==================
function openEmergencyModal() {
    document.getElementById("emergencyModal").classList.add("show");
}

function closeEmergencyModal() {
    document.getElementById("emergencyModal").classList.remove("show");
}

async function submitEmergency(type) {
    if (!userProfile) return alert("User profile not loaded yet.");

    // Close modal immediately
    closeEmergencyModal();
    showToast(`Submitting ${type} report...`, 'info');

    try {
        // 1. Submit the formal report to the backend
        const reportRes = await fetch(`${API_BASE}/reports`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                zone: userProfile.zone || 'Patia', 
                disasterType: type 
            })
        });

        if (!reportRes.ok) throw new Error("Report failed");

        // 2. Perform a background AI assessment for the user
        const aiPayload = {
            platform: userProfile.platform || 'Blinkit',
            zone: userProfile.zone || 'Patia',
            dailyIncome: userProfile.income || 2500,
            workHours: 8,
            weather: type.includes('Flood') || type.includes('Cyclone') ? 'rain' : 'normal',
            reports: 15
        };

        const response = await fetch(`${API_BASE}/simulation`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(aiPayload)
        });

        const aiData = await response.json();
        
        // 3. Save result to DB for claims
        const simResult = {
            risk: aiData.risk || 0.85, 
            disasterType: type,
            timestamp: new Date().toISOString(),
            claim: aiData.claim || { approved: true, payout: 500 }
        };

        await fetch(`${API_BASE}/simulation/result`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(simResult)
        });

        showToast(`${type} reported! Global risk system updated.`, 'success');
        
        // 4. Immediately refresh global zone risk
        loadZoneRiskStatus();
        setTimeout(loadHistory, 2000);

    } catch (err) {
        console.error("Emergency report failed:", err);
        showToast("Failed to report emergency. Please try again.", 'error');
    }
}

async function loadZoneRiskStatus() {
    if (!userProfile || !userProfile.zone) return;

    try {
        const res = await fetch(`${API_BASE}/reports/status/${userProfile.zone}`);
        const data = await res.json();

        if (data.success) {
            const badge = document.getElementById("riskBadge");
            if (badge) {
                badge.innerText = data.status;
                badge.className = `risk-indicator ${data.status.toLowerCase()}`;
                
                // If it's DANGER/MEDIUM, highlight it
                if (data.status === 'DANGER') {
                    badge.style.boxShadow = "0 0 15px rgba(239, 68, 68, 0.4)";
                } else {
                    badge.style.boxShadow = "none";
                }
            }
        }
    } catch (err) {
        console.error("Failed to load zone risk status", err);
    }
}

function showToast(message, type) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast show`;
    
    // Simple icon matching
    let icon = "🔔";
    if (type === 'success') icon = "✅";
    if (type === 'error') icon = "❌";
    if (type === 'info') icon = "ℹ️";

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div>${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(120%)";
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}


// ================== MENU ==================
function toggleMenu() {
    const nav = document.getElementById("navLinks");
    if (nav) nav.classList.toggle("show");
}

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", async () => {
    await loadUser(); // wait for userProfile
    loadWallet();
    loadPolicy();
    loadHistory();
    setupPhotoUpload();
    loadZoneRiskStatus();

    // Periodically fetch global zone risk
    setInterval(loadZoneRiskStatus, 60000); // Every minute
});