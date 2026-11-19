# Feature preservation map

| Original browser project area | Mobile/Supabase destination |
|---|---|
| Customer dashboard and ride booking | Native customer home + `service_requests` |
| Food ordering | `service_requests` + `restaurants`, `menu_items`, `order_items` |
| Parcel requests | `service_requests` with `service_type='parcel'` |
| Driver dashboard / jobs | `driver_profiles` + assigned `service_requests` |
| Restaurant dashboard / menus | `restaurants` + `menu_items` |
| Admin dashboard / revenue / commission | Admin role + `payments`, `wallet_ledger`, `app_settings` (admin UI still to build) |
| Testimonials and ratings | `feedback` with moderation fields |
| Complaints/support | `complaints` |
| GPS location helpers | Coordinate columns and Android location permission declaration (native GPS integration still to implement) |
| Browser localStorage | Supabase Postgres + Auth |

The supplied source is a single HTML/CSS/JavaScript browser application with localStorage persistence. This package ports the product direction and establishes a native app and secure shared data model; it does not claim every legacy interaction has already been reimplemented.


## Shared Supabase project

This app is configured for the same Supabase project as the uploaded Sweet Flowers Garden VOL 2 app. Its database objects are isolated with the `arf_` prefix to avoid colliding with the Garden app's `sfg_` tables. Both apps still share the Supabase Auth user directory; account role/profile records are app-specific.
