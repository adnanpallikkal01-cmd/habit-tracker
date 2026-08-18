# Adn Tracker API

Node/Express API that stores each device's Adn Tracker state in MongoDB.

## Local

1. `npm install`
2. Copy `.env.example` to `.env` and set `MONGODB_URI`.
3. `npm run dev`

The API runs on `http://localhost:4000`.

## Netlify

Set the frontend `VITE_API_URL` environment variable to the deployed API URL plus `/api`.
