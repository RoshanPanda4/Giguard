const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "auth.html";
}

// ================== LOGOUT ==================
document.getElementById("logoutBtn").onclick = () => {
    localStorage.clear();
    window.location.href = "auth.html";
};

// ================== USER NAME ==================
const userName = localStorage.getItem("userName");
if (userName) {
    document.getElementById("userName").innerText = userName;
}

// ================== FETCH WALLET ==================
async function loadWallet() {
    const res = await fetch("/api/wallet/me", {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    document.getElementById("walletBalance").innerText = `₹${data.balance || 0}`;
}

// ================== FETCH POLICY ==================
async function loadPolicy() {
    const res = await fetch("/api/policy/me", {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (data.success) {
        const p = data.policy;
        document.getElementById("policyStatus").innerText = "ACTIVE";
        document.getElementById("policyCoverage").innerText = `₹${p.coverage}`;
        document.getElementById("policyPremium").innerText = `₹${p.premium}`;
    } else {
        document.getElementById("policyStatus").innerText = "No Policy";
    }
}

// ================== PHOTO UPLOAD ==================
document.getElementById("uploadBtn").onclick = () => {
    document.getElementById("photoInput").click();
};

document.getElementById("photoInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("photo", file);

    const res = await fetch("/api/user/upload-photo", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`
        },
        body: formData
    });

    const data = await res.json();

    if (data.url) {
        document.getElementById("profileImage").src = data.url;
    }
});

// ================== INIT ==================
loadWallet();
loadPolicy();