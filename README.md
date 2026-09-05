# Planora — AI-Powered Study Planner

Planora is an intelligent study management and planning web application designed for students. It combines relational subject tracking, flexible task scheduling, AI-assisted structured study plan generation, and AI concept explanations.

---

## 🌟 Key Features

- **Authentication**: Secure registration and login with JWT and bcrypt password hashing.
- **Dashboard**: High-level productivity metrics, overall progress tracking, and recent tasks.
- **Subject Management (PostgreSQL)**: Create, view, update, and manage subjects linked to user accounts.
- **Task Management (MongoDB)**: Create, filter, prioritize, and track completion of study tasks.
- **AI Study Planner**: Generate structured day-by-day study plans customized to subject, available time, target exam date, and weak topics.
- **AI Concept Explainer**: Break down difficult concepts into bite-sized, level-appropriate explanations.
- **Saved Plans**: Store and review AI-generated study plans.

---

## 🏗️ Architecture & Tech Stack

```
                    ┌─────────────────────┐
                    │    React Client     │
                    │   (Vite + Router)   │
                    └──────────┬──────────┘
                               │ HTTPS / REST
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    │ (Node.js ES Modules)│
                    └──────┬───────┬──────┘
                           │       │
              ┌────────────┘       └─────────────┐
              ▼                                  ▼
     ┌─────────────────┐                 ┌─────────────────┐
     │   PostgreSQL    │                 │    MongoDB      │
     │ Users, Subjects │                 │Tasks, StudyPlans│
     └─────────────────┘                 └─────────────────┘
                           │
                           ▼
                    ┌─────────────────┐
                    │     LLM API     │
                    │ AI Plans/Explain│
                    └─────────────────┘
```

- **Frontend**: React, Vite, React Router, Lucide Icons, Modern Vanilla CSS Design System.
- **Backend**: Node.js, Express.js (REST API).
- **Databases**:
  - **PostgreSQL**: Users, Subjects (Relational constraints, Foreign Keys, SQL JOINs).
  - **MongoDB**: Tasks, Saved Study Plans (Flexible document modeling).
- **AI Integration**: Backend-proxied LLM with structured output validation.

---

## 📁 Project Structure

```
Planora/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page views (Dashboard, Subjects, Tasks, AIPlanner, etc.)
│   │   ├── services/       # API client service
│   │   ├── App.jsx         # Routes & Layout
│   │   ├── main.jsx        # App entry point
│   │   └── index.css       # Design system & responsive styles
├── server/                 # Express backend
│   ├── config/             # PostgreSQL and MongoDB connection configs
│   ├── controllers/        # Request handlers & business logic
│   ├── middleware/         # Auth, validation, and error middlewares
│   ├── models/             # Mongoose schemas & PG queries
│   ├── routes/             # Express API routes
│   ├── services/           # LLM service & prompt engineering
│   ├── server.js           # Express application entry point
│   └── .env.example        # Environment variable template
├── prd.md                  # Product Requirements Document
├── design.md               # Design & UI Specification
├── hld.md                  # High-Level Architecture
├── lld.md                  # Low-Level Design & Schemas
├── phases.md               # 13-Phase Development Roadmap
└── rules.md                # Engineering constraints & guidelines
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- MongoDB
- LLM API Key (e.g. Gemini / OpenAI / Groq)

### Installation
1. Install all dependencies:
   ```bash
   npm run install:all
   ```

2. Configure environment variables in `server/.env`:
   ```bash
   cp server/.env.example server/.env
   # Update server/.env with your database credentials and LLM API key
   ```

3. Start development servers:
   - Backend: `npm run dev:server` (running on `http://localhost:5000`)
   - Frontend: `npm run dev:client` (running on `http://localhost:5173`)

---

## 🧠 JavaScript Core Concepts (Phase 11)

Planora intentionally showcases 6 foundational JavaScript concepts embedded directly in real production architecture:
1. **async / await**: Non-blocking async endpoints, database transactions, and retry logic.
2. **Promises**: Concurrent execution (`Promise.all`), timeout races (`Promise.race` with `withTimeout`).
3. **Callbacks**: Error-first callbacks, Express middleware (`req, res, next`), higher-order array methods.
4. **Closures**: Encapsulated state memoization (`createMemoizer`), rate limiting, and client-side `debounce`.
5. **Event Loop**: Call stack execution priority, microtask queue (`Promise.then`) vs macrotask queue (`setTimeout`).
6. **Hoisting**: Function declaration hoisting vs. Temporal Dead Zone (`let` / `const`).

📖 **Read the in-depth architectural guide**: [`docs/JAVASCRIPT_CONCEPTS.md`](docs/JAVASCRIPT_CONCEPTS.md)

### Running Automated Test Suites
```bash
# Run JavaScript Core Concepts test suite (22 assertions)
npm run test:js

# Run full regression test suite (Foundation, Auth, Subjects, Tasks, Dashboard, Saved Plans, JS)
npm run test:all
```
