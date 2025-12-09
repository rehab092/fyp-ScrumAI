# ScrumAI Backend - Test Cases

## Test Case Format
| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|

---

## 1. AUTHENTICATION TESTS

### TC001: Product Owner Signup/Create with Valid Data

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC001 | Verify admin should be able to signup/create account with valid email and password | System should have no account registered with given email | 1. Click on Signup button 2. Enter valid name 3. Enter unique email 4. Enter password 5. Enter company name 6. Click Create Account | Email: abc@xyz.com, Password: Xyz123, Name: John Doe, Company: Tech Corp | System creates new ProductOwner account successfully and returns owner_id | New ProductOwner record created in database with email and password stored | System should create account and return owner_id | Pass |

---

### TC002: Product Owner Signup with Duplicate Email

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC002 | Verify system rejects signup when email already exists | A ProductOwner with email "existing@xyz.com" already exists | 1. Click on Signup button 2. Enter name 3. Enter duplicate email (existing@xyz.com) 4. Enter password 5. Enter company name 6. Click Create Account | Email: existing@xyz.com, Password: Test123, Name: Jane Doe, Company: Tech Solutions | System should reject the request with error "Email already exists" | No new record created, system displays error message | System should reject duplicate email | Pass |

---

### TC003: Product Owner Signup with Missing Required Fields

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC003 | Verify system validates all required fields during signup | Admin is on signup page | 1. Click on Signup button 2. Leave name field empty 3. Enter email 4. Enter password 5. Enter company name 6. Click Create Account | Email: test@xyz.com, Password: Test123, Name: (empty), Company: Tech Inc | System should display error "Name is required" and prevent account creation | Signup form remains open, no record created | System should validate required fields | Pass |

---

### TC004: Product Owner Login with Valid Credentials

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC004 | Verify admin should be able to login with valid email and password | Admin registered account exists with email: abc@xyz.com, password: Xyz123 | 1. Click on Login button 2. Enter email: abc@xyz.com 3. Enter password: Xyz123 4. Click Login button | Email: abc@xyz.com, Password: Xyz123 | System displays admin homepage, generates JWT token, Admin should be kept logged in until logout | Admin is logged in successfully with valid session/token | System should display homepage and generate JWT token | Pass |

---

### TC005: Product Owner Login with Invalid Email

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC005 | Verify system rejects login with non-existent email | No ProductOwner account exists with email "nonexistent@xyz.com" | 1. Click on Login button 2. Enter email: nonexistent@xyz.com 3. Enter password: Test123 4. Click Login button | Email: nonexistent@xyz.com, Password: Test123 | System displays error message "Invalid email or password" | Login page remains open, user not authenticated | System should reject invalid email | Pass |

---

### TC006: Product Owner Login with Invalid Password

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC006 | Verify system rejects login with incorrect password | Admin account exists with email: abc@xyz.com, correct password: Xyz123 | 1. Click on Login button 2. Enter email: abc@xyz.com 3. Enter incorrect password: WrongPass456 4. Click Login button | Email: abc@xyz.com, Password: WrongPass456 | System displays error "Invalid email or password" | Login page remains open, user not authenticated | System should reject invalid password | Pass |

---

### TC007: Product Owner Login with Missing Email

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC007 | Verify system validates email field on login | Admin is on login page | 1. Click on Login button 2. Leave email field empty 3. Enter password: Xyz123 4. Click Login button | Email: (empty), Password: Xyz123 | System displays error "Email and password are required" | Login form remains open, no login attempt made | System should validate required fields | Pass |

---

## 2. PROJECT MANAGEMENT TESTS

### TC008: Create Project with Valid Data

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC008 | Verify admin can create a new project with valid details | Admin is logged in, ProductOwner with id=1 exists | 1. Navigate to Projects section 2. Click "Create New Project" 3. Enter project name: "Federal Spending Tracker" 4. Enter description: "Track government spending data" 5. Click Create button | owner_id: 1, Project Name: Federal Spending Tracker, Description: Track government spending data | System creates new Project record and displays success message with project_id | New Project created in database linked to ProductOwner, project_id returned | System should create project successfully | Pass |

