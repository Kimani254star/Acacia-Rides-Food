/* JavaScript for page-index */
(function(){
  if (!document.body.classList.contains('page-index')) return;

let currentUser = null;
let currentCommissionRate = getCommissionRate();
let selectedStarRating = 0;

// Initialize Storage
if (!localStorage.getItem("acaciaRides")) localStorage.setItem("acaciaRides", JSON.stringify([]));
if (!localStorage.getItem("acaciaFoods")) localStorage.setItem("acaciaFoods", JSON.stringify([]));
if (!localStorage.getItem("acaciaComplaints")) localStorage.setItem("acaciaComplaints", JSON.stringify([]));
if (!localStorage.getItem("acaciaSystemRevenue")) localStorage.setItem("acaciaSystemRevenue", "0");
if (!localStorage.getItem("acaciaHistory")) localStorage.setItem("acaciaHistory", JSON.stringify([]));

// Seed Default Approved Testimonials if Empty
if (!localStorage.getItem("acaciaFeedback")) {
    const seedFeedback = [
        { id: 1, stars: 5, author: "David Kimani", company: "Frequent Rider, Nairobi", text: "Acacia Rides gets me to meetings on time every day. The drivers are professional and vehicles super clean!", approved: true, type: "public" },
        { id: 2, stars: 5, author: "Amina Hassan", company: "Swahili Delights Restaurant", text: "As a merchant partner, order dispatching is instantaneous. Payouts are straightforward and transparent.", approved: true, type: "public" },
        { id: 3, stars: 4, author: "Peter Otieno", company: "Tech Entrepreneur", text: "Fast parcel delivery service across Westlands. Highly recommend for business package logistics.", approved: true, type: "public" }
    ];
    localStorage.setItem("acaciaFeedback", JSON.stringify(seedFeedback));
}

function getUsers() { return JSON.parse(localStorage.getItem("acaciaUsers") || "[]"); }
function saveUsers(users) { localStorage.setItem("acaciaUsers", JSON.stringify(users)); }
function getRevenue() { return parseFloat(localStorage.getItem("acaciaSystemRevenue") || "0"); }
function addRevenue(amount) { localStorage.setItem("acaciaSystemRevenue", (getRevenue() + amount).toString()); }

function getHistory() { return JSON.parse(localStorage.getItem("acaciaHistory") || "[]"); }
function addHistoryItem(item) {
    let hist = getHistory();
    hist.unshift(item);
    localStorage.setItem("acaciaHistory", JSON.stringify(hist));
}

function getFeedback() { return JSON.parse(localStorage.getItem("acaciaFeedback") || "[]"); }
function saveFeedback(list) { localStorage.setItem("acaciaFeedback", JSON.stringify(list)); }

function money(value) { return "KES " + Number(value || 0).toLocaleString("en-KE", {maximumFractionDigits: 2}); }
function readList(key) { try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; } catch (_) { return []; } }
function writeList(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function escapeHTML(value) { return String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch])); }
function addWalletTransaction(userEmail, type, amount, note) {
    const ledger = readList("acaciaWalletTransactions");
    ledger.unshift({id: Date.now() + Math.random(), userEmail, type, amount: Number(amount), note, timestamp: Date.now()});
    writeList("acaciaWalletTransactions", ledger);
}
function getCommissionRate() {
    const stored = Number(localStorage.getItem("acaciaCommissionRate"));
    return Number.isFinite(stored) && stored >= 0 && stored <= 100 ? stored : 20;
}
function saveOrderStatus(key, id, status, extra = {}) {
    const records = readList(key);
    const index = records.findIndex(record => String(record.id) === String(id));
    if (index < 0) return null;
    records[index] = {...records[index], ...extra, status, updatedAt: Date.now()};
    writeList(key, records);
    return records[index];
}

// Auto-Login Persistence
function checkAutoLogin() {
    renderPublicTestimonials();
    const savedUser = localStorage.getItem("acaciaActiveSession");
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        if (currentUser.role === "customer") { showSection("customerDashboard"); renderCustomerDashboard(); }
        else if (currentUser.role === "driver") { showSection("driverDashboard"); renderDriverDashboard(); }
        else if (currentUser.role === "restaurant") { showSection("restaurantDashboard"); renderRestaurantDashboard(); }
        else if (currentUser.role === "admin") { showSection("adminDashboard"); switchAdminTab('revenue'); }
    }
}

/* ================= STAR RATING & CONDITIONAL FEEDBACK LOGIC ================= */
function selectStarRating(score) {
    selectedStarRating = score;
    const stars = document.querySelectorAll("#starRatingSelector i");
    stars.forEach((star, index) => {
        if (index < score) star.classList.add("active");
        else star.classList.remove("active");
    });

    const highForm = document.getElementById("highRatingForm");
    const lowForm = document.getElementById("lowRatingForm");

    if (score >= 4) {
        highForm.style.display = "grid";
        lowForm.style.display = "none";
        if(currentUser) document.getElementById("feedbackAuthor").value = currentUser.name;
    } else {
        highForm.style.display = "none";
        lowForm.style.display = "grid";
        if(currentUser) document.getElementById("privateFeedbackEmail").value = currentUser.email;
    }
}

