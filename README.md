# KaziLink

Incident alert and task management system built for **IKA 360** (Ika Three Sixty), a Zoho Partner firm in Kenya. Developed by **Marydiana Wangila (25-0678)** as part of a Diploma in ICT industrial attachment project at Daystar University.

KaziLink replaces manual communication with centralized incident reporting, alert notifications, task assignment, and progress tracking.

## Tech Stack

- **Frontend**: React.js (Vite) + Redux Toolkit + Tailwind CSS + React Router v6
- **Backend**: Node.js + Express.js (Vercel serverless functions in `/api`)
- **Database**: MongoDB Atlas via Mongoose
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Charts**: Recharts
- **Icons**: react-icons (Lucide set)
- **Toasts**: react-toastify

## Roles

| Role | Access |
|---|---|
| Admin | Full system access, user management, all reports and logs |
| Team Lead | Create incidents, assign tasks, view team reports |
| Developer | View/update own tasks, comment on incidents |
| Client | View project progress, submit feedback via comments |

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your MongoDB Atlas URI and JWT secret (a working `.env` is already included for this project's Atlas cluster).

3. Seed the database with demo data:
   ```bash
   npm run seed
   ```

4. Start the app (runs the Express API on port 5000 and Vite dev server on port 5173, proxying `/api` to the API server):
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173

### Demo accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@ika360.com | Admin@123 |
| Team Lead | teamlead@ika360.com | Lead@123 |
| Developer | dev1@ika360.com | Dev@123 |
| Developer | dev2@ika360.com | Dev@123 |
| Client | client@ika360.com | Client@123 |

## Deployment (Vercel)

1. Push this repository to GitHub.
2. Import the repo in Vercel.
3. Set environment variables `MONGO_URI` and `JWT_SECRET` in the Vercel project settings.
4. Deploy — `vercel.json` handles routing the Vite build output and the `/api` serverless functions.

## Project Structure

```
sysalert-hub/
├── api/            Vercel serverless backend (auth, users, projects, incidents, tasks, notifications, logs, dashboard)
├── lib/            Shared backend helpers (db connection, auth middleware, notifications, activity logging)
├── models/         Mongoose schemas
├── src/            React frontend (pages, components, Redux store)
├── scripts/        Database seed script
└── server.js       Local Express dev server that mounts the /api handlers
```

## Notes

- The IKA 360 logo is currently rendered as styled text (`IKA360`, with the "3" in orange and "6" in olive-green) in the Sidebar and Login page. Replace it with `<img src="/logo.png" />` once the official logo file is available.
- All Vercel serverless functions in `/api` double as Express-mounted routes locally via `server.js`, so the same handler code runs in both environments.
