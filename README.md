# Planora — AI-Powered Study Planner

Planora is an intelligent study management and planning web application for students. It combines relational subject tracking, flexible task scheduling, AI-assisted structured study plan generation, and AI concept explanations — all within a modern glassmorphic dark-theme UI.

---

## 🌟 Key Features

- **Authentication**: Secure registration and login with JWT and bcrypt password hashing.
- **Dashboard**: High-level productivity metrics, overall progress tracking, and recent tasks.
- **Subject Management (PostgreSQL)**: Create, view, update, and manage academic subjects.
- **Task Management (MongoDB)**: Create, filter, prioritize, and track completion of study tasks.
- **AI Study Planner**: Generate structured day-by-day study plans customized to subject, available time, exam date, and weak topics.
- **AI Concept Explainer**: Break down difficult concepts into bite-sized, level-appropriate explanations.
- **Saved Plans**: Store, browse, and delete AI-generated study plans.

---

## 🏗️ Architecture & Tech Stack

```
                    ┌─────────────────────┐
                    │    React Client     │
                    │   (Vite + Router)   │
                    └──────────┬──────────┘
                               │ REST API (JSON)
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    │ (Node.js ES Modules)│
                    └──────┬───────┬──────┘
                           │       │
              ┌────────────┘       └────────────┐
              ▼                                 ▼
     ┌─────────────────┐                ┌─────────────────┐
     │   PostgreSQL    │                │    MongoDB      │
     │ Users, Subjects │                │Tasks, StudyPlans│
     └─────────────────┘                └─────────────────┘
                                               │
                                               ▼
                                    ┌─────────────────┐
                                    │   Google Gemini │
                                    │  LLM API (AI)   │
                                    └─────────────────┘
```

| Layer | Technology |
| :--- | :--- |
| Frontend | React 18, Vite, React Router v6, Lucide Icons, Vanilla CSS |
| Backend | Node.js, Express.js, ES Modules |
| Database (Relational) | PostgreSQL — Users, Subjects |
| Database (Document) | MongoDB / Mongoose — Tasks, Saved Study Plans |
| AI / LLM | Google Gemini API with structured output + fallback |
| Auth | JWT (`jsonwebtoken`), bcrypt (`bcryptjs`) |

---

## 📁 Project Structure

```
Planora/
├── client/                        # React frontend (Vite)
│   ├── src/
│   │   ├── components/            # Reusable UI components
│   │   ├── pages/                 # Page views (Dashboard, Subjects, Tasks, AI, etc.)
│   │   ├── services/api.js        # Axios-based API client service
│   │   ├── utils/debounce.js      # Closure-based debounce utility
│   │   ├── App.jsx                # Routes & Layout
│   │   ├── main.jsx               # App entry point
│   │   └── index.css              # Design system & responsive styles
├── server/                        # Express backend
│   ├── config/                    # PostgreSQL & MongoDB connection configs
│   ├── controllers/               # Request handlers & business logic
│   ├── middleware/                # Auth, validation, and error middlewares
│   ├── models/                    # Mongoose schemas & PostgreSQL query helpers
│   ├── routes/                    # Express API route definitions
│   ├── scripts/                   # Automated test scripts
│   ├── services/llmService.js     # Gemini API integration & prompt engineering
│   ├── utils/jsPatterns.js        # JavaScript core concept implementations
│   ├── server.js                  # Express application entry point
│   └── .env.example               # Environment variable template
├── docs/
│   └── JAVASCRIPT_CONCEPTS.md     # JavaScript core concepts documentation
├── prd.md                         # Product Requirements Document
├── design.md                      # Design & UI Specification
├── hld.md                         # High-Level Architecture
├── lld.md                         # Low-Level Design & Schemas
├── phases.md                      # 13-Phase Development Roadmap
└── rules.md                       # Engineering constraints & guidelines
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or remote)
- MongoDB (running locally or remote)
- LLM API Key — Google Gemini (recommended), OpenAI, or Groq

### Installation

1. **Install all dependencies** (server + client):
   ```bash
   npm run install:all
   ```

2. **Configure environment variables**:
   ```bash
   cp server/.env.example server/.env
   ```

   Edit `server/.env` with your credentials:

   | Variable | Description | Default / Example |
   | :--- | :--- | :--- |
   | `PORT` | Express server port | `5000` |
   | `NODE_ENV` | Environment | `development` |
   | `JWT_SECRET` | Secret for JWT signing | *(required)* |
   | `PG_HOST` | PostgreSQL host | `localhost` |
   | `PG_PORT` | PostgreSQL port | `5432` |
   | `PG_DATABASE` | PostgreSQL database name | `planora` |
   | `PG_USER` | PostgreSQL username | `postgres` |
   | `PG_PASSWORD` | PostgreSQL password | *(required)* |
   | `MONGO_URI` | MongoDB connection URI | `mongodb://localhost:27017/planora` |
   | `LLM_API_KEY` | Google Gemini API key | *(required for AI features)* |
   | `LLM_MODEL` | Gemini model name | `gemini-2.5-flash` |

3. **Initialize the PostgreSQL schema**:
   ```bash
   npm run db:init
   ```

4. **Start development servers**:
   ```bash
   # Terminal 1 — Backend API
   npm run dev:server   # http://localhost:5000

   # Terminal 2 — Frontend
   npm run dev:client   # http://localhost:5173
   ```

