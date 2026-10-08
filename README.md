# TripPlanner

TripPlanner is an India-inspired itinerary planner for organizing trips, INR budgets, and day-by-day activities. It includes user accounts, an admin dashboard, reviews, and a contact inbox.

For production hosting, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Features

- Register, log in, update profile details, and change passwords.
- Create and manage trips, budgets in Indian rupees, and itinerary activities.
- Admin statistics, user and trip moderation, reviews, and contact messages.
- Public About, Reviews, and Contact pages linked from the navbar and footer.
- Bcrypt password hashes, HTTP-only JWT session cookies, role checks, and trip ownership checks.

## Stack and database

Next.js App Router, React, MongoDB (`mongodb`), Axios, `jsonwebtoken`, and `bcryptjs`. API handlers use the MongoDB collections `users`, `trips`, `itineraries`, `reviews`, and `contact_messages`; `_counters` preserves the numeric IDs used by the existing API. References between documents use numeric IDs and are checked in each handler.

```text
Next.js UI → Route Handler → auth and validation → lib/db.js → MongoDB
```

## Setup

Requirements: Node.js 20.19 or newer and a running MongoDB server.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`; set `MONGODB_URI`, `MONGODB_DB`, and a private random `JWT_SECRET`.
3. Create indexes and insert demo rows into any empty collections with `npm run db:setup`.
4. Start the site with `npm run dev`.

For a local server, use `mongodb://localhost:27017/tripplanner`. Demo accounts are `admin@tripplanner.local`, `maya@example.com`, and `arjun@example.com`; all use `TripPlannerDemo2026!`. Change or remove these demo accounts before exposing the database to other people.

### Admin demo login

- Login page: `http://localhost:3000/login`
- Email: `admin@tripplanner.local`
- Password: `TripPlannerDemo2026!`

This is a seeded development account. Change its password and replace the demo credentials before deployment.

## One-time MySQL migration

The app no longer uses MySQL at runtime. `npm run db:migrate:mysql` is retained only as a one-time import utility. To run it from another environment, provide the source MySQL values with `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, and optionally `DB_PORT`, plus the MongoDB URI. It copies users, trips, itinerary items, reviews, and contact messages by ID, preserving password hashes. It does not delete or modify the MySQL source. Re-running it updates matching MongoDB documents by ID.

## AI trip planning

Every new trip uses the same five questions: destination (or “Surprise me”), starting city, travel group, dates, and travel style. The server sends these answers to Gemini and stores a multi-city route, arrival/transfer/stay suggestions, and day-by-day activities in MongoDB. Transport and stay costs are AI estimates, not live booking offers. Set `GEMINI_API_KEY` in `.env.local`; `GEMINI_MODEL` defaults to `gemini-3.5-flash-lite`. Keep the key on the server and never expose it in browser code. Generation stays unavailable until a valid API key is configured.

## Environment

- `MONGODB_URI`: MongoDB connection string.
- `MONGODB_DB`: database name (defaults to `tripplanner`).
- `GEMINI_API_KEY`: secret key for server-side AI itinerary generation. `GOOGLE_API_KEY` and `GOOGLE_GENERATIVE_AI_API_KEY` are also accepted.
- `GEMINI_MODEL`: optional Gemini model name (defaults to `gemini-3.5-flash-lite`).
- `UNSPLASH_ACCESS_KEY`: secret key for destination photo search.
- `JWT_SECRET`: private signing secret used by session tokens.
- `JWT_EXPIRES_IN`: token lifetime, such as `2h` or `1d` (defaults to `2h`).
- `NODE_ENV=production` enables secure cookies over HTTPS.

## API

All JSON responses use `{ success, message, data }` on success and `{ success: false, message }` on errors.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create a user account |
| POST | `/api/auth/login` | Start a session |
| POST | `/api/auth/logout` | End a session |
| GET | `/api/auth/me` | Read the current user |
| GET/PATCH/PUT | `/api/profile` | Read/update profile or change password |
| GET/POST | `/api/trips` | List owned trips or create one |
| GET/PUT/DELETE | `/api/trips/:id` | Read, update, or delete an owned trip |
| POST | `/api/itineraries` | Add an activity to an owned trip |
| PUT/DELETE | `/api/itineraries/:id` | Update or remove an owned activity |
| GET | `/api/admin/stats` | Dashboard totals |
| GET/PATCH/DELETE | `/api/admin/users` | Paginate, update status, or delete users |
| GET/DELETE | `/api/admin/trips` | Paginate or delete trips |
| GET | `/api/admin/trips/:id` | Read a trip and its itinerary |
| GET/POST | `/api/reviews` | List published reviews or submit one |
| POST | `/api/contact` | Send a contact message |
| GET/PATCH | `/api/admin/reviews` | List and moderate reviews |
| GET/PATCH | `/api/admin/messages` | Read and update contact messages |

Run `npm run build` to create a production build, then `npm start` to serve it. Keep MongoDB private and serve production traffic over HTTPS.


## Destination photos

The planner searches Unsplash for a photo matching the selected destination and shows it in the planning flow and trip details. Configure UNSPLASH_ACCESS_KEY in .env.local; keep it server-side. The photo search endpoint caches results for one day and shows Unsplash photographer attribution.
