/**
 * VAULT CORE LOGIC
 * Optimized for Mobile / GitHub / Iraq
 */

// 1. CONFIGURATION (Put your real keys here)
const apiId = 1234567; 
const apiHash = "your_api_hash_here";

// 2. GLOBAL VARIABLES
const { TelegramClient } = gramjs;
const { StringSession } = gramjs.sessions;
const statusText = document.getElementById('status');
let client;

// 3. INITIALIZATION
async function init() {
    // Load saved session if it exists
    const savedSession = localStorage.getItem('vault_session') || "";
    const session = new StringSession(savedSession);

    client = new TelegramClient(session, apiId, apiHash, {
        connectionRetries: 10,
        useWSS: true, // Crucial for HTTPS (GitHub Pages)
        autoReconnect: true
    });

    try {
        await client.connect();
        
        // Check if we are already logged in
        if (await client.checkAuthorization()) {
            renderApp();
        } else {
            statusText.innerText = "PROTOCOL READY";
            document.getElementById('phone-section').style.display = 'block';
        }
    } catch (err) {
        statusText.style.color = "#ef4444";
        statusText.innerText = "NETWORK BLOCKED. USE VPN.";
        console.error("Conn Error:", err);
    }
}

// 4. AUTHENTICATION FLOW
async function requestOTP() {
    const phone = document.getElementById('phone').value;
    if (!phone) return alert("Enter number!");

    statusText.innerText = "REQUESTING CODE...";
    try {
        await client.sendCode({ apiId, apiHash }, phone);
        document.getElementById('phone-section').style.display = 'none';
        document.getElementById('otp-section').style.display = 'block';
        statusText.innerText = "CODE SENT TO TELEGRAM";
    } catch (e) {
        alert("Error: " + e.message);
        statusText.innerText = "READY";
    }
}

async function submitOTP() {
    const phone = document.getElementById('phone').value;
    const code = document.getElementById('otp').value;
    
    statusText.innerText = "SYNCING...";
    try {
        await client.start({
            phoneNumber: async () => phone,
            phoneCode: async () => code,
            onError: (err) => alert("Sync Error: " + err.message)
        });

        // SAVE SESSION PERMANENTLY
        localStorage.setItem('vault_session', client.session.save());
        renderApp();
    } catch (e) {
        alert("Invalid code or connection lost.");
    }
}

// 5. APP VIEW
async function renderApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('chat-view').style.display = 'block';

    const listContainer = document.getElementById('list-container');
    listContainer.innerHTML = "<p>Loading chats...</p>";

    try {
        const dialogs = await client.getDialogs({ limit: 15 });
        listContainer.innerHTML = dialogs.map(d => `
            <div class="chat-item">
                <div style="font-weight:bold; color:#38bdf8;">${d.title}</div>
                <div style="font-size:12px; color:#94a3b8; margin-top:5px;">
                    ${d.message?.message?.substring(0, 50) || "Media Content"}
                </div>
            </div>
        `).join('');
    } catch (e) {
        listContainer.innerHTML = "<p>Sync failed. Try refreshing.</p>";
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

// Boot the app
init();
