# Acacia Rides & Food — upgraded browser demo

This package preserves the supplied HTML/CSS/JavaScript interface and improves the working demo flows.

## Run locally

1. Extract the ZIP.
2. Open a terminal in this folder.
3. Run `python -m http.server 8080`.
4. Open `http://localhost:8080` in your browser.

You can also use VS Code Live Server. Do not open the page as a `file://` URL if you want browser location features to work.

## Demo workflows

- Register a customer, driver, and restaurant using different email addresses.
- Customer: use **Wallet & Topup** to add simulated demo funds (minimum KES 100), then create a ride, parcel, or food request.
- Driver: open **Vehicle Status**, save vehicle details, set status to **Online**, accept a pending ride/parcel job, then mark it delivered.
- Restaurant: add dishes under **Manage Menu**. A customer can select a listed dish from **Order Food**. Accept the order and mark it complete.
- Completed jobs credit demo earnings and calculate the configured platform commission.
- Customer history, support tickets, testimonials (approval required), and local commission settings are retained in this browser.

### Demo administrator account

There is intentionally no hard-coded administrator password in the source. For a local-only test, open the browser developer console on the app's origin and run:

```js
const users = JSON.parse(localStorage.getItem("acaciaUsers") || "[]");
users.push({
  name: "Demo Administrator",
  email: "admin@acacia.test",
  role: "admin",
  password: "LocalDemoOnly!2026",
  balance: 0,
  actionsCount: 0,
  status: "Active"
});
localStorage.setItem("acaciaUsers", JSON.stringify(users));
```

Then log in with `admin@acacia.test` and `LocalDemoOnly!2026`. This is only a UI demonstration. Do not reuse that password or deploy this local administrator mechanism.

## Important: what is and is not connected

This is still a **browser-only demonstration**, not a production ride-hailing/food-delivery service. The visible banner is intentional.

The following require a trusted backend and provider credentials before real customers or money are involved:

- Secure authentication, password hashing, account recovery, role authorization and admin provisioning.
- A shared database and real-time job dispatch across different devices.
- Atomic job assignment, order state transitions, wallet ledger and reconciliation.
- M-Pesa Daraja STK Push, signed/verified callbacks, refunds and B2C payouts.
- Card payment gateway and PCI-compliant payment handling.
- Driver identity/vehicle document review, restaurant verification, fraud controls and audit logs.
- Maps/geocoding/routing API keys, operational notifications, customer privacy and production monitoring.

**Never treat browser localStorage as proof of payment or as a trusted wallet balance.** Demo top-ups and withdrawals do not send or receive money. Do not deploy this preview for live transactions.

## Technical notes

- No external API keys or secrets are included.
- The original `index.html`, `styles.css`, and `scripts.js` remain the app entry point.
- Demo data is local to one browser profile and can be cleared by the browser.
- The production backend must enforce permissions and financial calculations server-side; hiding UI controls is not security.
