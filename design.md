# Planora — Design Document

## 1. Design Goal
Create a clean, beginner-friendly productivity interface with a strong focus on tasks, progress, and AI assistance.

## 2. Main Navigation
- Dashboard
- Subjects
- Tasks
- AI Planner
- Saved Plans
- Profile/Logout

## 3. Visual Style
- Minimal dashboard
- Card-based layout
- Clear typography
- Consistent spacing
- Simple forms
- Clear success/error/loading states
- Responsive layout

## 4. Dashboard
The dashboard contains:
1. Welcome section
2. Progress/stat cards
3. Recent tasks
4. Upcoming tasks
5. Quick action for AI Study Planner

Example:
- Subjects: 5
- Total Tasks: 24
- Completed: 15
- Progress: 62%

## 5. Task UI
Each task card shows:
- Title
- Subject
- Priority
- Due date
- Status
- Complete button
- Edit button
- Delete button

## 6. AI Planner UI
Step 1: Enter study information.
Step 2: Click Generate Study Plan.
Step 3: Show loading state.
Step 4: Display generated plan by day.
Step 5: Allow saving the plan.

## 7. AI Explanation UI
- Topic input
- Difficulty selector
- Explain button
- Loading state
- Formatted explanation result

## 8. Component Composition
App
- Navbar
- Sidebar
- Dashboard
  - StatsCard
  - ProgressCard
  - TaskList
  - TaskCard
- Subjects
  - SubjectForm
  - SubjectCard
- Tasks
  - TaskForm
  - TaskList
  - TaskCard
- AIPlanner
  - PlannerForm
  - StudyPlan
  - DayCard

## 9. UX States
Every API-driven feature should handle:
- Loading
- Success
- Empty state
- Error state

## 10. Accessibility
- Labels for inputs
- Keyboard-friendly controls
- Buttons with meaningful text
- Adequate contrast
- Clear error messages
