# Planora — Low-Level Design

## 1. Frontend Structure

client/
- src/
  - components/
    - Navbar.js
    - Sidebar.js
    - StatsCard.js
    - ProgressCard.js
    - TaskCard.js
    - TaskList.js
    - SubjectCard.js
    - SubjectForm.js
    - TaskForm.js
    - PlannerForm.js
    - DayCard.js
  - pages/
    - Login.js
    - Register.js
    - Dashboard.js
    - Subjects.js
    - Tasks.js
    - AIPlanner.js
    - StudyPlans.js
  - services/
    - api.js
  - App.js
  - main.js

## 2. Backend Structure

server/
- config/
  - postgres.js
  - mongo.js
- controllers/
  - authController.js
  - subjectController.js
  - taskController.js
  - aiController.js
  - studyPlanController.js
- middleware/
  - authMiddleware.js
  - errorMiddleware.js
- models/
  - Task.js
  - StudyPlan.js
- routes/
  - authRoutes.js
  - subjectRoutes.js
  - taskRoutes.js
  - aiRoutes.js
  - studyPlanRoutes.js
- services/
  - llmService.js
- server.js

## 3. API Request Flow

### Task Creation
1. React submits task form.
2. Frontend sends POST /api/tasks.
3. Auth middleware verifies JWT.
4. Controller validates input.
5. Task model writes to MongoDB.
6. Server returns 201 with created task.
7. React updates state.

### AI Study Plan
1. User submits planner form.
2. React sends POST /api/ai/study-plan.
3. Auth middleware verifies user.
4. Controller validates planner input.
5. LLM service builds prompt.
6. LLM API is called.
7. Structured output is validated.
8. Response is returned to frontend.
9. Frontend renders plan.
10. User may save the plan.

## 4. Task Model
Fields:
- _id
- userId
- title
- description
- subjectId
- priority
- status
- dueDate
- createdAt
- updatedAt

Priority:
- low
- medium
- high

Status:
- pending
- completed

## 5. StudyPlan Model
Fields:
- _id
- userId
- subject
- days
- plan
- createdAt

Each plan item:
- day
- topic
- duration
- tasks[]

## 6. PostgreSQL Tables

users:
- id PK
- name
- email UNIQUE
- password
- created_at

subjects:
- id PK
- user_id FK → users.id
- name
- created_at

## 7. AI Prompt Design
System instruction:
You are an expert study planner. Create a realistic study plan using the user's available time, current level, and weak areas. Return only the required structured format.

User input:
- subject
- days
- hours per day
- knowledge level
- weak topics
- exam date

## 8. Structured Output Contract
{
  "plan": [
    {
      "day": 1,
      "topic": "string",
      "duration": 120,
      "tasks": ["string"]
    }
  ]
}

Validation must ensure:
- plan exists
- day is a number
- topic is a string
- duration is a positive number
- tasks is an array

## 9. Error Middleware
The centralized error middleware returns:
{
  "message": "User-friendly error message"
}

Technical error details stay in server logs.

## 10. Frontend State
Dashboard:
- tasks
- subjects
- loading
- error

Tasks:
- tasks
- formData
- loading
- error
- filters

AI Planner:
- formData
- plan
- loading
- error

## 11. Client Routing
- /login
- /register
- /dashboard
- /subjects
- /tasks
- /ai-planner
- /study-plans

Protected routes require authentication.
