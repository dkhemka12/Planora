# Planora — Development Rules

## 1. General
- Keep the application simple.
- Prefer readable code over clever code.
- Do not add features outside the MVP without a clear reason.
- Follow consistent naming conventions.

## 2. Frontend Rules
- Use functional React components.
- Use useState for local state.
- Use useEffect for side effects/API fetching.
- Keep components small and reusable.
- Do not put all application logic in one component.
- Handle loading, error, success, and empty states.
- Use React Router for page navigation.

## 3. Backend Rules
- Follow RESTful endpoint conventions.
- Keep routes, controllers, middleware, and models separated.
- Validate incoming data.
- Use async/await for asynchronous backend operations.
- Never expose internal errors directly to clients.
- Use centralized error handling.

## 4. HTTP Rules
Use:
- 200 for successful reads/updates
- 201 for successful creation
- 400 for invalid requests
- 401 for missing/invalid authentication
- 403 for forbidden access
- 404 for missing resources
- 500 for unexpected server errors

## 5. Security Rules
- Never hard-code API keys.
- Store secrets in .env.
- Add .env to .gitignore.
- Never commit passwords, JWT secrets, database credentials, or LLM keys.
- Hash passwords before storing them.
- Protect user-specific endpoints.

## 6. AI Rules
- LLM calls must go through the backend.
- Prompts should clearly define the AI's role and required output.
- Prefer structured JSON output for application data.
- Validate AI output before using it.
- Handle invalid or failed AI responses.
- Do not trust AI output blindly.

## 7. Database Rules
- PostgreSQL owns relational user/subject data.
- MongoDB owns flexible task/study-plan data.
- Keep database responsibilities clear.
- Use PK/FK correctly in PostgreSQL.
- Use JOINs where relational data is combined.
- Validate IDs and ownership before modifying data.

## 8. Git Rules
- Use feature branches.
- Keep commits focused.
- Write meaningful commit messages.
- Do not commit .env.
- Pull/rebase or merge carefully before pushing.
- Keep main stable.

## 9. JavaScript Rules
The project should use modern JavaScript.
- Prefer const/let over var.
- Use async/await for new asynchronous code.
- Understand Promise behavior.
- Document educational examples of closures, event loop, hoisting, and callbacks.

## 10. Error Handling
Every API call should have a predictable failure path.
Frontend:
- Show user-friendly error messages.

Backend:
- Log useful technical details.
- Return safe JSON responses.

## 11. Scope Control
If a feature is not required for the MVP or rubric, postpone it.
