# Solo Leveling System

A full MERN solo-leveling productivity app with real user accounts, MongoDB persistence, quests, habits, rewards, weekly analytics, backups, and awakening notes.

## Features

- Real signup, login, and logout flow
- Persistent player profiles in MongoDB
- Fixed habits and fixed quests per user
- XP, levels, ranks, streaks, gold, and rewards
- Daily dashboard, weekly summary, and profile analytics
- Backup export/import and undo through stored snapshots
- Works locally and can be deployed for other users

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

## Required Env

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_BASE_PATH=/
```

### Backend `backend/.env`

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
CLIENT_URLS=http://localhost:5173
NODE_ENV=development
```

## Deployment

### Frontend

You can deploy the frontend to Vercel or Netlify.

Set these frontend env vars:

```env
VITE_API_BASE_URL=https://your-backend-domain/api
VITE_BASE_PATH=/
```

A `vercel.json` file is included for SPA routing.

### Backend

You can deploy the backend to Render.

A `render.yaml` file is included.

Set these backend env vars in Render:

```env
MONGODB_URI=your_atlas_uri
JWT_SECRET=your_secret
CLIENT_URLS=https://your-frontend-domain
NODE_ENV=production
```

If you use multiple frontend URLs, separate them with commas in `CLIENT_URLS`.

## Sharing With Others

Once deployed:

- each user creates their own account
- each user gets their own saved progress
- all app data is stored in MongoDB Atlas

## Tech Stack

- React + Vite
- Express
- MongoDB Atlas + Mongoose
- JWT authentication