---

### TC009: Create Project with Missing Required Fields

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC009 | Verify system validates required fields when creating project | Admin is logged in | 1. Navigate to Projects section 2. Click "Create New Project" 3. Leave project name empty 4. Enter description: "Test project" 5. Click Create button | owner_id: 1, Project Name: (empty), Description: Test project | System displays error "owner_id and name are required" | Project creation form remains open, no project created | System should validate required project fields | Pass |

---

### TC010: Retrieve All Projects for a Specific Owner

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC010 | Verify admin can retrieve all projects belonging to their account | ProductOwner with id=1 exists with 3 projects created | 1. Navigate to Projects section 2. Click "View My Projects" 3. System fetches projects for owner_id=1 | owner_id: 1 | System returns JSON array with all 3 projects containing id, name, description, owner_id fields | Projects list displayed on screen with all details | System should return all owner projects | Pass |

---

## 3. USER STORY TESTS

### TC011: Create User Story with Valid Data

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC011 | Verify admin can create a user story with all required details | ProductOwner id=1 exists, Project id=1 exists | 1. Navigate to Project 2. Click "Add User Story" 3. Enter role: "Product Manager" 4. Enter goal: "Track spending anomalies" 5. Enter benefit: "Identify budget issues" 6. Enter priority: "High" 7. Click Create | owner_id: 1, project_id: 1, role: Product Manager, goal: Track spending anomalies, benefit: Identify budget issues, priority: High | System creates UserStory record with all details and returns success message | UserStory created in database linked to Project and ProductOwner | System should create user story | Pass |

---

### TC012: Upload Multiple User Stories with LLM Decomposition

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC012 | Verify system can process multiple user stories, extract priority, and decompose into tasks via LLM | ProductOwner id=1 exists, Project id=1 exists, OpenAI API key configured | 1. Navigate to Project 2. Click "Upload User Stories" 3. Enter role: "Developer" 4. Enter goal: "Build API" 5. Enter benefit: "Enable integration" 6. Paste multiple stories in textarea (one per line) with priority format: "story text | Priority" 7. Click Process | Stories: "Create user authentication endpoint | High", "Build database migration scripts | Medium", "Write API documentation | Low" | System calls LLM for each story block, extracts priority, creates UserStory records, decomposes into tasks, and displays tasks_created count | Multiple UserStory and Backlog records created in database, each with extracted priority and decomposed tasks | System should process stories and create tasks | Pass |

---

### TC013: Update User Story Details

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC013 | Verify admin can update user story role, goal, benefit, and priority | UserStory with id=5 exists with role: "QA Engineer", goal: "Test API", benefit: "Quality assurance" | 1. Navigate to User Stories 2. Click Edit on story id=5 3. Change role to "Product Manager" 4. Change goal to "Review requirements" 5. Change priority from "Medium" to "High" 6. Click Save | user_story_id: 5, role: Product Manager, goal: Review requirements, priority: High | System updates UserStory record with new values and displays success message | UserStory with id=5 updated in database with new values | System should update user story | Pass |

---

### TC014: Delete User Story

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC014 | Verify admin can delete a user story and associated tasks | UserStory with id=5 exists with 3 associated Backlog tasks | 1. Navigate to User Stories 2. Click Delete on story id=5 3. Confirm deletion in popup | user_story_id: 5 | System deletes UserStory and cascades delete to all associated Backlog records, displays success message | UserStory and all related Backlog records removed from database | System should delete user story and cascade | Pass |

---

### TC015: Retrieve All User Stories

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC015 | Verify admin can retrieve all user stories with full details | 5 UserStory records exist in database | 1. Navigate to User Stories section 2. Click "View All Stories" | None | System returns JSON array with all UserStory records containing id, owner_id, role, goal, benefit, priority, project_name, project_id | List displays all 5 user stories with complete information | System should return all user stories | Pass |

---

## 4. TASK & BACKLOG TESTS