function handleFeedbackSubmit(e) {
    e.preventDefault();
    if (selectedStarRating === 0) return alert("Please select a star rating between 1 and 5 stars.");

    let list = getFeedback();
    const isHigh = selectedStarRating >= 4;

    if (isHigh) {
        const author = document.getElementById("feedbackAuthor").value.trim();
        const company = document.getElementById("feedbackCompany").value.trim() || "Verified User";
        const text = document.getElementById("feedbackComment").value.trim();

        list.push({
            id: Date.now(),
            stars: selectedStarRating,
            author,
            company,
            text,
            approved: false, // Administrator approval required before publication
            type: "public",
            timestamp: Date.now()
        });
        saveFeedback(list);
        alert("Thank you for your testimonial! Your review has been submitted for administrator approval.");
        document.getElementById("highRatingForm").reset();
    } else {
        const email = document.getElementById("privateFeedbackEmail").value.trim();
        const text = document.getElementById("privateFeedbackText").value.trim();

        list.push({
            id: Date.now(),
            stars: selectedStarRating,
            email,
            text,
            type: "private",
            timestamp: Date.now()
        });
        saveFeedback(list);
        alert("Thank you for your feedback. Our support team has received your comments and will work to improve customer service.");
        document.getElementById("lowRatingForm").reset();
    }

    // Reset UI
    selectedStarRating = 0;
    document.querySelectorAll("#starRatingSelector i").forEach(s => s.classList.remove("active"));
    document.getElementById("highRatingForm").style.display = "none";
    document.getElementById("lowRatingForm").style.display = "none";

    renderPublicTestimonials();
}

