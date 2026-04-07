# Shako Kabob — Point of Sale System

**Live Demo:** [pos.papatenko.org](https://pos.papatenko.org)

---

## Overview

Shako Kabob is a full-stack Point of Sale (POS) system built for a food truck operation. It supports both customer-facing online ordering and employee-facing POS, inventory, and management features.

---

## Tech Stack

### Frontend

- **Vite** — Build tool and dev server
- **React 19** — UI framework
- **TanStack Router** — Client-side routing
- **Tailwind CSS v4** — Styling with shadcn/ui components
- **Recharts** — Sales charts and reporting visualizations
- **React Hook Form + Zod** — Form validation

### Backend

- **Node.js (ES Modules)** — API server runtime
- **MySQL 2** — Database driver with connection pooling
- **bcrypt** — Password hashing
- **JSON Web Tokens** — Session/auth management

### Infrastructure

- **Turbo** — Monorepo task runner
- **Docker** — Containerized deployment
- **GitHub Actions + Coolify** — CI/CD and deployment automation

---

## Project Structure

```
.
├── backend/               # Node.js API server
│   └── src/
│       ├── server.js      # HTTP server entry point
│       ├── routes.js      # Route definitions and handler mapping
│       ├── database.js    # MySQL connection pool
│       ├── auth/          # JWT login/register logic
│       ├── models/        # Report data models
│       ├── services/      # Business logic (users, orders, inventory, etc.)
│       ├── utils/         # Router helper
│       └── .env           # Environment variables (see below)
│
├── frontend/              # React SPA
│   ├── src/
│   │   ├── routes/       # Page components (auth, customer, employee)
│   │   ├── components/   # UI components (ui/, order/, layout/)
│   │   ├── services/     # API client functions
│   │   ├── redux/        # State management slices
│   │   ├── hooks/        # Custom React hooks
│   │   ├── constants/    # Lookup data (genders, units, etc.)
│   │   └── index.css     # Tailwind + base styles
│   ├── dist/             # Production build output
│   └── vite.config.js    # Vite configuration
│
├── db/                   # Database scripts
│   ├── db.sql            # Full schema (tables, triggers, constraints)
│   ├── PoS_System_dump.sql # Full data dump with sample data
│   └── seed_menu.sql     # Minimal seed (truck + menu items)
│
├── .github/workflows/     # CI/CD
│   └── deploy.yml        # Triggers Coolify redeploy on push to main
│
├── Dockerfile            # Multi-stage Docker image
├── turbo.json            # Turbo monorepo config
└── package.json          # Root workspace config
```

---

## Environment Variables

Create `backend/.env` with the following:

```env
DB_HOST=<your-mysql-host>
DB_USER=<your-mysql-user>
DB_PASSWORD=<your-mysql-password>
DB_NAME=<your-database-name>
```

---

## Installation

### Steps

**1. Clone the repository**

```bash
git clone <repo-url>
cd point-of-sale-system
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up the database**

Create a MySQL database, then run the schema:

```bash
mysql -u root -p <database-name> < db/db.sql
```

Option A — Full data dump with sample data:

```bash
mysql -u root -p <database-name> < db/PoS_System_dump.sql
```

Option B — Minimal seed (only the default truck + menu items):

```bash
mysql -u root -p <database-name> < db/seed_menu.sql
```

**4. Configure environment variables**

```bash
cd backend
cp .env.example .env   # if an example exists
# Edit .env with your MySQL credentials
```

---

## Running in Production

### Docker

```bash
docker build -t shako-pos .
docker run -p 3000:3000 --env-file backend/.env shako-pos
```

### Manual Build

```bash
npm run build           # Builds frontend into frontend/dist/
npm run start           # Starts backend server on port 3000
```

The backend serves the built frontend from `frontend/dist/` automatically.
