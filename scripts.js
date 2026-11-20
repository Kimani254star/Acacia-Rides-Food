(function(){
  if (!document.body.classList.contains('page-index')) return;

let currentUser = null;
let currentCommissionRate = 20;
let selectedStarRating = 0;

if (!localStorage.getItem("acaciaRides")) localStorage.setItem("acaciaRides", JSON.stringify([]));
if (!localStorage.getItem("acaciaFoods")) localStorage.setItem("acaciaFoods", JSON.stringify([]));
if (!localStorage.getItem("acaciaComplaints")) localStorage.setItem("acaciaComplaints", JSON.stringify([]));
if (!localStorage.getItem("acaciaSystemRevenue")) localStorage.setItem("acaciaSystemRevenue", "0");
if (!localStorage.getItem("acaciaHistory")) localStorage.setItem("acaciaHistory", JSON.stringify([]));

try {
    const existingFeedback = JSON.parse(localStorage.getItem("acaciaFeedback") || "[]");
    const sampleNames = new Set(["David Kimani", "Amina Hassan", "Peter Otieno"]);
    const genuineFeedback = existingFeedback.filter(item => !sampleNames.has(item.author));
    if (genuineFeedback.length !== existingFeedback.length) {
        localStorage.setItem("acaciaFeedback", JSON.stringify(genuineFeedback));
    }
} catch (_) { localStorage.setItem("acaciaFeedback", "[]"); }

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
        if(currentUser) document.getElementById("privateFeedbackEmail").value = String(currentUser.email).includes("@") ? currentUser.email : "";
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
            approved: true, // Auto-published (or set to false if strict admin approval is desired)
            type: "public",
            timestamp: Date.now()
        });
        saveFeedback(list);
        alert("Thank you for your testimonial! Your review has been submitted.");
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
                    <p class="testimonial-text">"${r.text}"</p>
                </div>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">${initial}</div>
                    <div class="testimonial-info">
                        <h4>${r.author}</h4>
                        <span>${r.company}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

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

/* Phone + password sign-in (like Bolt/Betika). The account id is the number as 2547XXXXXXXX;
   an older account made with an email still logs in with that email. */
function acaciaPhoneId(raw) {
    const v = String(raw || "").trim().toLowerCase();
    if (v.includes("@")) return v;
    let d = v.replace(/[^\d]/g, "");
    if (d.startsWith("254")) d = d.slice(3); else if (d.startsWith("0")) d = d.slice(1);
    return /^[17]\d{8}$/.test(d) ? "254" + d : null;
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById("regName").value.trim();
    const email = acaciaPhoneId(document.getElementById("regEmail").value);
    const role = document.getElementById("regRole").value;
    const password = document.getElementById("regPassword").value;
    if (!name || !email || email.includes("@")) { alert("Enter your name and a valid Kenyan phone number, e.g. 0712 345 678."); return; }
    if (password.length < 8) { alert("Use a password with at least 8 characters."); return; }

    let users = getUsers();
    if (users.find(u => u.email === email)) {
        alert("An account with this phone number already exists. Please log in.");
        return;
    }

    users.push({ name, email, role, password, balance: 0, actionsCount: 0, status: "Online" });
    saveUsers(users);
    alert("Account created successfully. Your wallet starts at KES 0 until a verified payment is received.");
    showAuth("login");
}