### TC016: Get All Tasks from Backlog

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC016 | Verify admin can retrieve all tasks from all user stories | 3 UserStories exist with total 10 Backlog tasks | 1. Navigate to Tasks section 2. Click "View All Tasks" | None | System returns JSON array with all Backlog records containing task_id, project_id, user_story_id, tasks, subtasks | All 10 tasks displayed with complete details | System should return all backlog tasks | Pass |

---

### TC017: Get Tasks for Specific User Story

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC017 | Verify admin can retrieve tasks belonging to a specific user story | UserStory with id=3 exists with 5 Backlog tasks | 1. Navigate to User Story Details 2. Click View Tasks for story id=3 | user_story_id: 3 | System returns JSON with user_story_id and array of 5 tasks containing task details | Task list shows all 5 tasks for the story | System should return story-specific tasks | Pass |

---

### TC018: Update Task Details

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC018 | Verify admin can update task description and subtasks | Backlog record with task_id=7 exists with tasks: "Setup database", subtasks: "Create schema, Add indexes" | 1. Navigate to Tasks 2. Click Edit on task_id=7 3. Change tasks to: "Configure database connection" 4. Change subtasks to: "Set credentials, Test connection, Handle errors" 5. Click Save | task_id: 7, tasks: Configure database connection, subtasks: Set credentials, Test connection, Handle errors | System updates Backlog record with new task and subtask values, displays success message | Backlog record updated in database with new values | System should update task | Pass |

---

### TC019: Delete Task from Backlog

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC019 | Verify admin can delete a specific task from backlog | Backlog record with task_id=7 exists | 1. Navigate to Tasks 2. Click Delete on task_id=7 3. Confirm deletion | task_id: 7 | System deletes Backlog record from database, displays success message | Backlog record with task_id=7 removed from database | System should delete task | Pass |

---

### TC020: Verify Task ID Auto-Increment

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC020 | Verify system auto-increments task_id for new tasks | 5 Backlog records exist with task_id values 1-5 | 1. Create new UserStory 2. Upload/create new Backlog task 3. Check auto-assigned task_id | UserStory with new tasks | New task should be assigned task_id=6 automatically | Backlog table has sequential task_id values | System should auto-increment task IDs | Pass |

---

## 5. ADVANCED FEATURE TESTS

### TC021: LLM Story Decomposition with Priority Extraction

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC021 | Verify system correctly extracts priority from story line format and decomposes into tasks | OpenAI API configured, ProductOwner and Project exist | 1. Upload story: "Build user authentication with JWT tokens and OAuth | High" 2. System parses priority as "High" 3. System calls LLM to decompose story 4. LLM returns tasks with priority field | Story: "Build user authentication with JWT tokens and OAuth | High" | System extracts priority="High", creates UserStory with priority field, receives LLM decomposition with multiple numbered tasks | UserStory.priority="High", Backlog records created with task format "seq.idx task_description" | System should extract priority and decompose | Pass |

---

### TC022: Error Handling - Invalid Project ID

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC022 | Verify system handles invalid project_id gracefully | ProductOwner id=1 exists, Project id=999 does NOT exist | 1. Try to create user story with owner_id=1, project_id=999 2. Submit request | owner_id: 1, project_id: 999 | System returns error response with status 404 and message "Invalid project ID" | No UserStory created, user receives error notification | System should return 404 error | Pass |

---

### TC023: Error Handling - Invalid Owner ID

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC023 | Verify system handles invalid owner_id gracefully | ProductOwner id=999 does NOT exist | 1. Try to create user story with owner_id=999, project_id=1 2. Submit request | owner_id: 999, project_id: 1 | System returns error response with status 404 and message "Invalid owner ID" | No UserStory created, user receives error notification | System should return 404 error | Pass |

---

### TC024: JWT Token Generation on Login

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC024 | Verify system generates valid JWT token on successful login | ProductOwner with email: test@company.com, password: SecurePass123 exists | 1. Submit login request with valid credentials 2. System authenticates user 3. System generates JWT token | email: test@company.com, password: SecurePass123 | Response includes JWT token with email claim and 24-hour expiration | User receives token that can be used for authenticated requests | System should generate JWT token | Pass |

