# PWA and activity logs

- Install Acacia Rides from a supported browser using its Install app / Add to Home Screen option after deployment over HTTPS.
- The web app shell is cached for offline startup; Supabase/API requests and user data are not cached. Booking actions requiring a network still need connectivity.
- Activity Logs is available from the navigation and at `logs.html`. Logs are device-local, limited to 2,000 events, and can be exported as CSV. Form values and credentials are deliberately excluded.
- The Expo native app remains a separate target; this PWA setup applies to the included browser app.