function handleLogin(e) {
    e.preventDefault();
    const email = acaciaPhoneId(document.getElementById("loginEmail").value);
    const password = document.getElementById("loginPassword").value;

    const users = getUsers();
    const match = users.find(u => u.email === email && u.password === password);
    if (!match) {
        alert("Wrong phone number or password.");
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
    body.innerHTML += `<div class="ai-msg user">${val}</div>`;
    input.value = "";

    const text = val.toLowerCase();
    setTimeout(() => {
        let reply = "I can guide you on account setup for Drivers, Restaurants, and Customers! Select an option below or ask about registration, vehicle details, or wallet top-ups.";
        if (text.includes("driver") || text.includes("car") || text.includes("vehicle")) {
            reply = "To set up as a Driver: Register with the 'Driver' role. After logging in, set your vehicle details in the Vehicle Status tab, then toggle your status to 'Online' to accept incoming ride requests.";
        } else if (text.includes("restaurant") || text.includes("food") || text.includes("merchant") || text.includes("menu")) {
            reply = "To set up a Restaurant: Register under 'Restaurant / Merchant'. Manage your catalog in 'Manage Menu', and click 'Fulfill Order' when customer requests arrive.";
        } else if (text.includes("wallet") || text.includes("pay") || text.includes("m-pesa") || text.includes("money")) {
            reply = "To top up your wallet: Navigate to the 'Wallet & Topup' menu in your dashboard, enter the amount in KES, and submit to deposit funds.";
        }
        body.innerHTML += `<div class="ai-msg bot">${reply}</div>`;
        body.scrollTop = body.scrollHeight;
    }, 400);
}

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
    document.getElementById("customerName").textContent = currentUser.name;
    document.getElementById("custWallet").textContent = "KES " + (currentUser.balance || 0).toLocaleString();
    document.getElementById("custWalletDisplay").textContent = "KES " + (currentUser.balance || 0).toLocaleString();
    document.getElementById("custTrips").textContent = currentUser.actionsCount || 0;

    const rides = JSON.parse(localStorage.getItem("acaciaRides") || "[]").filter(r => r.email === currentUser.email);
    const foods = JSON.parse(localStorage.getItem("acaciaFoods") || "[]").filter(f => f.email === currentUser.email);
    document.getElementById("custPending").textContent = rides.filter(r => !["completed","cancelled"].includes(r.status)).length + foods.length;

    const activity = document.getElementById("custRecentActivity");
    if(rides.length === 0 && foods.length === 0) {
        activity.innerHTML = `<p style="color:#6b7280;">No active pending orders. Request a service above!</p>`;
    } else {
        let html = '';
        rides.slice().sort((x, y) => (y.createdAt || y.id) - (x.createdAt || x.id)).forEach(r => {
            const status = r.status || 'requested';
            const statusClass = status === 'completed' ? 'completed' : status === 'cancelled' ? 'cancelled' : 'pending';
            const closed = status === 'completed' || status === 'cancelled';
            html += `
            <div class="activity-item customer-item">
                <div>
                    <strong>${r.rideType || 'Economy'} ride: ${r.pickup} ➔ ${r.dropoff}</strong>
                    <span>Fare: KES ${r.fare}</span><br>
                    ${closed ? '' : `<a href="https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(r.pickup)}&destination=${encodeURIComponent(r.dropoff)}" target="_blank" rel="noopener" class="maps-link"><i class="fa-solid fa-map-location-dot"></i> View Route on Google Maps</a>`}
                    ${status === 'requested' ? `<button type="button" class="ride-cancel-link" onclick="cancelRide(${r.id})">Cancel ride</button>` : ''}
                </div>
                <span class="status ${statusClass}">${RIDE_STATUS_LABELS[status] || status}</span>
            </div>`;
        });
        foods.forEach(f => {
            html += `<div class="activity-item customer-item"><div><strong>Food Order: ${f.item}</strong><span>Price: KES ${f.price}</span></div><span class="status pending">Kitchen Preparing</span></div>`;
        });
        activity.innerHTML = html;
    }
}

function topUpWallet() {
    const amt = parseFloat(document.getElementById("topupAmount").value);
    if (!amt || amt < 100) return alert("Please enter a valid top-up amount (min KES 100).");
    currentUser.balance = (currentUser.balance || 0) + amt;
    updateUserInStorage(currentUser);
    document.getElementById("topupAmount").value = "";
    alert(`KES ${amt} added to your wallet!`);
    renderCustomerDashboard();
}

const RIDE_BASE_FARES = { Economy: 180, Premium: 300, XL: 400, Motorbike: 100 };
const RIDE_STATUS_LABELS = { requested: 'Finding driver', accepted: 'Driver assigned', arrived: 'Driver arrived', in_progress: 'Trip in progress', completed: 'Completed', cancelled: 'Cancelled' };

