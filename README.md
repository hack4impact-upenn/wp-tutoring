# West Philadelphia Tutoring Project (WPTP)

Web app for the West Philadelphia Tutoring Project: families and tutors apply online, and admins review applications, run matching, and manage pairings. The UI is **React (Vite)**; the API is **FastAPI** with **MongoDB**.

## Start developing

You need **Node.js**, **Python 3.10+**, and a **MongoDB** URI.

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create **`backend/.env`** with at least:

```env
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<a-long-random-secret>
```

Then:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

API: http://127.0.0.1:8000 — docs at http://127.0.0.1:8000/docs

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000

By default the UI talks to the API at `http://127.0.0.1:8000`. If you use another port, add **`frontend/.env`**:

```env
VITE_API_BASE_URL=http://127.0.0.1:<port>
```

### From the repo root

```bash
npm install
npm run dev              # frontend only
```

Run the backend from `backend/` as above (or use `npm run dev:backend` if your local `venv` path matches `package.json`).
