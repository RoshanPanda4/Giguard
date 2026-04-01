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

// ================== USER GREETING ==================
function loadUser() {
    const userName = localStorage.getItem("userName");
    const photo = localStorage.getItem("userPhoto");

    if (userName && document.getElementById("userGreeting")) {
        document.getElementById("userGreeting").innerText = `Hello, ${userName}! 👋`;
    }

    if (photo && document.getElementById("profileImage")) {
        document.getElementById("profileImage").src = photo;
    }
}

// ================== FETCH WALLET ==================
async function loadWallet() {
    try {
        const res = await fetch("/api/wallet/me", {
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
        const res = await fetch("/api/policy/me", {
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
        const res = await fetch("/api/wallet/history", {
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
        const res = await fetch("/api/wallet/withdraw", {
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
            const res = await fetch("/api/user/upload-photo", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (data.url && profileImage) {
                profileImage.src = data.url;

                // Save locally
                localStorage.setItem("userPhoto", data.url);
            }

        } catch (err) {
            console.error("Upload error:", err);
        }
    });
}

// ================== MENU ==================
function toggleMenu() {
    const nav = document.getElementById("navLinks");
    if (nav) nav.classList.toggle("show");
}

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", () => {
    loadUser();
    loadWallet();
    loadPolicy();
    loadHistory();
    setupPhotoUpload();
});