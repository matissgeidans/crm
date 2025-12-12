# TowTrack CRM - Towing Services Management System

## Overview

TowTrack CRM is a comprehensive customer relationship management system designed specifically for towing service companies. It provides role-based access for drivers and administrators, enabling efficient trip logging, client management, and reporting.

## Recent Changes

- **December 2024**: Initial MVP implementation
  - Full authentication with Replit Auth
  - Driver dashboard with trip logging
  - Admin dashboard with analytics
  - Client management module
  - Excel and PDF export functionality
  - Dark/Light theme support

## Project Architecture

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (via Drizzle ORM)
- **Authentication**: Replit Auth (OpenID Connect)
- **Styling**: Tailwind CSS + Shadcn UI
- **Charts**: Recharts

### Directory Structure
```
├── client/src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/              # Shadcn UI components
│   │   ├── app-sidebar.tsx  # Navigation sidebar
│   │   ├── trip-form.tsx    # Trip logging form
│   │   ├── trip-table.tsx   # Trip data table
│   │   ├── client-form.tsx  # Client management form
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   │   └── useAuth.ts       # Authentication hook
│   ├── pages/               # Page components
│   │   ├── landing.tsx      # Public landing page
│   │   ├── driver-dashboard.tsx
│   │   ├── admin-dashboard.tsx
│   │   ├── clients.tsx
│   │   ├── reports.tsx
│   │   ├── analytics.tsx
│   │   └── settings.tsx
│   └── lib/                 # Utilities
├── server/
│   ├── routes.ts            # API endpoints
│   ├── storage.ts           # Database operations
│   ├── replitAuth.ts        # Auth configuration
│   └── db.ts                # Database connection
└── shared/
    └── schema.ts            # Database schema & types
```

### Database Schema
- **users**: User accounts with role (driver/admin)
- **sessions**: Session storage for auth
- **clients**: Client companies with per-km rates
- **trips**: Trip records with vehicle details, distances, costs

### User Roles
1. **Driver**: Can log trips, view own history, edit drafts
2. **Admin**: Full access - manage clients, review/approve trips, export reports, view analytics

## Key Features

### For Drivers
- Mobile-responsive trip logging form
- Auto-save drafts
- Trip history with status tracking
- Personal stats dashboard

### For Administrators
- Centralized report management
- Client management with custom rates
- Advanced filtering (date, driver, client, status)
- Excel and PDF export
- Analytics dashboard with charts

## API Endpoints

### Authentication
- `GET /api/login` - Initiate login
- `GET /api/logout` - Logout user
- `GET /api/auth/user` - Get current user

### Trips
- `GET /api/trips` - Get user's trips
- `GET /api/trips/all` - Get all trips (admin)
- `POST /api/trips` - Create trip
- `PATCH /api/trips/:id` - Update trip
- `PATCH /api/trips/:id/review` - Approve/reject trip (admin)

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client (admin)
- `PATCH /api/clients/:id` - Update client (admin)
- `DELETE /api/clients/:id` - Delete client (admin)

### Stats & Analytics
- `GET /api/stats/driver` - Driver statistics
- `GET /api/stats/admin` - Admin statistics
- `GET /api/analytics` - Full analytics data

### Exports
- `GET /api/reports/export/excel` - Export to Excel
- `GET /api/reports/export/pdf` - Export to PDF

## User Preferences

- Theme preference saved in localStorage
- Inter font for professional appearance
- Responsive design for field use
