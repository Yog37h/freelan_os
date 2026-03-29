# API Smoke Tests
Use these `curl` examples to verify each backend endpoint manually.
Replace `$TOKEN` with a valid Supabase JWT (copy from browser DevTools → Application → Local Storage → `sb-*-auth-token`).
Replace `$BASE` with your dev base URL (e.g., `http://localhost:3000`).
Replace `$PROJECT_ID` with a real project UUID from your database.

---

## Projects

### List projects (paginated)
```bash
curl -s "$BASE/api/projects" \
  -H "Cookie: sb-access-token=$TOKEN" | jq .
```

### List with filter
```bash
curl -s "$BASE/api/projects?status=Active&q=website" \
  -H "Cookie: sb-access-token=$TOKEN" | jq .
```

### Create project
```bash
curl -s -X POST "$BASE/api/projects" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Smoke Test Project",
    "clientId": "<client-uuid>",
    "startDate": "2026-02-01",
    "deadline": "2026-06-01",
    "type": "Fixed",
    "cost": 50000
  }' | jq .
```

---

## Overview

### Get overview
```bash
curl -s "$BASE/api/projects/$PROJECT_ID/overview" \
  -H "Cookie: sb-access-token=$TOKEN" | jq .
```

### Update overview (PATCH)
```bash
curl -s -X PATCH "$BASE/api/projects/$PROJECT_ID/overview" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"progressPercent": 45, "clientMood": "Healthy"}' | jq .
```

### IDOR check — should return 404 for another user's project
```bash
curl -s "$BASE/api/projects/<other-user-project-id>/overview" \
  -H "Cookie: sb-access-token=$TOKEN" | jq .
# Expected: { "data": null, "error": { "message": "Project not found" } }
```

---

## Timeline

### Get milestones + tasks
```bash
curl -s "$BASE/api/projects/$PROJECT_ID/timeline" \
  -H "Cookie: sb-access-token=$TOKEN" | jq .
```

### Add a milestone
```bash
curl -s -X POST "$BASE/api/projects/$PROJECT_ID/timeline" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"milestone","name":"Design Phase","dueDate":"2026-03-15"}' | jq .
```

### Update task status
```bash
curl -s -X PATCH "$BASE/api/projects/$PROJECT_ID/timeline/<task-id>" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress"}' | jq .
```

---

## Updates

### Get updates
```bash
curl -s "$BASE/api/projects/$PROJECT_ID/updates" \
  -H "Cookie: sb-access-token=$TOKEN" | jq .
```

### Post an update
```bash
curl -s -X POST "$BASE/api/projects/$PROJECT_ID/updates" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"weekly","summary":"Week 1 complete. Homepage design delivered.","channel":"WhatsApp"}' | jq .
```

---

## Files

### Get file metadata
```bash
curl -s "$BASE/api/projects/$PROJECT_ID/files" \
  -H "Cookie: sb-access-token=$TOKEN" | jq .
```

### Add file metadata
```bash
curl -s -X POST "$BASE/api/projects/$PROJECT_ID/files" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"homepage.fig","type":"FIGMA","size":"14MB"}' | jq .
```

---

## Scope

### Get scope items
```bash
curl -s "$BASE/api/projects/$PROJECT_ID/scope" \
  -H "Cookie: sb-access-token=$TOKEN" | jq .
```

### Add scope item
```bash
curl -s -X POST "$BASE/api/projects/$PROJECT_ID/scope" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"inclusion","label":"Responsive mobile design","note":"All breakpoints <= 768px"}' | jq .
```

---

## Closure

### Get closure state
```bash
curl -s "$BASE/api/projects/$PROJECT_ID/closure" \
  -H "Cookie: sb-access-token=$TOKEN" | jq .
```

### Save checklist state
```bash
curl -s -X POST "$BASE/api/projects/$PROJECT_ID/closure" \
  -H "Cookie: sb-access-token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"checklist_state":{"deliverables":true,"payment":true,"feedback":false,"archive":false}}' | jq .
```

### Close project (all checks must be true)
```bash
curl -s -X POST "$BASE/api/projects/$PROJECT_ID/closure/close" \
  -H "Cookie: sb-access-token=$TOKEN" | jq .
```

---

## Auth guard checks

### Unauthenticated request — should return 401
```bash
curl -s "$BASE/api/projects" | jq .
# Expected: { "data": null, "error": { "message": "Unauthorized" } }
```
