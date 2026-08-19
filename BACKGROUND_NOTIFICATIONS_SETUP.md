# Adn Tracker — Background Notifications Setup

The app now supports background push reminders for prayer, study, calendar events, borrow/lend return dates, and optional water reminders.

## 1. Install the server dependency

From the `server` folder:

```bash
npm install
```

## 2. Generate VAPID keys

Run:

```bash
npm run generate-vapid
```

The command prints three values.

Add these to your **Render** service environment variables. The code cannot create or inject Render environment variables automatically, so this step is required for production:

```text
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:your-email@example.com
```

Keep `VAPID_PRIVATE_KEY` secret. Never commit it to GitHub.

## 3. Keep the existing backend variables

```text
MONGODB_URI=your-mongodb-connection-string
FRONTEND_ORIGIN=https://adntracker.netlify.app
JWT_SECRET=your-long-random-secret
PORT=10000
```

Render normally supplies `PORT`; the server already uses `process.env.PORT`.

## 4. Deploy the backend

Push the updated `server` code to GitHub and wait for Render to show the service as live.

The health endpoint should report that push is configured:

```text
https://habit-tracker-lwfi.onrender.com/api/health
```

## 5. Deploy the frontend

No VAPID public key needs to be added to Netlify. The frontend fetches the public key securely from the backend.

Your existing Netlify variable remains:

```text
VITE_API_URL=https://habit-tracker-lwfi.onrender.com/api
```

## 6. Enable notifications on the phone

1. Open Adn Tracker.
2. Keep it installed on the Home Screen.
3. Open **Profile → Reminders**.
4. Tap **Enable** under **Background notifications**.
5. Allow notifications.
6. Create a calendar reminder, prayer reminder, study reminder, or borrow/lend return reminder.
7. Close Adn Tracker and test it.

### iPhone

Web Push notifications require a supported iOS/iPadOS version and the site must be installed to the Home Screen. Allow notifications when prompted.

### Important Render free-tier note

The reminder scheduler runs on the Render web service. If the free Render instance is sleeping, a reminder can be delayed until the service wakes. For dependable exact-time reminders, keep the backend awake or run the reminder scheduler as an always-on/cron-capable service.


## 7. If Profile says “Cannot reach notification server”

Open **Profile → Reminders** and look at the API line shown under the notification status when the server is unavailable. It should point to:

`https://habit-tracker-lwfi.onrender.com/api/health`

If the URL is wrong, set the Netlify environment variable `VITE_API_URL` to your Render API URL and redeploy the frontend. The frontend also has a production fallback to the current Render API URL when `VITE_API_URL` is missing.

If the API responds but push is not configured, Render is missing one or both VAPID variables. Add them, redeploy the Render service, then use **Enable / Refresh** again.
