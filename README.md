# LeapMentor — Frontend

The frontend for **LeapMentor**, a full-stack mentorship platform connecting mentors, mentees, and admins. Built with React 19, Vite, and Redux Toolkit, with real-time features via Socket.io.

## Tech Stack

- **Framework:** React 19 + Vite 7
- **Routing:** React Router v7
- **State Management:** Redux Toolkit + React Redux
- **Forms & Validation:** React Hook Form + Zod
- **Styling:** Tailwind CSS 4
- **Auth:** Clerk (SSO) + Google Auth
- **Real-time:** Socket.io Client
- **Charts:** Recharts
- **Monitoring:** Sentry
- **Testing:** Vitest + React Testing Library + MSW (mock service worker)
- **Icons:** Lucide React

## Project Structure

```
src/
├── app/                 # App shell and global wiring
│   ├── App.tsx
│   ├── main.tsx
│   └── store/           # Redux store, slices, hooks, selectors
├── features/            # Feature modules, each split into model/presenter/view
│   ├── admin/
│   ├── auth/
│   ├── connects/
│   ├── mentee/          
│   ├── mentor/          
│   ├── notifications/
│   ├── shared-dashboard/
│   └── uploads/
├── shared/              # Cross-feature code
│   ├── api/             # API request functions
│   ├── components/      # Reusable UI components 
│   ├── constants/       # App-wide constants
│   ├── context/         # Shared React Context providers (toasts)
│   ├── hooks/           # Shared custom hooks
│   ├── marketing/       # Landing page / marketing UI (Hero, Navbar, Footer, Testimonials, etc.)
│   ├── schemas/         # Zod validation schemas
│   └── utils/           # Utilities (axios instance, logger, error mapping)
├── assets/              # Static assets
└── test/                # Test setup, utilities, and mirrored test suites
```

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts the Vite dev server with hot module replacement (HMR).

### Build

```bash
npm run build
```

Produces a production build.

### Preview

```bash
npm run preview
```

Serves the production build locally for a final check.

### Linting

```bash
npm run lint
```

## Testing

This project uses **Vitest** and **React Testing Library** for unit and component testing, with **MSW** for mocking API calls.

```bash
npm run test           # Run all tests once
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report (v8)
```

Coverage results are also reported via `vitest-sonar-reporter` for SonarQube integration.

## Key Features

- Separate onboarding, dashboards, and flows for **mentors** and **mentees**, plus an **admin** panel for verifications and moderation
- Real-time updates (goals, milestones, connect requests, session status) over Socket.io
- Escrow-based session payments
- In-app AI chat widget (**LeapBuddy**)

## Environment Variables

This project expects environment variables (e.g. API base URL, Clerk publishable key, Socket.io endpoint) to be defined in a `.env` file at the project root, consumed via Vite's `import.meta.env`.

## Code Quality

- **SonarQube** integration is configured via `sonar-project.properties`
- **ESLint** is configured for React best practices and hooks rules