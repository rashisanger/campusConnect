# CampusConnect deployment guide

Deploy the Express API to Render and the Vite single-page app to Vercel. Keep credentials in each provider's environment-variable settings; do not commit `.env` files.

## 1. Prepare MongoDB Atlas

1. Create or select an Atlas cluster and database user.
2. In Atlas **Network Access**, allow connections from your Render service. Render outbound addresses depend on the plan; use a static outbound IP where available. `0.0.0.0/0` is broader access and should only be used if required for a student deployment, with a strong database password.
3. Copy the Atlas connection string and replace its username, password, and database name with the actual values.
4. Run the seed once after the API environment is configured if the first admin account or default categories are needed. The seed does not create sample users, events, or registrations.

## 2. Deploy the backend to Render

1. Push the repository to a Git provider and create a **Web Service** in Render from that repository.
2. Set **Root Directory** to `server`.
3. Set **Runtime** to Node.
4. Set **Build Command** to `npm install`.
5. Set **Start Command** to `npm start`.
6. Add these environment variables in the Render service settings:

   | Variable | Value |
   |---|---|
   | `MONGODB_URI` | Atlas connection string for the production database |
   | `JWT_SECRET` | A fresh, long, random secret; never reuse a checked-in value |
   | `JWT_EXPIRES_IN` | Token lifetime, for example `7d` |
   | `CLIENT_URL` | Comma-separated allowed frontend origins, e.g. `http://localhost:5173,https://your-campusconnect.vercel.app` |
   | `NODE_ENV` | `production` |
   | `ADMIN_EMAIL` | Email used by the one-time initial-admin seed, if needed |
   | `ADMIN_PASSWORD` | Strong initial admin password, if running the seed |

   Render supplies `PORT` to the service automatically; the server listens on that value. Do not set it to a fixed port unless your Render configuration specifically requires it.

7. Deploy, then confirm `https://<your-render-service>.onrender.com/api/health` returns `{"status":"ok"}`.
8. To seed the first admin, use Render's Shell for the service and run `npm run seed` from its root directory. Keep the seed credentials in the protected service environment; remove `ADMIN_PASSWORD` from the service environment after initial setup if no longer needed.

## 3. Deploy the frontend to Vercel

1. Import the same repository into Vercel.
2. Set **Root Directory** to `client`.
3. Select the Vite framework preset (or configure it manually).
4. Use build command `npm run build` and output directory `dist`.
5. Add this environment variable for the Production environment (and Preview if desired):

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://<your-render-service>.onrender.com/api` |

6. Deploy. [client/vercel.json](../client/vercel.json) rewrites frontend paths to `index.html`, so React Router routes work when refreshed directly.
7. Copy the deployed Vercel origin, such as `https://your-campusconnect.vercel.app`, and add it to Render's `CLIENT_URL`. Include localhost as another comma-separated origin if local browser development should still call the deployed API.
8. Save the Render environment change and redeploy/restart the API. Verify both the health endpoint and a browser request from the deployed site.

## 4. Local development and secrets

- Backend: in PowerShell, run `Set-Location server; npm install; npm run dev`.
- Frontend: in another PowerShell terminal, run `Set-Location client; npm install; npm run dev`.
- Set `server/.env` values for `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `PORT`, and seed credentials only on your machine. Keep this file untracked.
- Set `client/.env` to `VITE_API_URL=http://localhost:5000/api` for local development. Vite exposes `VITE_` variables to browser code, so only the API base URL belongs there—never put database credentials or JWT signing secrets in client variables.
- `CLIENT_URL` is an allowlist of browser origins, not an API URL; list each frontend origin separated by commas.
- Use distinct Atlas credentials and JWT secrets for local and production environments.
