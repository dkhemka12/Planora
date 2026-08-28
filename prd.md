# Planora — Product Requirements Document

## 1. Product Overview
Planora is an AI-powered study planner for students. It helps users manage subjects and study tasks, track progress, generate personalized AI study plans, and get simple explanations of difficult concepts.

## 2. Goals
- Create and manage subjects.
- Create, read, update, and delete study tasks.
- Track completed and pending tasks.
- Generate personalized study plans using an LLM.
- Explain difficult concepts using AI.
- Save and view generated study plans.
- Demonstrate the required AI, backend, frontend, MongoDB, PostgreSQL, and engineering concepts.

## 3. Target User
Students who want a simple way to organize study work and use AI for planning and learning.

## 4. MVP Features
### Authentication
- Register
- Login
- Logout

### Dashboard
- Total subjects
- Total tasks
- Completed tasks
- Pending tasks
- Overall progress
- Recent tasks

### Subjects
- Create subject
- View subjects
- Update subject
- Delete subject

### Tasks
- Create task
- View tasks
- Update task
- Delete task
- Mark task complete
- Filter by subject, status, and priority

### AI Study Planner
Inputs:
- Subject
- Number of days
- Hours per day
- Knowledge level
- Weak topics
- Optional exam date

The LLM returns a structured study plan.

### AI Concept Explainer
Users enter a topic and select a difficulty level. Planora asks the LLM for a clear explanation.

### Saved Plans
- Save generated plans
- View saved plans
- Delete saved plans

## 5. API Endpoints
### Auth
- POST /api/auth/register
- POST /api/auth/login

### Subjects
- GET /api/subjects
- POST /api/subjects
- GET /api/subjects/:id
- PUT /api/subjects/:id
- DELETE /api/subjects/:id

### Tasks
- GET /api/tasks
- POST /api/tasks
- GET /api/tasks/:id
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

### AI
- POST /api/ai/study-plan
- POST /api/ai/explain

### Study Plans
- GET /api/study-plans
- POST /api/study-plans
- GET /api/study-plans/:id
- DELETE /api/study-plans/:id

## 6. Required Technical Coverage
- LLM API integration
- Prompt engineering
- Structured outputs
- Correct HTTP status codes
- Middleware
- Problem modeling
- RESTful API design
- Server-side error handling
- Frontend/backend/database/external-system integration
- Environment variables and secrets
- Git workflow
- Async API fetching
- Client-side routing
- JavaScript async/await
- Closures
- Event loop
- Hoisting
- Promises vs callbacks
- React component composition
- useEffect
- useState
- MongoDB CRUD
- MongoDB schema modeling
- PostgreSQL PK/FK
- SQL JOINs

## 7. Non-Functional Requirements
- API keys must never be exposed in frontend code.
- Passwords must be securely hashed.
- Protected resources require authentication.
- Errors should return clear responses.
- Loading states should be shown during API/LLM requests.
- UI should remain simple and responsive.

## 8. Out of Scope
- Social features
- Payments
- Calendar synchronization
- Real-time collaboration
- Voice AI
- File uploads
- Complex notifications
