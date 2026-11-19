# Acacia Ride-hailing upgrade

This update improves the existing browser prototype with a ride lifecycle inspired by common ride-hailing apps:

- Ride category selection: Economy, Premium, XL and Motorbike.
- A provisional base quote per category (not distance-based).
- Driver acceptance assigns the ride to that driver.
- Driver trip steps: accepted → arrived → in progress → completed.
- Driver earnings and platform commission are recorded only when the driver marks the trip completed.
- Rider activity shows the current trip status.
- Driver navigation opens the pickup-to-destination route in Google Maps.

## Important production requirements

The browser prototype still stores rides in localStorage. This means different phones/users do not share requests and it is not a real-time dispatch system. Production Uber/Bolt-style operation still requires Supabase-backed ride records, secure row-level policies, live driver GPS updates, a map/routing and distance-based fare provider, push notifications, driver identity/vehicle verification, cancellation/refund rules, and verified M-Pesa/card payment callbacks. The displayed category quote is a provisional base amount, not a final fare. Do not use the local prototype to take real payments or promise live driver matching.
