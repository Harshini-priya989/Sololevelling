# Solo Leveling System Backend

Separate MERN backend for the solo-leveling frontend.

## Setup

1. `cd backend`
2. Copy `.env.example` to `.env`
3. Run `npm install`
4. Set `MONGODB_URI` or `MONGO_URI`
5. Set `JWT_SECRET`
6. Run `npm run dev`

## Supported Env Vars

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
CLIENT_URLS=http://localhost:5173
NODE_ENV=development
```

`CLIENT_URLS` supports multiple comma-separated frontend URLs.

## Main Routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/game/overview`
- `GET /api/game/state`
- `PUT /api/game/profile`
- `PUT /api/game/settings`
- `PATCH /api/game/streak`
- `POST /api/game/sync-streak`
- `POST /api/game/reset-season`
- `POST /api/game/hard-reset`
- `GET /api/game/backup/export`
- `POST /api/game/backup/import`
- `GET /api/habits`
- `PATCH /api/habits/:habitId/complete`
- `GET /api/quests`
- `PATCH /api/quests/:questId/complete`
- `PATCH /api/quests/:questId/fail`
- `PATCH /api/quests/:questId/focus`
- `GET /api/rewards`
- `POST /api/rewards/:rewardId/redeem`
- `GET /api/awakening`
- `PUT /api/awakening`

## Deployment Notes

- MongoDB Atlas is recommended for production
- Render is a good backend host for this server
- Set `CLIENT_URLS` to your deployed frontend domain so CORS allows it

## Auth

Send:

`Authorization: Bearer <token>`
