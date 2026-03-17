# Solo Leveling System

A full MERN solo-leveling productivity app with real user accounts, MongoDB persistence, quests, habits, rewards, weekly analytics, backups, and awakening notes.

## Features

- Real signup, login, and logout flow
- Persistent player profiles in MongoDB
- Fixed habits and fixed quests per user
- XP, levels, ranks, streaks, gold, and rewards
- Daily dashboard, weekly summary, and profile analytics
- Backup export/import and undo through stored snapshots
- Netlify-ready no-card deployment path

## Local Run

### Frontend

1. Copy `.env.example` to `.env`
2. Run `npm install`
3. Run `npm run dev`

### Backend

1. Go to `backend/`
2. Copy `.env.example` to `.env`
3. Run `npm install`
4. Add a MongoDB Atlas or local MongoDB connection string
5. Run `npm run dev`

## Frontend Env

```env
VITE_API_BASE_URL=/api
VITE_BASE_PATH=/
```

For local-only development you can also use:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## Backend Env

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
CLIENT_URLS=http://localhost:5173,https://your-site.netlify.app
NODE_ENV=development
```

## Netlify No-Card Deployment

This repo includes:

- `netlify/functions/api.js`
- `netlify.toml`

### Deploy Steps

1. Push the repo to GitHub
2. Create a new Netlify site from the repo
3. Netlify will use `netlify.toml` automatically
4. In Netlify Site Configuration add env vars:

```env
MONGODB_URI=your_atlas_uri
JWT_SECRET=your_secret
CLIENT_URLS=https://your-site.netlify.app,http://localhost:5173
NODE_ENV=production
VITE_API_BASE_URL=/api
VITE_BASE_PATH=/
```

5. Redeploy the site
6. Open your Netlify URL and create accounts for each user

## Sharing With Others

Once deployed on Netlify:

- you and your friend can both sign up separately
- each account gets separate saved data
- MongoDB Atlas stores all user progress

## Tech Stack

- React + Vite
- Express
- MongoDB Atlas + Mongoose
- JWT authentication
- Netlify Functions
