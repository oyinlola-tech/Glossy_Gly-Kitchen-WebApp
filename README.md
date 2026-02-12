# Glossy-Gly-Kitchen Web App

A full-stack food ordering platform with customer and admin portals.

## Author
- **Oluwayemi Oyinlola**
- Portfolio: **https://oyinlola.site**

## Project Structure
- `src/` - Frontend (React + Vite)
- `backend/` - Backend API (Node.js + Express + MySQL)
- `scripts/` - Utility/dev orchestration scripts

## Quick Start

### 1. Install dependencies
```bash
npm install
cd backend && npm install
```

### 2. Configure environment
- Frontend: create `.env` at project root
```env
VITE_API_URL=http://localhost:3000
```
- Backend: create `backend/.env` with DB, JWT, SMTP, and any payment keys.

### 3. Run both frontend + backend together
From project root:
```bash
npm run dev
```

This starts:
- Frontend (Vite) at your configured dev port
- Backend (nodemon) from `backend/`

## Useful Commands
- `npm run dev` - Run frontend + backend together
- `npm run dev:frontend` - Run only frontend
- `npm run dev:backend` - Run only backend
- `npm start` - Run frontend via Vite
- `npm run build` - Build frontend production bundle

## Documentation
- Frontend details: `src/README.md`
- Backend details: `backend/README.md`
- Backend API reference: `backend/API.md`

## License
This project is licensed under the terms in the root `LICENSE` file.
