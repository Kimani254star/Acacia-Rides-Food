# Acacia Rides & Food

Expo / React Native mobile application for Acacia rides, food delivery, and parcel requests, using Supabase for authentication and data storage.

## Project layout

```text
Acacia-Rides-Food/
├── app/                  # Expo Router screens and layouts
├── components/            # Reusable UI components
├── constants/             # Shared app constants and colors
├── hooks/                 # Reusable React hooks
├── lib/                   # Supabase client and configuration
├── services/               # Auth, profile, and service-request API functions
├── types/                  # Shared TypeScript types
├── supabase/
│   ├── migrations/         # SQL migrations
│   └── functions/          # Supabase Edge Functions (when added)
├── legacy-web-reference/   # Original HTML/CSS/JS reference files
├── assets/                 # Images, icons, and fonts (when added)
├── .env.example
├── .gitignore
├── app.json
├── package.json
└── README.md
```

## Requirements

- Node.js LTS
- npm
- Expo Go for quick device testing, or an Android/iOS development environment
- Supabase project

## Install and run

```bash
npm install
npm start
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

Run in a web browser:

```bash
npm run web
```

Type-check the project:

```bash
npm run typecheck
```

## Supabase setup

1. Create or open your Supabase project.
2. Review and run the SQL migration in `supabase/migrations/` using the Supabase SQL Editor.
3. Confirm Authentication settings, including email confirmation and redirect URLs, are appropriate for your app.
4. Configure the Supabase URL and publishable key in `lib/supabase-config.ts` before running the app. These are public client values; never put a service-role key or database password in the mobile app.
5. Review Row Level Security policies before using real customer data.

## GitHub: first push

Create an empty repository on GitHub, then run these commands from this project folder:

```bash
git init
git add .
git commit -m "Initial Acacia Rides and Food mobile app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

If the repository already exists and is cloned locally, copy these project files into the cloned folder and use:

```bash
git add .
git commit -m "Organize Acacia mobile app"
git push
```

## Security

- The Supabase publishable key may be used in a client application.
- Never commit service-role keys, database passwords, private API keys, or real `.env` files.
- Validate all permissions in Supabase Row Level Security policies.
- Payment processing must be verified on a trusted backend; do not trust client-side payment status.

## Current scope

The project is a starter implementation. Authentication, request submission, and request listing are present. Dispatch, production payments, advanced wallet operations, restaurant management, driver workflows, and admin dashboards require additional implementation and testing.


## Browser app install and activity logs

The included browser app is now an installable PWA when served over HTTPS. Use the browser Install app / Add to Home Screen command. Its offline cache contains only the static app shell; online services still need a connection. Activity Logs are available at `logs.html`, are stored locally on the device, and can be exported to CSV. The Expo native app remains a separate build target.
