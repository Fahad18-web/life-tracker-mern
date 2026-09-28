# LifeTracker

**Islamic lifestyle & habit tracking** — log daily good/bad habits, mood, streaks, replacements, and performance reports.

Built with the MERN stack. Designed for consistency, not clutter.

---

## Features

- **Daily logging** — good habits, bad habits, custom habits, mood, notes  
- **Live score & grades** — automatic net score (A–F)  
- **Streaks** — per-habit and overall logging streak  
- **Habit replacements** — link a bad habit to a good one and track success rate  
- **Performance report** — week / month / year charts (score, mood, consistency)  
- **Themes** — dark/light mode + color vibes (Teal, Ocean, Sunset, Forest, Violet)  
- **Secure API** — JWT auth, rate limiting, validation, centralized errors  

---


---

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React, Vite, Tailwind CSS v4, Chart.js, Lucide |
| Backend | Node.js, Express, Mongoose |
| Database | MongoDB |
| Auth | JWT + bcrypt |

---

## Project structure

```text
life-tracker-mern/
├── client/          # React (Vite) app
├── server/          # Express API
├── docs/
│   ├── screenshots/
│   └── USER_GUIDE.md
└── README.md