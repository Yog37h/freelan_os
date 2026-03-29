# AI Timeline Feature — Smoke Test Guide

## Prerequisites
- Supabase project running with all migrations applied
- `OPENROUTER_API_KEY` set in `.env.local`
- User account created and logged in

## Test Steps

### 1. Create a New Project
1. Navigate to `/projects/new`
2. Fill in Step 1 (Details):
   - Project title, client info, dates, cost
   - Set start date and deadline (at least 2 weeks apart)
   - Set buffer days (e.g., 3)
   - Set revisions (e.g., 2)
3. Click "Continue"

### 2. Configure PRD & Update Mode (Step 2)
1. Write a meaningful PRD in the textarea:
   ```
   ### Goals
   - Build a mobile-responsive landing page
   - Integrate contact form with email notifications
   
   ### Deliverables
   - Homepage design
   - About page
   - Contact form with validation
   - SEO optimization
   
   ### Acceptance Criteria
   - Page loads under 2 seconds
   - All forms validated client and server side
   ```
2. Add freelancer context (optional)
3. Select **Update Frequency**:
   - "Milestone-based" OR "Weekly-based"
4. Click "Continue to Timeline"

### 3. Generate AI Timeline (Step 3)
1. Verify project summary shows correct info
2. Click **"Generate AI Timeline"**
3. Wait for AI generation (10-30 seconds)
4. Verify:
   - [ ] Timeline buckets appear (milestones or weeks)
   - [ ] Each bucket shows title, date range, and badge counts
   - [ ] "AI GENERATED" badge appears

### 4. Edit Timeline Preview
1. Click on a bucket to expand it
2. Verify expandable sections:
   - [ ] Deliverables list with acceptance criteria
   - [ ] Tasks list with due dates
   - [ ] Risks & Assumptions (collapsed section)
3. Test editing:
   - [ ] Click bucket title → inline edit → Enter to save
   - [ ] Click date range → date pickers appear → Save
   - [ ] Click deliverable title → inline edit
   - [ ] Click "Add" on deliverables → add new one
   - [ ] Click trash icon → remove deliverable
   - [ ] Same for tasks

### 5. Reorder Buckets
1. Drag a bucket to a new position
2. Verify reorder confirmation bar appears
3. Toggle "Auto-shift dates" checkbox
4. Click "Save Order"

### 6. Confirm Timeline
1. Click **"Confirm Timeline"**
2. Verify modal appears with:
   - [ ] Bucket count
   - [ ] Task count
   - [ ] Calendar icon
3. Click **"Confirm & Save"**
4. Verify redirect to `/projects/[projectId]?tab=timeline`

### 7. Verify Persisted Timeline
1. On the project detail page, Timeline tab should load
2. Verify:
   - [ ] All buckets from preview are shown
   - [ ] Deliverables and tasks are intact
   - [ ] Expanding works
   - [ ] Edits via timeline tab call API (check Network tab)

### 8. Edit After Confirm
1. Click a bucket title → edit inline → Enter
2. Add a new task to a bucket
3. Add a new deliverable
4. Verify changes persist on page reload

### 9. Reorder After Confirm
1. Drag-drop a bucket
2. Choose "Auto-shift dates"
3. Click "Save Order"
4. Reload page → verify new order persists

### 10. Error Scenarios
1. Try generating without project: should show warning
2. Set rate limit: generate 5+ times → should get rate limit error
3. Test with empty PRD: should fail validation

## Database Verification
After confirming a timeline, check these tables:
- `project_plans` — should have a row with `status='final'`
- `plan_buckets` — should have rows for each milestone/week
- `plan_deliverables` — nested under buckets
- `plan_tasks` — nested under buckets
- `plan_notes` — risks and assumptions
- `message_templates` — template rows
- `calendar_queue` — entries for upcoming tasks

## API Endpoints Summary
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/projects/[id]/plan/generate` | Generate AI timeline |
| POST | `/api/projects/[id]/plan/confirm` | Confirm and persist |
| GET | `/api/projects/[id]/plan/timeline` | Read persisted timeline |
| PATCH | `/api/projects/[id]/plan/timeline` | Reorder buckets |
| PATCH | `/api/projects/[id]/plan/bucket/[id]` | Edit bucket |
| POST | `/api/projects/[id]/plan/bucket/[id]/deliverables` | Add deliverable |
| POST | `/api/projects/[id]/plan/bucket/[id]/tasks` | Add task |
| PATCH | `/api/projects/[id]/plan/deliverable/[id]` | Edit deliverable |
| DELETE | `/api/projects/[id]/plan/deliverable/[id]` | Delete deliverable |
| PATCH | `/api/projects/[id]/plan/task/[id]` | Edit task |
| DELETE | `/api/projects/[id]/plan/task/[id]` | Delete task |
