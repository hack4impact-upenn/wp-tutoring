# West Philadelphia Tutoring Project (WPTP)

This repo contains the **frontend** (Vite + React) and **backend** (FastAPI + MongoDB) for the West Philadelphia Tutoring Project.

## Project structure

```
wp-tutoring/
├── frontend/          # Vite + React app (TypeScript)
│   ├── app/
│   ├── lib/
│   └── ...
├── backend/           # FastAPI API
│   ├── main.py        # API entrypoint
│   ├── tutoring/      # Mongo connection/helpers + matching logic
│   └── requirements.txt
└── README.md
```

## Prerequisites

- **Node.js** (v18+) and **npm** — for the frontend  
- **Python** (3.10+) — for the backend  

---

## Backend (FastAPI + MongoDB)

The backend serves the API (tutors, tutees, admin login). Default port is **8000**.

### 1. Go to the backend directory

```bash
cd backend
```

### 2. Create a virtual environment

```bash
python3 -m venv .venv
```

### 3. Activate the virtual environment

- **macOS/Linux:** `source .venv/bin/activate`
- **Windows:** `.venv\Scripts\activate`

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Start the development server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

By default the API is at **http://127.0.0.1:8000**. To use another port (e.g. if 8000 is in use):

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Then the API base URL is **http://127.0.0.1:8001**.

---

## Frontend (Vite + React)

The frontend runs at **http://localhost:3000** and talks to the backend API for tutor/student applications and matching.

### 1. Go to the frontend directory

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

### From the project root

You can also run the frontend from the repo root:

```bash
npm run dev
# or
npm run dev:frontend
```

---

## Running both together

1. **Terminal 1 — Backend**

   ```bash
   cd backend
   source .venv/bin/activate   # or .venv\Scripts\activate on Windows
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Terminal 2 — Frontend**

   ```bash
   cd frontend
   npm run dev
   ```

Then use:

- **Frontend:** http://localhost:3000  
- **Backend API:** http://127.0.0.1:8000 (or the port you chose)

**Connecting frontend to backend**

The frontend expects the backend at **http://127.0.0.1:8000** by default. To point it at a different URL, create **`frontend/.env`**:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## Summary

| Part     | Directory  | Install              | Run                          |
|----------|------------|----------------------|------------------------------|
| Backend  | `backend/` | `pip install -r requirements.txt` | `uvicorn main:app --host 0.0.0.0 --port 8000 --reload` |
| Frontend | `frontend/`| `npm install`        | `npm run dev`                 |

Ensure the backend is running before submitting tutor or tutee applications from the frontend, so data is saved to MongoDB.
