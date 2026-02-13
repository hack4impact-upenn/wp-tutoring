Running cpt code:
1. cd into project folder (where you have the py file)
2. python3 -m venv .venv
3. source .venv/bin/activate
4. pip install ortools (only need to install once your env will save it)
5. python3 cpt-solver.py



# West Philadelphia Tutoring Project

Website and matching system to match ~250 tutors with students each semester.

## Structure

- **backend/** — Django API (Python, SQLite). Port 3001.
- **frontend/** — React app (Vite). Port 3000. Proxies `/api` to the backend in development.

## Quick start

1. **Backend (Python/Django)**  
   Create a virtualenv (recommended), then:

   ```bash
   cd backend
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver 3001
   ```

2. **Frontend** (in another terminal):

   ```bash
   cd frontend
   npm install
   npm start
   ```

3. Open **http://localhost:3000** in your browser.

- **Tutor application:** http://localhost:3000/apply/tutor  
- **Student application:** http://localhost:3000/apply/student  
- **Admin (roster & matching):** http://localhost:3000/admin  

The backend creates the SQLite database at `backend/data/tutoring.db` on first run (after `migrate`).

## Features

- **Tutor form:** contact info, availability, subjects (Algebra, Geometry, Calculus BC, etc.), grade levels, previous students, preferences.
- **Student form:** contact info, grade level, subjects needed, sibling IDs, previous tutor, availability.
- **Matching algorithm:** prioritizes (1) previous semester pairs, (2) siblings in same section, (3) subject/level fit.
- **Admin:** view roster, run matching, manually override assignments.

## Rerunning matches

In Admin, click **Run matching**. You can then use **Manual override** to adjust any assignment.