function renderPublicTestimonials() {
    const container = document.getElementById("publicTestimonialsContainer");
    if(!container) return;
    const publicReviews = getFeedback().filter(f => f.type === "public" && f.approved);

    if(publicReviews.length === 0) {
        container.innerHTML = `<p style="color:#64748b; text-align:center; grid-column:1/-1;">No public testimonials published yet. Be the first to leave a review!</p>`;
        return;
    }

    container.innerHTML = publicReviews.map(r => {
        let starsHtml = '';
        for(let i=1; i<=5; i++) {
            starsHtml += `<i class="fa-${i <= r.stars ? 'solid' : 'regular'} fa-star"></i>`;
        }
        const initial = r.author ? r.author.charAt(0).toUpperCase() : 'U';
        return `
            <div class="testimonial-card">
                <div>
                    <div class="testimonial-stars">${starsHtml}</div>
                    <p class="testimonial-text">"${escapeHTML(r.text)}"</p>
                </div>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">${initial}</div>
                    <div class="testimonial-info">
                        <h4>${escapeHTML(r.author)}</h4>
                        <span>${escapeHTML(r.company)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Location Detection via Geolocation API
function detectUserLocation(targetInputId) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const locStr = `GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
                document.getElementById(targetInputId).value = locStr;
                updateGoogleMapIframe(locStr);
                alert("Current GPS Location attached successfully!");
            },
            (error) => {
                alert("Could not access location. Please enable location permissions in browser settings.");
            }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

// Developer GPS Location Access for Support Desk
function fetchDevLocation() {
    const display = document.getElementById("devLocationDisplay");
    display.style.display = "block";
    display.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Acquiring developer coordinates...';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                display.innerHTML = `
                    <strong><i class="fa-solid fa-location-dot" style="color:#16a34a;"></i> Developer Location Acquired:</strong><br>
                    Latitude: <code>${lat}</code> | Longitude: <code>${lon}</code><br>
                    GPS Accuracy Margin: ~${accuracy.toFixed(1)} meters<br>
                    <a href="https://www.google.com/maps?q=${lat},${lon}" target="_blank" class="maps-link" style="margin-top:8px;"><i class="fa-solid fa-map"></i> Open Developer Position in Google Maps</a>
                `;
            },
            (err) => {
                display.innerHTML = `<span style="color:#dc2626;"><i class="fa-solid fa-triangle-exclamation"></i> Location Error: ${err.message}. Please allow browser location access permissions.</span>`;
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    } else {
        display.innerHTML = '<span style="color:#dc2626;">Geolocation unsupported on this device.</span>';
    }
}

function updateGoogleMapIframe(query) {
    if (!query) return;
    const iframe = document.getElementById("googleMapPreview");
    if (iframe) {
        iframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;
    }
}

document.querySelectorAll(".faq-question").forEach(item => {
    item.onclick = () => {
        const answer = item.nextElementSibling;
        const icon = item.querySelector("i");
        if (answer.style.display === "block") {
            answer.style.display = "none";
            icon.className = "fa-solid fa-plus";
        } else {
            document.querySelectorAll(".faq-answer").forEach(a => a.style.display = "none");
            document.querySelectorAll(".faq-question i").forEach(i => i.className = "fa-solid fa-plus");
            answer.style.display = "block";
            icon.className = "fa-solid fa-minus";
        }
    };
});

function openAuth(mode = "login", roleDefault = "customer") {
    document.getElementById("authOverlay").style.display = "flex";
    showAuth(mode);
    document.getElementById("regRole").value = roleDefault;
}

function closeAuth() { document.getElementById("authOverlay").style.display = "none"; }

function showAuth(mode) {
    document.getElementById("loginForm").style.display = mode === "login" ? "block" : "none";
    document.getElementById("registerForm").style.display = mode === "register" ? "block" : "none";
    document.getElementById("loginTab").className = mode === "login" ? "auth-tab active" : "auth-tab";
    document.getElementById("registerTab").className = mode === "register" ? "auth-tab active" : "auth-tab";
}

function togglePasswordVisibility(id, btn) {
    const input = document.getElementById(id);
    if (input.type === "password") {
        input.type = "text";
        btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
    } else {
        input.type = "password";
        btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
    }
}

document.getElementById("authOverlay").onclick = function(e) { if (e.target === this) closeAuth(); };

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const role = document.getElementById("regRole").value;
    const password = document.getElementById("regPassword").value;
    if (password.length < 8) return alert("Use a password with at least 8 characters.");

    let users = getUsers();
    if (users.find(u => u.email === email)) {
        alert("An account with this email address already exists.");
        return;
    }

    users.push({ name, email, role, password, balance: 0, actionsCount: 0, status: role === "driver" ? "Offline" : "Active", createdAt: Date.now(), vehicleModel: "", plateNumber: "" });
    saveUsers(users);
    alert("Account created successfully. Please log in to continue.");
    showAuth("login");
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    // Administrator accounts are provisioned by a trusted backend in production.
    const users = getUsers();
    const match = users.find(u => u.email === email && u.password === password);
    if (!match) {
        alert("Invalid email credentials or wrong password.");
        return;
    }

    currentUser = match;
    localStorage.setItem("acaciaActiveSession", JSON.stringify(currentUser));
    closeAuth();
    if (currentUser.role === "customer") { showSection("customerDashboard"); renderCustomerDashboard(); }
    else if (currentUser.role === "driver") { showSection("driverDashboard"); renderDriverDashboard(); }
    else if (currentUser.role === "restaurant") { showSection("restaurantDashboard"); renderRestaurantDashboard(); }
}

function showSection(id) {
    document.getElementById("mainWebsite").style.display = "none";
    document.getElementById("customerDashboard").style.display = "none";
    document.getElementById("driverDashboard").style.display = "none";
    document.getElementById("restaurantDashboard").style.display = "none";
    document.getElementById("adminDashboard").style.display = "none";
    document.getElementById(id).style.display = "block";
}

function logout() {
    currentUser = null;
    localStorage.removeItem("acaciaActiveSession");
    showSection("mainWebsite");
    renderPublicTestimonials();
}

/* ================= AI ASSISTANT LOGIC ================= */
function toggleAIChat() {
    const box = document.getElementById("aiChatBox");
    box.style.display = box.style.display === "flex" ? "none" : "flex";
}

function askAIGuide(topic) {
    const body = document.getElementById("aiChatBody");
    if (topic === 'driver_setup') {
        body.innerHTML += `<div class="ai-msg user">How do I set up a Driver Account?</div>`;
        body.innerHTML += `
            <div class="ai-msg bot">
                <strong>Driver Setup Guide:</strong><br>
                1. Click <b>Register</b> and select <i>Driver</i>.<br>
                2. Log in and open <b>Vehicle Status</b> tab.<br>
                3. Enter your vehicle model and plate number.<br>
                4. Toggle your status to <b>Online</b> to receive live passenger and parcel jobs!<br>
                5. Earn 80% per completed trip directly to your wallet.
            </div>`;
    } else if (topic === 'restaurant_setup') {
        body.innerHTML += `<div class="ai-msg user">How do I set up a Restaurant Account?</div>`;
        body.innerHTML += `
            <div class="ai-msg bot">
                <strong>Restaurant Setup Guide:</strong><br>
                1. Click <b>Register</b> and select <i>Restaurant / Merchant</i>.<br>
                2. Log into your merchant portal.<br>
                3. Go to <b>Manage Menu</b> tab to review your active dishes.<br>
                4. Incoming food orders appear on your <b>Orders</b> tab in real time.<br>
                5. Click <i>Fulfill Order</i> to complete deliveries and receive payout.
            </div>`;
    } else if (topic === 'customer_setup') {
        body.innerHTML += `<div class="ai-msg user">How do I request a ride or order food?</div>`;
        body.innerHTML += `
            <div class="ai-msg bot">
                <strong>Customer User Guide:</strong><br>
                1. Sign up as a Customer.<br>
                2. Use the <b>Wallet & Topup</b> tab to fund your account via M-Pesa.<br>
                3. Click <b>Request Custom Ride</b> or <b>Order Food</b>.<br>
                4. Use <i>Use GPS</i> for instant location auto-filling.
            </div>`;
    }
    body.scrollTop = body.scrollHeight;
}

function sendAIMessage() {
    const input = document.getElementById("aiInput");
    const val = input.value.trim();
    if (!val) return;
    const body = document.getElementById("aiChatBody");
    const userBubble = document.createElement("div"); userBubble.className = "ai-msg user"; userBubble.textContent = val; body.appendChild(userBubble);
    input.value = "";

    const text = val.toLowerCase();
    setTimeout(() => {
        let reply = "I can guide you on account setup for Drivers, Restaurants, and Customers! Select an option below or ask about registration, vehicle details, or wallet top-ups.";
        if (text.includes("driver") || text.includes("car") || text.includes("vehicle")) {
            reply = "To set up as a Driver: Register with the 'Driver' role. After logging in, set your vehicle details in the Vehicle Status tab, then toggle your status to 'Online' to accept incoming ride requests.";
        } else if (text.includes("restaurant") || text.includes("food") || text.includes("merchant") || text.includes("menu")) {
            reply = "To set up a Restaurant: Register under 'Restaurant / Merchant'. Manage your catalog in 'Manage Menu', and click 'Fulfill Order' when customer requests arrive.";
        } else if (text.includes("wallet") || text.includes("pay") || text.includes("m-pesa") || text.includes("money")) {
            reply = "The current preview only simulates wallet credits. Real M-Pesa payments require a secure server-side Daraja integration and callback verification.";
        }
        body.innerHTML += `<div class="ai-msg bot">${reply}</div>`;
        body.scrollTop = body.scrollHeight;
    }, 400);
}

/* ================= CUSTOMER LOGIC ================= */
function switchCustomerTab(tab) {
    const panels = ['Main', 'Wallet', 'History', 'Complaints'];
    panels.forEach(p => {
        const el = document.getElementById(`customer${p}Panel`);
        if(el) el.style.display = (p.toLowerCase() === tab) ? 'block' : 'none';
    });
    document.getElementById("custMainTab").className = tab === 'main' ? 'active' : '';
    document.getElementById("custWalletTab").className = tab === 'wallet' ? 'active' : '';
    document.getElementById("custHistoryTab").className = tab === 'history' ? 'active' : '';
    document.getElementById("custSupportTab").className = tab === 'complaints' ? 'active' : '';

    if (tab === 'history') renderCustomerHistory();
}

function renderCustomerDashboard() {
    if (!currentUser) return;
    document.getElementById("customerName").textContent = currentUser.name;
    document.getElementById("custWallet").textContent = money(currentUser.balance);
    document.getElementById("custWalletDisplay").textContent = money(currentUser.balance);
    document.getElementById("custTrips").textContent = currentUser.actionsCount || 0;
    const all = [...readList("acaciaRides"), ...readList("acaciaFoods")].filter(o => o.email === currentUser.email).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    document.getElementById("custPending").textContent = all.filter(o => !["completed","cancelled"].includes(o.status)).length;
    const activity = document.getElementById("custRecentActivity");
    if (!all.length) { activity.innerHTML = `<p style="color:#6b7280;">No requests yet. Choose a service above to get started.</p>`; return; }
    activity.innerHTML = all.slice(0,12).map(o => {
        const label = o.kind === "food" ? `Food: ${escapeHTML(o.item)}` : `${escapeHTML(o.pickup || "Parcel")} → ${escapeHTML(o.dropoff)}`;
        const status = o.status || "pending";
        return `<div class="activity-item customer-item"><div><strong>${label}</strong><span>${money(o.fare || o.price)} · ${new Date(o.createdAt || Date.now()).toLocaleString()}</span></div><span class="status ${status === "completed" ? "completed" : "pending"}">${escapeHTML(status)}</span></div>`;
    }).join("");
}

function topUpWallet() {
    const amt = Number(document.getElementById("topupAmount").value);
    if (!Number.isFinite(amt) || amt < 100) return alert("Enter an amount of at least KES 100.");
    if (!confirm("DEMO MODE: this adds simulated funds only. No M-Pesa or card payment will occur. Continue?")) return;
    currentUser.balance = Number(currentUser.balance || 0) + amt;
    updateUserInStorage(currentUser);
    addWalletTransaction(currentUser.email, "demo_credit", amt, "Simulated wallet top-up (not a real payment)");
    document.getElementById("topupAmount").value = "";
    alert(money(amt) + " simulated funds added to your demo wallet.");
    renderCustomerDashboard();
}

function createServiceRequest(kind, details, amount) {
    if (!currentUser || currentUser.role !== "customer") return alert("Please log in with a customer account.");
    const fare = Number(amount);
    if (!Number.isFinite(fare) || fare <= 0) return alert("Invalid service amount.");
    if (Number(currentUser.balance || 0) < fare) {
        alert("Insufficient demo wallet balance. Add demo funds in Wallet & Topup.");
        switchCustomerTab("wallet"); return;
    }
    const key = kind === "food" ? "acaciaFoods" : "acaciaRides";
    const records = readList(key);
    const record = {id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()),
        customer: currentUser.name, email: currentUser.email, kind, ...details, fare, price: fare,
        status: "pending", createdAt: Date.now(), updatedAt: Date.now()};
    currentUser.balance = Number(currentUser.balance || 0) - fare;
    updateUserInStorage(currentUser);
    addWalletTransaction(currentUser.email, "hold", -fare, `${kind} request ${record.id} (demo escrow)`);
    records.unshift(record); writeList(key, records);
    alert(`${kind[0].toUpperCase()+kind.slice(1)} request created. Funds are held in demo escrow until completion.`);
    renderCustomerDashboard();
}
function openRideModal() {
    const pickup = prompt("Enter pickup location:", "Nairobi CBD"); if (!pickup || !pickup.trim()) return;
    const dropoff = prompt("Enter destination:", "Westlands"); if (!dropoff || !dropoff.trim()) return;
    const type = document.getElementById("heroRideType")?.value || "Economy";
    const fares = {Economy:500, Premium:900, XL:1200, Motorbike:250};
    createServiceRequest("ride", {pickup:pickup.trim(), dropoff:dropoff.trim(), rideType:type}, fares[type] || 500);
}
function openFoodModal() {
    const menu = readList("acaciaMenu").filter(m => m.active !== false);
    const choice = prompt("Enter menu item to order:" + (menu.length ? "\\n" + menu.map(m => `${m.name} — KES ${m.price}`).join("\\n") : ""), menu[0]?.name || "Deluxe Pizza Deal");
    if (!choice || !choice.trim()) return;
    const match = menu.find(m => m.name.toLowerCase() === choice.trim().toLowerCase());
    const price = match ? Number(match.price) : Number(prompt("Enter demo price in KES:", "800"));
    if (!Number.isFinite(price) || price <= 0) return alert("Enter a valid price.");
    createServiceRequest("food", {item:choice.trim(), restaurantEmail:match?.restaurantEmail || "", restaurantName:match?.restaurantName || "Available merchant"}, price);
}
function openParcelModal() {
    const pickup = prompt("Enter parcel pickup location:", "Nairobi CBD"); if (!pickup || !pickup.trim()) return;
    const dropoff = prompt("Enter delivery address and parcel details:", "Documents to Kilimani"); if (!dropoff || !dropoff.trim()) return;
    createServiceRequest("parcel", {pickup:pickup.trim(), dropoff:dropoff.trim()}, 400);
}

function renderCustomerHistory() {
    const container = document.getElementById("custFullHistory");
    const orders = [...readList("acaciaRides"), ...readList("acaciaFoods")].filter(o => o.email === currentUser.email).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    if (!orders.length) { container.innerHTML = `<p style="color:#6b7280;">No trips or orders recorded yet.</p>`; return; }
    container.innerHTML = orders.map(o => `<div class="activity-item customer-item"><div><strong>${escapeHTML(o.kind === "food" ? o.item : `${o.pickup || "Parcel"} → ${o.dropoff}`)}</strong><span>${new Date(o.createdAt || Date.now()).toLocaleString()}</span></div><span class="status ${o.status === "completed" ? "completed" : "pending"}">${escapeHTML(o.status || "pending")} · ${money(o.fare || o.price)}</span></div>`).join("");
}

function submitComplaint() {
    const text = document.getElementById("complaintText").value.trim();
    if (!text) return alert("Please type your complaint.");
    let complaints = JSON.parse(localStorage.getItem("acaciaComplaints") || "[]");
    complaints.push({ id: Date.now(), user: currentUser.name, email: currentUser.email, text: text, status: "open", createdAt: Date.now() });
    localStorage.setItem("acaciaComplaints", JSON.stringify(complaints));
    document.getElementById("complaintText").value = "";
    alert("Ticket submitted to Admin.");
    switchCustomerTab('main');
}

/* ================= DRIVER LOGIC ================= */
function switchDriverTab(tab) {
    document.getElementById("driverJobsPanel").style.display = tab === 'jobs' ? 'block' : 'none';
    document.getElementById("driverVehiclePanel").style.display = tab === 'vehicle' ? 'block' : 'none';
    document.getElementById("driverEarningsPanel").style.display = tab === 'earnings' ? 'block' : 'none';
    document.getElementById("drvJobsTab").className = tab === 'jobs' ? 'active' : '';
    document.getElementById("drvVehicleTab").className = tab === 'vehicle' ? 'active' : '';
    document.getElementById("drvEarningsTab").className = tab === 'earnings' ? 'active' : '';
}

function renderDriverDashboard() {
    if (!currentUser) return;
    document.getElementById("driverName").textContent = currentUser.name;
    document.getElementById("driverEarnings").textContent = money(currentUser.balance);
    document.getElementById("driverCount").textContent = currentUser.actionsCount || 0;
    const status = document.getElementById("driverStatusToggle"); if (status) status.value = currentUser.status || "Offline";
    const model = document.getElementById("drvVehicleModel"); if (model) model.value = currentUser.vehicleModel || "";
    const plate = document.getElementById("drvPlate"); if (plate) plate.value = currentUser.plateNumber || "";
    const jobs = readList("acaciaRides").filter(r => r.status === "pending" || (r.status === "accepted" && r.driverEmail === currentUser.email)).sort((a,b)=>(a.createdAt||0)-(b.createdAt||0));
    const container = document.getElementById("rideRequestsContainer");
    if (!jobs.length) { container.innerHTML = `<p style="color:#6b7280;">No available jobs at the moment.</p>`; return; }
    container.innerHTML = jobs.map(job => {
        const kind = job.kind === "food" ? "food" : "ride";
        const label = kind === "food" ? `Food delivery: ${escapeHTML(job.item)}` : `${escapeHTML(job.pickup)} → ${escapeHTML(job.dropoff)}`;
        const payout = Number(job.fare || job.price) * (1-currentCommissionRate/100);
        const action = job.status === "accepted" ? `<button class="request-btn" onclick="completeDriverJob('${kind}','${job.id}')">Mark Delivered</button>` : `<button class="request-btn" onclick="acceptDriverJob('${kind}','${job.id}')">Accept Job</button>`;
        return `<div class="activity-item driver-item"><div><strong>${label}</strong><span>Customer: ${escapeHTML(job.customer)}</span><span>${money(job.fare || job.price)} · ${escapeHTML(job.status)}</span></div><div><span style="font-weight:bold;color:#10b981;">Payout: ${money(payout)}</span>${action}</div></div>`;
    }).join("");
}
function acceptDriverJob(kind,id) {
    if (currentUser.status !== "Online") return alert("Set your driver status to Online before accepting jobs.");
    const key = kind === "food" ? "acaciaFoods" : "acaciaRides";
    const job = readList(key).find(r => String(r.id) === String(id));
    if (!job || job.status !== "pending") return alert("This job is no longer available.");
    saveOrderStatus(key,id,"accepted",{driverEmail:currentUser.email,driverName:currentUser.name,acceptedAt:Date.now()});
    renderDriverDashboard(); alert("Job accepted. Mark it delivered after completing the service.");
}
function completeDriverJob(kind,id) {
    const key = kind === "food" ? "acaciaFoods" : "acaciaRides";
    const job = readList(key).find(r => String(r.id) === String(id));
    if (!job || job.status !== "accepted" || job.driverEmail !== currentUser.email) return alert("This job is not assigned to you.");
    saveOrderStatus(key,id,"completed",{completedAt:Date.now()});
    const gross = Number(job.fare || job.price), fee = gross*currentCommissionRate/100, payout = gross-fee;
    currentUser.balance = Number(currentUser.balance||0)+payout; currentUser.actionsCount = Number(currentUser.actionsCount||0)+1;
    updateUserInStorage(currentUser); addRevenue(fee);
    addHistoryItem({userEmail:job.email,title:`Completed ${kind}: ${kind==="food"?job.item:`${job.pickup} to ${job.dropoff}`}`,amount:gross,timestamp:Date.now()});
    addWalletTransaction(currentUser.email,"earning",payout,`Completed job ${id}`);
    addWalletTransaction(job.email,"capture",0,`Held funds captured for completed job ${id}`);
    renderDriverDashboard(); alert(`Job completed. ${money(payout)} credited to demo earnings.`);
}
function acceptRide(id) { acceptDriverJob("ride",id); }
function saveDriverVehicle() {
    currentUser.vehicleModel = document.getElementById("drvVehicleModel").value.trim();
    currentUser.plateNumber = document.getElementById("drvPlate").value.trim().toUpperCase();
    if (!currentUser.vehicleModel || !currentUser.plateNumber) return alert("Enter vehicle type and registration number.");
    updateUserInStorage(currentUser); alert("Vehicle details saved in this demo.");
}
function requestDemoWithdrawal() {
    const balance = Number(currentUser?.balance || 0);
    if (balance <= 0) return alert("There is no available demo balance to withdraw.");
    const phone = prompt("Enter M-Pesa phone number (demo request only):","07XXXXXXXX"); if (!phone) return;
    const requests = readList("acaciaWithdrawals");
    requests.unshift({id:Date.now(),email:currentUser.email,amount:balance,phone,status:"pending",createdAt:Date.now(),demo:true});
    writeList("acaciaWithdrawals",requests); alert("Demo withdrawal request recorded. No M-Pesa payment has been sent.");
}

function toggleDriverStatus(val) {
    currentUser.status = val;
    updateUserInStorage(currentUser);
    alert(`Status changed to ${val}`);
}

/* ================= RESTAURANT LOGIC ================= */
function switchRestaurantTab(tab) {
    ["orders","menu","earnings"].forEach(name => {
        const panel=document.getElementById(`rst${name[0].toUpperCase()+name.slice(1)}Panel`);
        const tabEl=document.getElementById(`rst${name[0].toUpperCase()+name.slice(1)}Tab`);
        if(panel) panel.style.display=name===tab?"block":"none";
        if(tabEl) tabEl.className=name===tab?"active":"";
    });
    if(tab==="orders" || tab==="menu") renderRestaurantDashboard();
}
function renderRestaurantDashboard() {
    if (!currentUser) return;
    document.getElementById("restaurantName").textContent=currentUser.name;
    document.getElementById("restEarnings").textContent=money(currentUser.balance);
    document.getElementById("restCount").textContent=currentUser.actionsCount||0;
    const foods=readList("acaciaFoods").filter(f=>!f.restaurantEmail || f.restaurantEmail===currentUser.email);
    const container=document.getElementById("foodRequestsContainer");
    container.innerHTML=foods.length?foods.map(f=>`<div class="activity-item restaurant-item"><div><strong>${escapeHTML(f.item)}</strong><span>Customer: ${escapeHTML(f.customer)}</span><span>${money(f.price)} · ${escapeHTML(f.status||"pending")}</span></div><div>${f.status==="pending"?`<button class="request-btn" onclick="acceptFood('${f.id}')">Accept Order</button>`:f.status==="preparing"?`<button class="request-btn" onclick="completeFoodOrder('${f.id}')">Mark Ready / Complete</button>`:""}</div></div>`).join(""):`<p style="color:#6b7280;">No food orders for your restaurant yet.</p>`;
    renderRestaurantMenu();
}
function acceptFood(id) {
    const food=readList("acaciaFoods").find(f=>String(f.id)===String(id));
    if(!food || food.status!=="pending") return alert("This order is no longer available.");
    saveOrderStatus("acaciaFoods",id,"preparing",{restaurantEmail:currentUser.email,restaurantName:currentUser.name,acceptedAt:Date.now()});
    renderRestaurantDashboard();
}
function completeFoodOrder(id) {
    const food=readList("acaciaFoods").find(f=>String(f.id)===String(id));
    if(!food || food.status!=="preparing" || food.restaurantEmail!==currentUser.email) return alert("This order is not assigned to your restaurant.");
    saveOrderStatus("acaciaFoods",id,"completed",{completedAt:Date.now()});
    const gross=Number(food.price||food.fare),fee=gross*currentCommissionRate/100,payout=gross-fee;
    currentUser.balance=Number(currentUser.balance||0)+payout; currentUser.actionsCount=Number(currentUser.actionsCount||0)+1;
    updateUserInStorage(currentUser); addRevenue(fee);
    addHistoryItem({userEmail:food.email,title:`Completed food order: ${food.item}`,amount:gross,timestamp:Date.now()});
    addWalletTransaction(currentUser.email,"earning",payout,`Completed food order ${id}`);
    addWalletTransaction(food.email,"capture",0,`Held funds captured for completed food order ${id}`);
    renderRestaurantDashboard(); alert(`${money(payout)} credited to demo merchant balance.`);
}
function renderRestaurantMenu() {
    const container=document.getElementById("restaurantMenuItems"); if(!container) return;
    const menu=readList("acaciaMenu").filter(m=>m.restaurantEmail===currentUser.email);
    container.innerHTML=`<div class="generic-form" style="max-width:520px;margin-bottom:20px;"><div class="input-box"><label>Dish name</label><input id="menuItemName" placeholder="e.g. Chicken biryani"></div><div class="input-box"><label>Price (KES)</label><input id="menuItemPrice" type="number" min="1" placeholder="750"></div><button class="quick-btn" onclick="addMenuItem()">Add menu item</button></div>`+(menu.length?menu.map(m=>`<div class="activity-item"><div><strong>${escapeHTML(m.name)}</strong><span>${money(m.price)}</span></div><button class="request-btn danger" onclick="deleteMenuItem('${m.id}')">Remove</button></div>`).join(""):`<p>No menu items yet. Add your first dish above.</p>`);
}
function addMenuItem() {
    const name=document.getElementById("menuItemName").value.trim(),price=Number(document.getElementById("menuItemPrice").value);
    if(!name || !Number.isFinite(price) || price<=0) return alert("Enter a dish name and valid price.");
    const menu=readList("acaciaMenu"); menu.push({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,price,restaurantEmail:currentUser.email,restaurantName:currentUser.name,active:true});
    writeList("acaciaMenu",menu); renderRestaurantMenu();
}
function deleteMenuItem(id) { writeList("acaciaMenu",readList("acaciaMenu").filter(m=>String(m.id)!==String(id))); renderRestaurantMenu(); }

function switchAdminTab(panelName) {
    const panels = ['revenue', 'customers', 'drivers', 'restaurants', 'feedback', 'support', 'settings'];
    panels.forEach(p => {
        document.getElementById(`admin${p.charAt(0).toUpperCase() + p.slice(1)}Panel`).style.display = (p === panelName) ? 'block' : 'none';
        document.getElementById(`admin${p.charAt(0).toUpperCase() + p.slice(1)}Tab`).className = (p === panelName) ? 'active' : '';
    });

    if (panelName === 'revenue') {
        document.getElementById("adminRevenue").textContent = "KES " + getRevenue().toLocaleString();
        document.getElementById("adminTotalTxCount").textContent = getHistory().length;
    }
    if (panelName === 'customers') {
        const list = document.getElementById("adminCustomersList");
        const match = getUsers().filter(u => u.role === 'customer');
        document.getElementById("adminTotalCustomersCount").textContent = match.length;
        if(match.length === 0) list.innerHTML = `<p style="color:#94a3b8;">No registered customers.</p>`;
        else list.innerHTML = match.map(u => `<div class="activity-item customer-item"><div><strong>${u.name}</strong><span>${u.email} | Wallet: KES ${u.balance || 0}</span></div><span class="status completed">Active</span></div>`).join('');
    }
    if (panelName === 'drivers') {
        const list = document.getElementById("adminDriversList");
        const match = getUsers().filter(u => u.role === 'driver');
        document.getElementById("adminTotalDriversCount").textContent = match.length;
        if(match.length === 0) list.innerHTML = `<p style="color:#94a3b8;">No drivers registered.</p>`;
        else list.innerHTML = match.map(u => `<div class="activity-item driver-item"><div><strong>${u.name}</strong><span>${u.email} | Earnings: KES ${u.balance || 0}</span></div><span class="status completed">${u.status || 'Online'}</span></div>`).join('');
    }
    if (panelName === 'restaurants') {
        const list = document.getElementById("adminRestaurantsList");
        const match = getUsers().filter(u => u.role === 'restaurant');
        document.getElementById("adminTotalRestaurantsCount").textContent = match.length;
        if(match.length === 0) list.innerHTML = `<p style="color:#94a3b8;">No merchants registered.</p>`;
        else list.innerHTML = match.map(u => `<div class="activity-item restaurant-item"><div><strong>${u.name}</strong><span>${u.email} | Sales: KES ${u.balance || 0}</span></div><span class="status completed">Store Open</span></div>`).join('');
    }
    if (panelName === 'feedback') {
        const pubList = document.getElementById("adminTestimonialsModerationList");
        const privList = document.getElementById("adminPrivateFeedbackList");
        const allFb = getFeedback();

        const pubItems = allFb.filter(f => f.type === 'public');
        const privItems = allFb.filter(f => f.type === 'private');

        if(pubItems.length === 0) pubList.innerHTML = `<p style="color:#64748b;">No public testimonials submitted.</p>`;
        else pubList.innerHTML = pubItems.map(item => `
            <div class="activity-item">
                <div>
                    <strong>${item.author} (${item.stars} Stars) - ${item.approved ? '<span style="color:#16a34a;">Published</span>' : '<span style="color:#eab308;">Pending Approval</span>'}</strong>
                    <p style="font-size:13px; color:#475569;">"${item.text}"</p>
                </div>
                <div>
                    <button class="request-btn" onclick="toggleTestimonialApproval(${item.id})">${item.approved ? 'Unpublish' : 'Approve'}</button>
                    <button class="request-btn danger" onclick="deleteFeedbackItem(${item.id})">Delete</button>
                </div>
            </div>
        `).join('');

        if(privItems.length === 0) privList.innerHTML = `<p style="color:#64748b;">No low rating service feedback submitted.</p>`;
        else privList.innerHTML = privItems.map(item => `
            <div class="activity-item" style="border-left-color:#e11d48;">
                <div>
                    <strong>From: ${item.email} (${item.stars} Stars)</strong>
                    <p style="font-size:13px; color:#475569;">"${item.text}"</p>
                </div>
                <button class="request-btn danger" onclick="deleteFeedbackItem(${item.id})">Dismiss</button>
            </div>
        `).join('');
    }
    if (panelName === 'support') {
        const container = document.getElementById("adminComplaintsList");
        const complaints = JSON.parse(localStorage.getItem("acaciaComplaints") || "[]");
        if(complaints.length === 0) {
            container.innerHTML = `<p style="color:#6b7280;">No open complaints in inbox.</p>`;
            return;
        }
        container.innerHTML = complaints.map(c => `
            <div class="activity-item" style="border-left-color: #ef4444;">
                <div>
                    <strong>From: ${c.user} (${c.email})</strong>
                    <p style="margin-top:6px; color:#475569;">"${c.text}"</p>
                </div>
                <button class="request-btn danger" onclick="resolveComplaint(${c.id})">Resolve Ticket</button>
            </div>
        `).join('');
    }
}

function toggleTestimonialApproval(id) {
    let list = getFeedback();
    const idx = list.findIndex(item => item.id === id);
    if(idx !== -1) {
        list[idx].approved = !list[idx].approved;
        saveFeedback(list);
        switchAdminTab('feedback');
        renderPublicTestimonials();
    }
}

function deleteFeedbackItem(id) {
    let list = getFeedback().filter(item => item.id !== id);
    saveFeedback(list);
    switchAdminTab('feedback');
    renderPublicTestimonials();
}

function saveCommissionRate() {
    const val = parseFloat(document.getElementById("commissionRate").value);
    if(isNaN(val) || val < 0 || val > 100) return alert("Enter valid commission %");
    currentCommissionRate = val;
    localStorage.setItem("acaciaCommissionRate", String(val));
    alert(`System platform fee rate updated to ${currentCommissionRate}%`);
}

function resolveComplaint(id) {
    let complaints = JSON.parse(localStorage.getItem("acaciaComplaints") || "[]");
    complaints = complaints.filter(c => c.id !== id);
    localStorage.setItem("acaciaComplaints", JSON.stringify(complaints));
    alert("Support ticket marked resolved!");
    switchAdminTab('support');
}

function submitGuestRideRequest() {
    const pickup = document.getElementById("heroPickup").value.trim();
    const dropoff = document.getElementById("heroDropoff").value.trim();
    if (!pickup || !dropoff) return alert("Please specify both pickup and destination locations.");
    openAuth("register", "customer");
    alert("Create a customer account to submit and track your ride request.");
}


function updateUserInStorage(userObj) {
    let users = getUsers();
    const idx = users.findIndex(u => u.email === userObj.email);
    if(idx !== -1) { users[idx] = userObj; saveUsers(users); }
    if (currentUser && currentUser.email === userObj.email) {
        localStorage.setItem("acaciaActiveSession", JSON.stringify(userObj));
    }
}

})();