---

### TC025: Retrieve ProductOwner by Email

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC025 | Verify admin can retrieve ProductOwner details by email query | ProductOwner with email "manager@company.com" exists | 1. Send GET request with email query parameter 2. URL: /userstorymanager/owner_by_email/?email=manager@company.com | email: manager@company.com | System returns JSON with ProductOwner id, name, email, company_name, created_at (ISO format) | User receives owner details in JSON response | System should return owner by email | Pass |

---

## 6. DATA VALIDATION & EDGE CASES

### TC026: Validate Email Format

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC026 | Verify system validates email format during signup | System is on signup page | 1. Enter invalid email: "notanemail" 2. Enter password and other fields 3. Submit | Email: notanemail, Password: Test123 | System displays error "Invalid email format" and prevents account creation | Signup form remains open with error displayed | System should validate email format | Pass |

---

### TC027: Verify Unique Email Constraint

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC027 | Verify database enforces email uniqueness | ProductOwner with email "unique@company.com" exists | 1. Attempt to create second ProductOwner with same email 2. Submit request | Email: unique@company.com (duplicate) | System returns error: "Email already exists" | No duplicate record created, database integrity maintained | System should reject duplicate email | Pass |

---

### TC028: Verify Story Text Deduplication

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC028 | Verify system removes duplicate user stories from input | Admin uploads stories with duplicates | Story 1: "Build login page | High", Story 1 (duplicate): "Build login page | High", Story 2: "Build dashboard | Medium" | System processes 2 unique stories, deduplicates the input, ignores second occurrence of Story 1 | Only 2 UserStory records created in database, duplicates removed | System should deduplicate stories | Pass |

---

### TC029: Handle Empty Story Upload

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC029 | Verify system rejects empty story input | Admin on story upload page | 1. Leave story textarea empty 2. Fill in other required fields (role, goal, benefit) 3. Submit | stories_text: (empty), role: Developer, goal: Build API, benefit: Enable integration | System returns error "stories_text is required (one story per line)" | Upload form remains open, no records created | System should require story text | Pass |

---

### TC030: Verify JSON Response Format for All Endpoints

| Test Case ID | Test Objective | Precondition | Steps | Test Data | Expected Result | Post-condition | Actual Result | Pass/Fail |
|---|---|---|---|---|---|---|---|---|
| TC030 | Verify all API endpoints return valid JSON format | Any API endpoint is called | 1. Call any GET/POST/PUT/DELETE endpoint 2. Check response format 3. Attempt to parse as JSON | Any valid request | Response contains valid JSON with appropriate fields (message, error, or data fields) | Response can be parsed as valid JSON by client applications | All endpoints should return JSON | Pass |

---

## Summary Statistics
- **Total Test Cases**: 30
- **Authentication Tests**: 7 (TC001-TC007)
- **Project Management Tests**: 3 (TC008-TC010)
- **User Story Tests**: 5 (TC011-TC015)
- **Task & Backlog Tests**: 5 (TC016-TC020)
- **Advanced Feature Tests**: 5 (TC021-TC025)
- **Data Validation & Edge Cases**: 5 (TC026-TC030)

---

## Test Execution Notes

### Prerequisites for Test Execution:
1. Django development server running on localhost:8000
2. PostgreSQL database configured and migrations applied
3. OpenAI API key configured in .env file for story decomposition tests
4. JWT secret key configured in settings.py

### Test Data Setup:
- Create at least 2 test ProductOwner accounts for signup/login tests
- Create at least 2 test Projects linked to ProductOwner
- Create sample UserStory records for CRUD tests
- Create sample Backlog/Task records for task management tests

### Expected API Response Codes:
- `200 OK`: Successful GET, PUT operations
- `201 Created`: Successful POST operations (e.g., project creation)
- `400 Bad Request`: Invalid input data, missing required fields
- `401 Unauthorized`: Invalid credentials
- `404 Not Found`: Resource not found (invalid ID)
- `405 Method Not Allowed`: Wrong HTTP method used
- `500 Internal Server Error`: Server-side errors (e.g., LLM API failure)
