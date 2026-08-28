# Planora — High-Level Design

## 1. System Overview

Planora is a three-tier web application with external AI integration.

Components:
1. React frontend
2. Express backend
3. PostgreSQL
4. MongoDB
5. LLM API

## 2. Architecture

                    ┌─────────────────────┐
                    │    React Client     │
                    │                     │
                    │ Router / Components │
                    └──────────┬──────────┘
                               │ HTTPS/REST
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    │                     │
                    │ Routes              │
                    │ Middleware          │
                    │ Controllers         │
                    │ Services            │
                    └──────┬───────┬──────┘
                           │       │
              ┌────────────┘       └─────────────┐
              ▼                                  ▼
     ┌─────────────────┐                 ┌─────────────────┐
     │   PostgreSQL    │                 │    MongoDB      │
     │                 │                 │                 │
     │ Users           │                 │ Tasks           │
     │ Subjects        │                 │ Study Plans     │
     └─────────────────┘                 └─────────────────┘
                           │
                           ▼
                    ┌─────────────────┐
                    │     LLM API     │
                    │ AI Planning &   │
                    │ Explanations    │
                    └─────────────────┘

## 3. Responsibilities

### React
- Render UI.
- Handle user interaction.
- Maintain local state.
- Fetch backend APIs.
- Handle loading and errors.
- Route between pages.

### Express
- Authentication.
- Validation.
- REST APIs.
- Business logic.
- Database communication.
- LLM communication.
- Error handling.

### PostgreSQL
Stores relational data:
- Users
- Subjects

### MongoDB
Stores flexible data:
- Tasks
- Study plans

### LLM API
Provides:
- Personalized study plans
- Concept explanations

## 4. Data Ownership
A user's data must be isolated using user identity.
Every user-specific request should verify ownership before reading or modifying data.

## 5. Security Architecture
- Client does not receive LLM API key.
- Backend stores secrets in environment variables.
- JWT authenticates protected API requests.
- Passwords are hashed.
- Database credentials are never committed to Git.

## 6. Request Flow

### Normal CRUD
React → Express → Middleware → Controller → Database → Express → React

### AI Request
React → Express → Auth Middleware → AI Controller → LLM Service → LLM API → Validation → React

### Saved AI Plan
React → Express → Auth Middleware → Controller → MongoDB → React

## 7. Scalability Basics
For the MVP, one Express server and two databases are sufficient.

If usage grows:
- Add connection pooling.
- Add API rate limiting.
- Add caching where useful.
- Move AI calls to background jobs for long-running workloads.
- Add database indexes.
- Separate services only when actual scale requires it.

## 8. Failure Handling
Possible failures:
- Invalid input → 400
- Missing authentication → 401
- Unauthorized resource → 403
- Missing resource → 404
- LLM failure → controlled 5xx/appropriate upstream error
- Database failure → 500
- Network failure → frontend error state

## 9. Deployment Concept
Frontend:
- Static React build

Backend:
- Node.js/Express server

Databases:
- Managed PostgreSQL
- Managed MongoDB

Secrets:
- Environment variables provided by deployment platform

## 10. Design Principle
The architecture intentionally remains simple while clearly separating frontend, backend, relational data, document data, and external AI services.
