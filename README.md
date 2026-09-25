# 🌿 Life Tracker — MERN SaaS

Multi-user Islamic lifestyle & habit tracking platform.

## 📁 Project Structure

```
life-tracker-mern/
├── server/               ← Express + MongoDB Backend
│   ├── config/db.js
│   ├── controllers/      authController, entriesController, analyticsController
│   ├── middleware/        auth.js (JWT), errorHandler.js
│   ├── models/           User.js, Entry.js
│   ├── routes/           auth, entries, analytics, habits
│   ├── utils/            generateToken.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── client/               ← React + Vite Frontend
    ├── public/index.html
    ├── src/
    │   ├── api/          axiosInstance, authAPI, entriesAPI
    │   ├── components/   Header, ProtectedRoute
    │   ├── contexts/     AuthContext (login, register, logout)
    │   ├── hooks/        useEntries, useAnalytics
    │   ├── pages/        Dashboard, Log, History, Trends
    │   │   └── auth/     Login, Register
    │   └── styles/       globals.css (full design system)
    ├── .env.example
    ├── package.json
    └── vite.config.js
```

## 🚀 Quick Start

### 1. Server Setup
```bash
cd server
npm install
cp .env.example .env        # Fill MONGO_URI + JWT_SECRET
npm run dev                  # Runs on http://localhost:5000
```

### 2. Client Setup
```bash
cd client
npm install
npm run dev                  # Runs on http://localhost:5173
```

## 🔐 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | ❌ | Register new user |
| POST | /api/auth/login | ❌ | Login |
| GET | /api/auth/me | ✅ | Get profile |
| GET | /api/entries | ✅ | All entries (paginated) |
| POST | /api/entries | ✅ | Save/update today |
| GET | /api/entries/:date | ✅ | Entry by date |
| DELETE | /api/entries/:id | ✅ | Delete entry |
| GET | /api/analytics/weekly | ✅ | Last 7 days |
| GET | /api/analytics/monthly | ✅ | Last 30 days |
| GET | /api/analytics/streaks | ✅ | Habit streaks |

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs
- **Frontend:** React 18, Vite, React Router v6, Axios, Chart.js, Zustand, React Hot Toast