function showRideToast(message) {
    let toast = document.getElementById('rideToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'rideToast';
        toast.className = 'ride-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showRideToast._timer);
    showRideToast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

function openRideModal() {
    if (document.getElementById('rideRequestModal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'rideRequestModal';
    overlay.className = 'ride-modal-overlay';
    overlay.innerHTML = `
        <div class="ride-modal" role="dialog" aria-modal="true" aria-labelledby="rideModalTitle">
            <h3 id="rideModalTitle">Request a ride</h3>
            <label for="ridePickup">Pickup</label>
            <input id="ridePickup" type="text" value="Nairobi CBD" autocomplete="off">
            <button type="button" class="ride-gps-btn" onclick="useCurrentLocationForRide()"><i class="fa-solid fa-location-crosshairs"></i> Use my current location</button>
            <label for="rideDropoff">Destination</label>
            <input id="rideDropoff" type="text" value="Westlands" autocomplete="off">
            <div class="ride-types" role="radiogroup" aria-label="Ride category">
                ${Object.keys(RIDE_BASE_FARES).map((type, i) => `
                <label class="ride-type-option">
                    <input type="radio" name="rideCategory" value="${type}" ${i === 0 ? 'checked' : ''} onchange="updateRideQuote()">
                    <span><strong>${type}</strong><em>KES ${RIDE_BASE_FARES[type]}</em></span>
                </label>`).join('')}
            </div>
            <p class="ride-quote" id="rideQuoteText"></p>
            <div class="ride-modal-actions">
                <button type="button" class="ride-cancel-btn" onclick="closeRideModal()">Cancel</button>
                <button type="button" class="ride-confirm-btn" onclick="confirmRideRequest()">Request ride</button>
            </div>
        </div>`;
    overlay.addEventListener('click', e => { if (e.target === overlay) closeRideModal(); });
    document.addEventListener('keydown', rideModalEscape);
    document.body.appendChild(overlay);
    updateRideQuote();
    document.getElementById('ridePickup').focus();
}

function rideModalEscape(e) {
    if (e.key === 'Escape') closeRideModal();
}

function closeRideModal() {
    document.getElementById('rideRequestModal')?.remove();
    document.removeEventListener('keydown', rideModalEscape);
}

function selectedRideType() {
    return document.querySelector('input[name="rideCategory"]:checked')?.value || 'Economy';
}

function updateRideQuote() {
    const fare = RIDE_BASE_FARES[selectedRideType()];
    const balance = currentUser.balance || 0;
    const el = document.getElementById('rideQuoteText');
    if (!el) return;
    el.textContent = balance >= fare
        ? `Provisional base quote: KES ${fare}. This is held from your wallet and refunded if you cancel before a driver accepts.`
        : `Provisional base quote: KES ${fare}. Your wallet balance (KES ${balance}) is too low, so please top up first.`;
    el.classList.toggle('ride-quote-warning', balance < fare);
}

function useCurrentLocationForRide() {
    if (!navigator.geolocation) return showRideToast('Location is not supported by this browser.');
    navigator.geolocation.getCurrentPosition(
        pos => {
            document.getElementById('ridePickup').value = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
        },
        () => showRideToast('Could not access your location. Type your pickup instead.')
    );
}

function confirmRideRequest() {
    const pickup = document.getElementById('ridePickup').value.trim();
    const dropoff = document.getElementById('rideDropoff').value.trim();
    if (!pickup || !dropoff) return showRideToast('Enter both a pickup and a destination.');
    if (pickup.toLowerCase() === dropoff.toLowerCase()) return showRideToast('Pickup and destination must be different.');

    const rideType = selectedRideType();
    const fare = RIDE_BASE_FARES[rideType];
    if ((currentUser.balance || 0) < fare) {
        closeRideModal();
        showRideToast('Insufficient wallet balance. Please top up your wallet.');
        switchCustomerTab('wallet');
        return;
    }

    currentUser.balance -= fare;
    updateUserInStorage(currentUser);

    const rides = JSON.parse(localStorage.getItem("acaciaRides") || "[]");
    rides.push({ id: Date.now(), customer: currentUser.name, email: currentUser.email, pickup, dropoff, fare, rideType, status: 'requested', createdAt: Date.now() });
    localStorage.setItem("acaciaRides", JSON.stringify(rides));

    closeRideModal();
    showRideToast(`${rideType} ride requested. KES ${fare} held from your wallet.`);
    renderCustomerDashboard();
}

function cancelRide(id) {
    const rides = JSON.parse(localStorage.getItem("acaciaRides") || "[]");
    const ride = rides.find(r => r.id === id && r.email === currentUser.email);
    if (!ride) return showRideToast('Ride not found.');
    if ((ride.status || 'requested') !== 'requested') return showRideToast('A driver has already accepted this ride, so it can no longer be cancelled here.');
    if (!confirm('Cancel this ride? Your fare will be refunded to your wallet.')) return;

    ride.status = 'cancelled';
    currentUser.balance = (currentUser.balance || 0) + (ride.fare || 0);
    updateUserInStorage(currentUser);
    localStorage.setItem("acaciaRides", JSON.stringify(rides));
    showRideToast(`Ride cancelled. KES ${ride.fare} refunded to your wallet.`);
    renderCustomerDashboard();
}

function openFoodModal() {
    const item = prompt("What would you like to order?", "Deluxe Pizza Deal");
    if (!item) return;
    const price = 800;

    if ((currentUser.balance || 0) < price) {
        alert("Insufficient balance! Top up your wallet first.");
        switchCustomerTab('wallet');
        return;
    }

    currentUser.balance -= price;
    updateUserInStorage(currentUser);

    let foods = JSON.parse(localStorage.getItem("acaciaFoods") || "[]");
    foods.push({ id: Date.now(), customer: currentUser.name, email: currentUser.email, item, price });
    localStorage.setItem("acaciaFoods", JSON.stringify(foods));

    alert(`Order sent to kitchen! KES ${price} paid.`);
    renderCustomerDashboard();
}

function openParcelModal() {
    const details = prompt("Enter parcel contents & delivery address:", "Documents to Kilimani");
    if (!details) return;
    const fare = 400;

    if ((currentUser.balance || 0) < fare) {
        alert("Insufficient balance!");
        switchCustomerTab('wallet');
        return;
    }

    currentUser.balance -= fare;
    updateUserInStorage(currentUser);

    let rides = JSON.parse(localStorage.getItem("acaciaRides") || "[]");
    rides.push({ id: Date.now(), customer: currentUser.name, email: currentUser.email, pickup: "Parcel Pickup", dropoff: details, fare });
    localStorage.setItem("acaciaRides", JSON.stringify(rides));

    alert("Courier dispatched for delivery!");
    renderCustomerDashboard();
}

function renderCustomerHistory() {
    const container = document.getElementById("custFullHistory");
    const hist = getHistory().filter(h => h.userEmail === currentUser.email);
    if(hist.length === 0) {
        container.innerHTML = `<p style="color:#6b7280;">No completed transactions recorded yet.</p>`;
        return;
    }
    container.innerHTML = hist.map(h => `
        <div class="activity-item customer-item">
            <div>
                <strong>${h.title}</strong>
                <span>Date: ${new Date(h.timestamp).toLocaleDateString()}</span>
            </div>
            <span class="status completed">KES ${h.amount}</span>
        </div>
    `).join('');
}

function submitComplaint() {
    const text = document.getElementById("complaintText").value.trim();
    if (!text) return alert("Please type your complaint.");
    let complaints = JSON.parse(localStorage.getItem("acaciaComplaints") || "[]");
    complaints.push({ id: Date.now(), user: currentUser.name, email: currentUser.email, text: text });
    localStorage.setItem("acaciaComplaints", JSON.stringify(complaints));
    document.getElementById("complaintText").value = "";
    alert("Ticket submitted to Admin.");
    switchCustomerTab('main');
}

function switchDriverTab(tab) {
    document.getElementById("driverJobsPanel").style.display = tab === 'jobs' ? 'block' : 'none';
    document.getElementById("driverVehiclePanel").style.display = tab === 'vehicle' ? 'block' : 'none';
    document.getElementById("driverEarningsPanel").style.display = tab === 'earnings' ? 'block' : 'none';
    document.getElementById("drvJobsTab").className = tab === 'jobs' ? 'active' : '';
    document.getElementById("drvVehicleTab").className = tab === 'vehicle' ? 'active' : '';
    document.getElementById("drvEarningsTab").className = tab === 'earnings' ? 'active' : '';
}

function renderDriverDashboard() {
    document.getElementById("driverName").textContent = currentUser.name;
    document.getElementById("driverEarnings").textContent = "KES " + (currentUser.balance || 0).toLocaleString();
    document.getElementById("driverCount").textContent = currentUser.actionsCount || 0;

    const container = document.getElementById("rideRequestsContainer");
    const rides = JSON.parse(localStorage.getItem("acaciaRides") || "[]");
    if(rides.length === 0) {
        container.innerHTML = `<p style='color:#6b7280;'>No available ride/parcel requests in your area.</p>`;
        return;
    }
    const rate = currentCommissionRate / 100;
    container.innerHTML = rides.filter(ride => !['completed','cancelled'].includes(ride.status) && (!ride.driverEmail || ride.driverEmail === currentUser.email)).map(ride => `
        <div class="activity-item driver-item">
            <div>
                <strong>${ride.pickup} ➔ ${ride.dropoff}</strong>
                <span>Passenger: ${ride.customer} · ${ride.rideType || 'Economy'} · ${ride.status || 'requested'}</span><br>
                <a href="https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(ride.pickup)}&destination=${encodeURIComponent(ride.dropoff)}" target="_blank" class="maps-link"><i class="fa-solid fa-map-location-dot"></i> Open route</a>
            </div>
            <div>
                <span style="font-weight:bold; color:#10b981; margin-right:15px;">Est. payout: KES ${Math.round(ride.fare * (1 - rate))}</span>
                ${ride.status && ride.status !== 'requested' ? `<button class="request-btn" onclick="advanceRide(${ride.id})">${ride.status === 'accepted' ? 'Mark arrived' : ride.status === 'arrived' ? 'Start trip' : 'Complete trip'}</button>` : `<button class="request-btn" onclick="acceptRide(${ride.id}, ${ride.fare})">Accept ride</button>`}
            </div>
        </div>
    `).join('') || `<p style='color:#6b7280;'>No available rides.</p>`;
}

function acceptRide(id, grossFare) {
    const rides = JSON.parse(localStorage.getItem("acaciaRides") || "[]");
    const ride = rides.find(r => r.id === id);
    if (!ride || (ride.status && ride.status !== 'requested')) return alert('This ride is no longer available.');
    ride.status = 'accepted';
    ride.driver = currentUser.name;
    ride.driverEmail = currentUser.email;
    ride.acceptedAt = Date.now();
    localStorage.setItem("acaciaRides", JSON.stringify(rides));
    alert('Ride accepted. Contact the rider and proceed to pickup.');
    renderDriverDashboard();
}

function advanceRide(id) {
    const rides = JSON.parse(localStorage.getItem('acaciaRides') || '[]');
    const ride = rides.find(r => r.id === id && r.driverEmail === currentUser.email);
    if (!ride) return alert('Ride not found for this driver.');
    const next = { accepted: 'arrived', arrived: 'in_progress', in_progress: 'completed' };
    const previous = ride.status;
    ride.status = next[previous];
    ride.updatedAt = Date.now();
    if (ride.status === 'completed') {
        const rate = currentCommissionRate / 100;
        const driverCut = ride.fare * (1 - rate);
        currentUser.balance = (currentUser.balance || 0) + driverCut;
        currentUser.actionsCount = (currentUser.actionsCount || 0) + 1;
        updateUserInStorage(currentUser);
        addRevenue(ride.fare * rate);
        addHistoryItem({ userEmail: ride.email, title: `Completed Trip: ${ride.pickup} to ${ride.dropoff}`, amount: ride.fare, timestamp: Date.now() });
        alert(`Trip completed. KES ${Math.round(driverCut)} recorded as estimated driver earnings.`);
    }
    localStorage.setItem('acaciaRides', JSON.stringify(rides));
    renderDriverDashboard();
}

function toggleDriverStatus(val) {
    currentUser.status = val;
    updateUserInStorage(currentUser);
    alert(`Status changed to ${val}`);
}

function switchRestaurantTab(tab) {
    document.getElementById("rstOrdersPanel").style.display = tab === 'orders' ? 'block' : 'none';
    document.getElementById("rstMenuPanel").style.display = tab === 'menu' ? 'block' : 'none';
    document.getElementById("rstEarningsPanel").style.display = tab === 'earnings' ? 'block' : 'none';
    document.getElementById("rstOrdersTab").className = tab === 'orders' ? 'active' : '';
    document.getElementById("rstMenuTab").className = tab === 'menu' ? 'active' : '';
    document.getElementById("rstEarningsTab").className = tab === 'earnings' ? 'active' : '';
}

function renderRestaurantDashboard() {
    document.getElementById("restaurantName").textContent = currentUser.name;
    document.getElementById("restEarnings").textContent = "KES " + (currentUser.balance || 0).toLocaleString();
    document.getElementById("restCount").textContent = currentUser.actionsCount || 0;

    const container = document.getElementById("foodRequestsContainer");
    const foods = JSON.parse(localStorage.getItem("acaciaFoods") || "[]");
    if(foods.length === 0) {
        container.innerHTML = `<p style='color:#6b7280;'>No pending food orders.</p>`;
        return;
    }
    const rate = currentCommissionRate / 100;
    container.innerHTML = foods.map(food => `
        <div class="activity-item restaurant-item">
            <div><strong>${food.item}</strong><span>Customer: ${food.customer}</span></div>
            <div>
                <span style="font-weight:bold; color:#f59e0b; margin-right:15px;">Payout: KES ${food.price * (1 - rate)}</span>
                <button class="request-btn" style="background:#f59e0b;" onclick="acceptFood(${food.id}, ${food.price})">Fulfill Order</button>
            </div>
        </div>
    `).join('');
}

function acceptFood(id, grossPrice) {
    let foods = JSON.parse(localStorage.getItem("acaciaFoods") || "[]");
    const food = foods.find(f => f.id === id);
    foods = foods.filter(f => f.id !== id);
    localStorage.setItem("acaciaFoods", JSON.stringify(foods));

    const rate = currentCommissionRate / 100;
    const restCut = grossPrice * (1 - rate);
    const systemCut = grossPrice * rate;

    currentUser.balance = (currentUser.balance || 0) + restCut;
    currentUser.actionsCount = (currentUser.actionsCount || 0) + 1;
    updateUserInStorage(currentUser);
    addRevenue(systemCut);

    if (food) {
        addHistoryItem({
            userEmail: food.email,
            title: `Food Order Delivered: ${food.item}`,
            amount: grossPrice,
            timestamp: Date.now()
        });
    }

    alert(`Order dispatched! KES ${restCut} added to store sales.`);
    renderRestaurantDashboard();
}

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
    let rides = JSON.parse(localStorage.getItem("acaciaRides") || "[]");
    const rideType = document.getElementById('heroRideType')?.value || 'Economy';
    const base = { Economy: 180, Premium: 300, XL: 400, Motorbike: 100 }[rideType] || 180;
    const fare = base; // provisional base quote; distance-based pricing requires a routing API
    rides.push({ id: Date.now(), customer: "Guest Rider", email: "guest@acacia.com", pickup, dropoff, fare, rideType, status: 'requested', createdAt: Date.now() });
    localStorage.setItem("acaciaRides", JSON.stringify(rides));
    alert(`Ride request saved. Provisional ${rideType} base quote: KES ${fare}. Driver dispatch is not live until the shared backend is configured.`);
    document.getElementById("heroPickup").value = "";
    document.getElementById("heroDropoff").value = "";
}

function updateUserInStorage(userObj) {
    let users = getUsers();
    const idx = users.findIndex(u => u.email === userObj.email);
    if(idx !== -1) { users[idx] = userObj; saveUsers(users); }
    if (currentUser && currentUser.email === userObj.email) {
        localStorage.setItem("acaciaActiveSession", JSON.stringify(userObj));
    }
}

/* Make the page's inline onclick/onsubmit handlers able to reach these functions. */
Object.assign(window, {acaciaPhoneId, acceptFood, acceptRide, addHistoryItem, addRevenue, advanceRide, askAIGuide, cancelRide, checkAutoLogin, closeAuth, closeRideModal, confirmRideRequest, deleteFeedbackItem, detectUserLocation, fetchDevLocation, getFeedback, getHistory, getRevenue, getUsers, handleFeedbackSubmit, handleLogin, handleRegister, logout, openAuth, openFoodModal, openParcelModal, openRideModal, renderCustomerDashboard, renderCustomerHistory, renderDriverDashboard, renderPublicTestimonials, renderRestaurantDashboard, resolveComplaint, rideModalEscape, saveCommissionRate, saveFeedback, saveUsers, selectStarRating, selectedRideType, sendAIMessage, showAuth, showRideToast, showSection, submitComplaint, submitGuestRideRequest, switchAdminTab, switchCustomerTab, switchDriverTab, switchRestaurantTab, toggleAIChat, toggleDriverStatus, togglePasswordVisibility, toggleTestimonialApproval, topUpWallet, updateGoogleMapIframe, updateRideQuote, updateUserInStorage, useCurrentLocationForRide});

})();
