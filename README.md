# Hotel Factories

Hotel Factories is organized as two independent applications:

- `frontend/` — Next.js customer, hotelier, and admin interface
- `backend/` — Express API, booking, inventory, payment, and payout services

## Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000` and uses
`NEXT_PUBLIC_API_URL` when configured. Its local default API is
`http://localhost:5050/api/v1`.

## Backend

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```

The backend runs at `http://localhost:5050` by default. Configure a non-empty
`JWT_SECRET` and the other required values in `backend/.env` before starting it.

