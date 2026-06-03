# Smart Student Expense Tracker with AI Financial Insights

An AI-powered web platform that enables students and parents to collaboratively track, analyze, and manage student expenses in real time. The platform automatically categorizes expenses, generates spending insights, predicts future expenses, and promotes better financial habits.

## Features

- **User Authentication** — Register/login with JWT (student & parent roles)
- **Expense Tracking** — Add, edit, delete expenses with date and category
- **Auto-Categorization** — AI-powered category detection from expense descriptions
- **Budget Management** — Set monthly budgets per category with progress tracking
- **Dashboard** — Visual spending breakdown, trends, and budget alerts
- **AI Insights** — Smart financial advice, spending predictions, and saving tips

## Tech Stack

| Layer     | Technology                      |
|-----------|---------------------------------|
| Frontend  | React 18, Vite, React Router    |
| Backend   | Node.js, Express.js             |
| Database  | SQLite (via better-sqlite3)     |
| Auth      | JWT (jsonwebtoken + bcryptjs)   |
| AI        | Built-in pattern analysis engine|

## Project Structure

```
student-expense-tracker/
├── client/                  # React frontend
│   ├── src/
│   │   ├── pages/           # Login, Register, Dashboard, Expenses, Budgets, Insights
│   │   ├── context/         # Auth context
│   │   └── services/        # API service (Axios)
│   └── package.json
├── server/                  # Express backend
│   ├── controllers/         # Auth, Expense, Budget, Dashboard, AI controllers
│   ├── routes/              # API route definitions
│   ├── middleware/           # JWT authentication middleware
│   ├── services/            # AI insights engine
│   ├── config/              # Database configuration
│   └── package.json
├── database/
│   └── schema.sql           # SQLite schema
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 16+

### 1. Install backend dependencies
```bash
cd server
npm install
```

### 2. Install frontend dependencies
```bash
cd client
npm install
```

### 3. Start the backend server
```bash
cd server
node server.js
# Server runs on http://localhost:5000
```

### 4. Start the frontend dev server
```bash
cd client
npm run dev
# Frontend runs on http://localhost:3000
```

### 5. Open in browser
Navigate to `http://localhost:3000`

## API Endpoints

| Method | Endpoint              | Description              | Auth |
|--------|-----------------------|--------------------------|------|
| POST   | /api/auth/register    | Register new user        | No   |
| POST   | /api/auth/login       | Login                    | No   |
| GET    | /api/auth/profile     | Get user profile         | Yes  |
| GET    | /api/expenses         | List expenses            | Yes  |
| POST   | /api/expenses         | Add expense              | Yes  |
| PUT    | /api/expenses/:id     | Update expense           | Yes  |
| DELETE | /api/expenses/:id     | Delete expense           | Yes  |
| GET    | /api/expenses/categories | List categories       | Yes  |
| GET    | /api/budgets          | List budgets             | Yes  |
| POST   | /api/budgets          | Set budget               | Yes  |
| DELETE | /api/budgets/:id      | Delete budget            | Yes  |
| GET    | /api/dashboard/summary| Dashboard summary        | Yes  |
| GET    | /api/ai/insights      | AI financial insights    | Yes  |

## Expense Categories

Food, Transport, Shopping, Entertainment, Subscriptions, Education, Health, Utilities, Other — auto-detected from expense descriptions.
