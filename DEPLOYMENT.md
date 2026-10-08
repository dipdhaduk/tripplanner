# Production deployment

TripPlanner is a full-stack Next.js app. Vercel is the simplest host for this project; production data must live in MongoDB Atlas or another MongoDB server reachable from the public internet. A local `mongodb://localhost:27017/...` address only works on the developer's computer.

## 1. Prepare MongoDB

1. Create a MongoDB Atlas cluster and a dedicated database user for TripPlanner.
2. Copy the Atlas connection string. Replace its database name with `tripplanner` and URL-encode any special characters in the database username or password.
3. Add the production host's outbound IPs or network range to the Atlas project's IP Access List. Keep the database user limited to the required database.

Atlas only accepts connections from addresses in its IP Access List. If the host uses changing outbound IPs, use the host's supported static-egress option or follow its current Atlas networking guidance. Avoid opening database access broadly unless required for a temporary setup.

## 2. Deploy the app to Vercel

1. Push this project to a private GitHub repository. `.env.local` is ignored by Git; never commit secrets.
2. Import the repository into Vercel and keep the detected Next.js framework settings. The build command is `npm run build`.
3. Add the following server-side environment variables in the Vercel project settings:

   - `MONGODB_URI`: the Atlas connection string.
   - `MONGODB_DB`: `tripplanner`.
   - `JWT_SECRET`: a long, randomly generated secret.
   - `GEMINI_API_KEY`: optional; enables AI itinerary generation.
   - `GEMINI_MODEL`: optional; defaults to `gemini-3.5-flash-lite`.
   - `UNSPLASH_ACCESS_KEY`: optional; enables destination photo search.
   - `PIXABAY_API_KEY`: optional image provider fallback.

   Keep all API keys server-side. Do not use `NEXT_PUBLIC_` prefixes for secrets. Vercel provides `NODE_ENV=production` automatically.
4. Deploy, then open the deployment URL and verify registration, login, trip creation, and the admin page.

Vercel loads environment variables for each deployment. Redeploy after changing them.

## 3. Create the first production admin

For a fresh production database, do **not** run `npm run db:setup`; that command is for local development and seeds demo users and sample records. Instead, use a trusted local terminal pointed at the Atlas database:

1. Put the Atlas `MONGODB_URI`, `MONGODB_DB`, `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` (12+ characters) in your ignored local `.env.local`.
2. Run `npm run admin:create`. The script creates one `ADMIN` account and does not print the password. If that admin email already exists, it makes no changes.
3. Remove `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env.local` when finished. Keep the production `MONGODB_URI` and `JWT_SECRET` in Vercel's server-side environment settings.

The app stores sessions in HTTP-only cookies and enables secure cookies in production. The database and API keys must remain private; only the site URL is public.

## Local production checks

```powershell
npm run lint
npm run build
```