---

## 📡 REST API Reference

All endpoints prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth (`/api/auth`)

| Method | Path | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/register` | ❌ | Register new user → returns JWT |
| `POST` | `/login` | ❌ | Login → returns JWT |
| `GET` | `/me` | ✅ | Get authenticated user profile |

### Subjects (`/api/subjects`)

| Method | Path | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/` | ✅ | List all subjects for user |
| `POST` | `/` | ✅ | Create new subject |
| `GET` | `/:id` | ✅ | Get single subject |
| `PUT` | `/:id` | ✅ | Update subject |
| `DELETE` | `/:id` | ✅ | Delete subject |

### Tasks (`/api/tasks`)

| Method | Path | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/` | ✅ | List tasks (filter by `?status=`, `?subjectId=`, `?priority=`) |
| `POST` | `/` | ✅ | Create new task |
| `GET` | `/:id` | ✅ | Get single task |
| `PUT` | `/:id` | ✅ | Update task (status, title, priority, etc.) |
| `DELETE` | `/:id` | ✅ | Delete task |

### AI (`/api/ai`)

| Method | Path | Auth | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/study-plan` | ✅ | Generate structured multi-day study plan |
| `POST` | `/explain` | ✅ | Generate concept explanation |

**Study Plan Request Body**:
```json
{
  "subject": "Data Structures",
  "days": 5,
  "hoursPerDay": 2,
  "knowledgeLevel": "intermediate",
  "weakTopics": "Graph Traversals, Dynamic Programming",
  "examDate": "2026-11-01"
}
```

### Saved Study Plans (`/api/study-plans`)

| Method | Path | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/` | ✅ | List all saved plans for user |
| `POST` | `/` | ✅ | Save an AI-generated study plan |
| `GET` | `/:id` | ✅ | Get single saved plan (owner only) |
| `DELETE` | `/:id` | ✅ | Delete saved plan (owner only) |

### System

| Method | Path | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/api/health` | ❌ | Health check — returns uptime & status |

---

## 🧪 Test Suites

Run individual or all test suites:

```bash
# Individual suites
npm run test:foundation     # Backend Foundation (7 tests)
npm run test:auth           # Authentication & JWT (9 tests)
npm run test:subjects       # Subject CRUD (10 tests)
npm run test:tasks          # Task CRUD (11 tests)
npm run test:dashboard      # Dashboard Aggregates (5 tests)
npm run test:saved-plans    # Saved Study Plans (12 tests)
npm run test:js             # JavaScript Core Concepts (22 tests)
npm run test:phase12        # Phase 12 Comprehensive E2E (30 tests)

# Full regression suite (all suites, 106 assertions)
npm run test:all
```

**Test Coverage**:
| Suite | Tests | Coverage Areas |
| :--- | :---: | :--- |
| Foundation | 7 | Server start, DB connections, routes, error middleware |
| Auth | 9 | Registration, login, JWT, bcrypt, protected routes |
| Subjects | 10 | CRUD, validation, cross-user isolation |
| Tasks | 11 | CRUD, status toggle, filtering, validation |
| Dashboard | 5 | Aggregate stats, progress calculation |
| Saved Plans | 12 | Save/fetch/delete, auth guards, cross-user 403 |
| JS Concepts | 22 | All 6 core JS concepts: closures, promises, async/await, callbacks, event loop, hoisting |
| Phase 12 E2E | 30 | End-to-end user journey, security matrix, AI resilience |
| **Total** | **106** | |

---

## 🧠 JavaScript Core Concepts (Phase 11)

Planora intentionally showcases **6 foundational JavaScript concepts** embedded naturally in real production architecture:

| Concept | Where in Planora |
| :--- | :--- |
| **async / await** | Controller endpoints, DB transactions, `retryWithBackoff` in `jsPatterns.js` |
| **Promises** | `Promise.all` in Dashboard, `Promise.race` via `withTimeout` in `llmService.js` |
| **Callbacks** | Express middleware (`req, res, next`), error-first callbacks, array `.filter`/`.map` |
| **Closures** | `createMemoizer`, `createRateLimiter` in `jsPatterns.js`, `debounce` in client |
| **Event Loop** | `traceEventLoopPhases()` proves Sync → Microtask → Macrotask priority |
| **Hoisting** | Function declarations hoisted above usage in `jsPatterns.js` |

📖 **Full documentation**: [`docs/JAVASCRIPT_CONCEPTS.md`](docs/JAVASCRIPT_CONCEPTS.md)

---

## 🔒 Security Highlights

- Passwords hashed with bcrypt (10 salt rounds) before persistence.
- JWTs signed with a configurable `JWT_SECRET` and expire after 7 days.
- All resource endpoints enforce ownership: cross-user access returns `403 Forbidden`.
- LLM API key stored server-side only — never exposed to the browser.
- Input validation middleware (`validateBody`) guards all mutation endpoints against missing fields.

---

## ⚙️ Available npm Scripts (Root)

```bash
npm run dev:server          # Start backend dev server (nodemon)
npm run dev:client          # Start frontend dev server (Vite)
npm run build:client        # Production build of React client
npm run install:all         # Install dependencies for server + client
npm run db:init             # Initialize PostgreSQL schema
npm run test:all            # Run complete regression suite
npm run check:gemini        # Verify Gemini API key is configured
```
