# West Philadelphia Tutoring Project

Website and matching system to match ~250 tutors with students each semester.

## Structure

- **backend/** — Express API (Node.js, SQLite). Port 3001.
- **frontend/** — React app (Vite). Port 3000. Proxies `/api` to the backend in development.

## Quick start

1. Install dependencies (root + backend + frontend):

   ```bash
   npm run install:all
   ```

   Or manually:

   ```bash
   npm install
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. Start the backend (in one terminal):

   ```bash
   npm run start:backend
   ```

3. Start the frontend (in another terminal):

   ```bash
   npm run start:frontend
   ```

4. Open **http://localhost:3000** in your browser.

- **Tutor application:** http://localhost:3000/apply/tutor  
- **Student application:** http://localhost:3000/apply/student  
- **Admin (roster & matching):** http://localhost:3000/admin  

The backend creates the SQLite database at `backend/data/tutoring.db` on first run.

## Features

- **Tutor form:** contact info, availability, subjects (Algebra, Geometry, Calculus BC, etc.), grade levels, previous students, preferences.
- **Student form:** contact info, grade level, subjects needed, sibling IDs, previous tutor, availability.
- **Matching algorithm:** prioritizes (1) previous semester pairs, (2) siblings in same section, (3) subject/level fit.
- **Admin:** view roster, run matching, manually override assignments.

## Rerunning matches

In Admin, click **Run matching**. You can then use **Manual override** to adjust any assignment.
