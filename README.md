📌 ScrumAI

ScrumAI is a project designed to assist in task management, dependency mapping, and workflow optimization for agile teams. The system includes both a frontend (UI) and backend (API/logic).

🚀 Project Structure
```bash
fyp-ScrumAI/
│
├── scrumai-frontend/   # React frontend
├── backend/            # Backend services (API, logic)
├── .gitignore
```
⚙️ Setup Instructions
🔹 1. Clone Repository
```bash
git clone https://github.com/rehab092/fyp-ScrumAI.git
cd fyp-ScrumAI
```
🔹 2. Fetch All Branches
```bash
git fetch --all
```
🔹 3. Checkout Branches
Frontend:
```bash
git checkout frontend
```
Backend:
```bash
git checkout backend
```
👨‍💻 Development Workflow
🔹 Create Feature Branch

Always create a new branch from the latest base:

Frontend:
```bash
git checkout frontend
git pull origin frontend
git checkout -b feature-name-frontend
```
Backend:
```bash
git checkout backend
git pull origin backend
git checkout -b feature-name-backend
```
🔹 Make Changes & Commit
```bash
git add .
git commit -m "describe your feature"
```
🔹 Push Branch
```bash
git push origin feature-name
```
🔹 Merge Workflow
Option 1: Using Git (Local Merge)
```bash
git checkout frontend
git pull origin frontend
git merge feature-name-frontend
git push origin frontend
```
(Same for backend)

Option 2: Pull Request (Recommended)
Push your branch
Go to GitHub
Create Pull Request → merge into frontend or backend
🔄 Best Practices
✅ One feature = one branch
✅ Keep branches small and focused
✅ Always git pull before starting work
✅ Use clear commit messages
❌ Do NOT work directly on frontend or backend
❌ Do NOT mix frontend and backend changes in one branch
🖥️ Running the Project
🔹 Frontend (React)
```bash
cd scrumai-frontend
npm install
npm start
```
🔹 Backend

```python
cd module1
# create virtual environment (recommended)
python -m venv venv

# activate it
# Windows:
venv\Scripts\activate

# Mac/Linux:
source venv/bin/activate

# install dependencies
pip install -r requirements.txt

# run migrations
python manage.py migrate

# start server
python manage.py runserver
```
