# LifeTrack database setup

This version removes the old demo dataset and stores the app state in MongoDB through the Express API in `server/`.

## 1. MongoDB Atlas

Create a MongoDB Atlas free cluster and copy its connection string. Put it in `server/.env` as `MONGODB_URI`.

Example:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/lifetrack
FRONTEND_ORIGIN=https://YOUR-NETLIFY-SITE.netlify.app
PORT=4000
```

Never commit `server/.env`.

## 2. Run the API locally

```powershell
cd server
npm install
npm run dev
```

Health check: `http://localhost:4000/api/health`

## 3. Run the React app locally

In a second terminal:

```powershell
npm run dev
```

For local API use, create `.env.local` in the project root:

```env
VITE_API_URL=http://localhost:4000/api
```

## 4. Deploy the API

Deploy the `server` folder to a Node hosting provider such as Render. Set the same environment variables there.

## 5. Connect Netlify

In Netlify, add this environment variable to the frontend project:

```env
VITE_API_URL=https://YOUR-BACKEND.onrender.com/api
```

Trigger a new frontend deploy after saving the variable.

## Data model

The API keeps one state document per generated device ID. There is no login/authentication in this first version; the random device ID is used to separate data. If you need accounts that can be securely accessed from multiple devices, add real authentication (email/password or OAuth) before treating the app as a multi-user private service.
