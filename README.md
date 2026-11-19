# Full-stack task dashboard

A readable MERN application with account registration, JWT login, protected API routes, and a personal task dashboard. Tasks are stored in MongoDB and scoped to the signed-in user.

## Requirements

- Node.js 20 or newer
- npm
- MongoDB (local or MongoDB Atlas)

## Run locally

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI` to your MongoDB connection string.
3. Replace `JWT_SECRET` with a random value of at least 32 characters. Keep `.env` private.
4. Install dependencies and run both apps:

   ```sh
   npm install
   npm run dev
   ```

The React app is at `http://localhost:5173`; the Express API is at `http://localhost:5000`. Vite forwards `/api` requests to Express.

## Production

```sh
npm install
npm run build
npm start
```

In production, Express serves the built React app and API from the same origin. Set `MONGODB_URI`, `JWT_SECRET`, and `NODE_ENV=production` in the hosting provider's environment settings.

## Deploy on Render

1. Push the repository to GitHub.
2. In Render, choose **New → Blueprint** and select the repository. Render reads `render.yaml`.
3. Add your MongoDB Atlas connection string and a unique random `JWT_SECRET` in the service's environment settings.
4. Deploy and open the generated service URL.

The blueprint does not create a MongoDB database; provide a MongoDB Atlas URI. Never commit secrets or place them in frontend environment variables.

## API routes

- `POST /api/auth/register` — create an account
- `POST /api/auth/login` — authenticate and return a JWT
- `GET /api/tasks` — list the signed-in user's tasks
- `POST /api/tasks` — create a task
- `PATCH /api/tasks/:id` — update a task's completion state
- `DELETE /api/tasks/:id` — delete a task
- `GET /api/health` — service health check
