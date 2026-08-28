# Planora — Project Memory

## Project Identity
Name: Planora
Tagline: Your AI-Powered Study Planner

## Purpose
Planora is a student productivity application that combines normal study-task management with AI-powered planning and explanations.

## Core Stack
Frontend:
- React
- JavaScript
- React Router
- Fetch API

Backend:
- Node.js
- Express.js

Databases:
- PostgreSQL for relational user/subject data
- MongoDB for tasks and AI-generated study plans

AI:
- LLM API

Engineering:
- Git/GitHub
- Environment variables

## Architecture
React Frontend
→ Express REST API
→ PostgreSQL / MongoDB / LLM API

## PostgreSQL Responsibility
Use PostgreSQL for:
- Users
- Subjects
- User-subject relationships

Required concepts:
- Primary keys
- Foreign keys
- JOINs

## MongoDB Responsibility
Use MongoDB for:
- Tasks
- Study plans

Required concepts:
- Schema modeling
- CRUD

## AI Responsibility
The backend communicates with the LLM.
The frontend never contains the secret LLM API key.

AI features:
1. Study-plan generation
2. Concept explanation

## Required Learning Demonstrations
- async/await
- Promises
- callbacks
- closures
- event loop
- hoisting

## MVP Rule
Keep the project small and finishable. Avoid unnecessary features such as social feeds, payments, calendar synchronization, voice AI, and real-time collaboration.

## Important Principle
Every rubric topic should have a natural place in the project. Do not add complicated functionality only to demonstrate a concept.
