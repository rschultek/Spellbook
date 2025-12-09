# Spellbook 📚✨

A modern, personal web application for managing programming notes, code snippets, and queries in a unified, searchable repository.

[![Node.js Version](https://img.shields.io/badge/node-22.14.0-brightgreen)](https://nodejs.org/)
[![Astro](https://img.shields.io/badge/Astro-5.13-FF5D01?logo=astro)](https://astro.build)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwind-css)](https://tailwindcss.com)
[![Tests](https://img.shields.io/badge/Tests-Playwright%20%2B%20Vitest-45ba4b)](https://playwright.dev)

## 📖 Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## About

**Spellbook** solves the common problem of scattered programming notes and code snippets across multiple locations (text files, notebooks, various apps). It provides a **single source of truth** where you can:

- 📝 Store and organize code snippets in multiple languages (MySQL, Bash, JavaScript, Python, etc.)
- 🔍 Search and filter snippets with full-text search
- 🏷️ Categorize using languages and tags
- ✏️ Full CRUD operations (Create, Read, Update, Delete)
- 🎨 Syntax highlighting for all major programming languages (Shiki)
- 🤖 AI-powered code explanations (OpenRouter)
- 📋 Copy to clipboard functionality
- 🔒 Secure with user authentication and Row Level Security
- 📱 Access from any device with responsive design
- ✅ Comprehensive testing (E2E + Unit tests)

This project is part of the **10xDevs course** and serves as a learning project to master modern web development with React, TypeScript, and Backend-as-a-Service architecture.

## Tech Stack

### Frontend

- **[Astro 5.13](https://astro.build)** - Meta-framework for fast, content-focused websites
- **[React 19.1](https://react.dev)** - UI library for interactive components with improved performance
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS 4.1](https://tailwindcss.com)** - Utility-first CSS framework with Vite plugin
- **[Shadcn/ui](https://ui.shadcn.com/)** - Re-usable component library
- **[React Hook Form](https://react-hook-form.com/)** - Performant form management
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[Shiki 3.17](https://shiki.style/)** - Syntax highlighting with 100+ languages support
- **[Lucide React](https://lucide.dev/)** - Beautiful & consistent icon toolkit

### Backend (BaaS)

- **[Supabase](https://supabase.com/)** - Backend-as-a-Service platform
  - PostgreSQL database with full-text search
  - Built-in authentication (email/password)
  - Row Level Security (RLS) for data protection
  - Real-time capabilities (optional)

### AI Services

- **[OpenRouter](https://openrouter.ai/)** - Unified API for AI models
  - Code explanation feature
  - DeepSeek R1 Turbo Chimera model (free tier)
  - Rate limiting and error handling

### Testing & CI/CD

- **[Playwright](https://playwright.dev/)** - End-to-end testing with Page Object Model
- **[Vitest](https://vitest.dev/)** - Unit testing with 80%+ coverage for utilities
- **[Testing Library](https://testing-library.com/)** - React component testing
- **[GitHub Actions](https://github.com/features/actions)** - CI/CD pipeline
- **[ESLint](https://eslint.org/)** + **[Prettier](https://prettier.io/)** - Code quality tools

### Development Tools

- **[Husky](https://typicode.github.io/husky/)** - Git hooks
- **[lint-staged](https://github.com/lint-staged/lint-staged)** - Pre-commit linting

## Getting Started

### Prerequisites

- **Node.js**: v22.14.0 (use [nvm](https://github.com/nvm-sh/nvm) to manage Node versions)
- **npm**: 9.6.5 or higher
- **Supabase account**: [Sign up for free](https://supabase.com)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/spellbook.git
   cd spellbook
   ```

2. **Install Node.js version**

   ```bash
   nvm use
   # or manually install Node.js 22.14.0
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up Supabase**

   **Option A: Local Supabase (Recommended for development)**

   ```bash
   # Start local Supabase instance (requires Docker)
   supabase start

   # Apply database migrations
   npx supabase migration up
   ```

   **Option B: Supabase Cloud**
   - Create a project at [supabase.com](https://supabase.com)
   - Copy `.env.example` to `.env` and add your Supabase credentials:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` with your Supabase project URL and anon key
   - Apply migrations to remote database:
     ```bash
     npx supabase db push
     ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

### Database Schema

The database uses a single table architecture optimized for the MVP:

- **`public.snippets`** - Code snippets with full-text search, tags, and RLS policies
- **`auth.users`** - User authentication (managed by Supabase Auth)

All database migrations are located in `supabase/migrations/` directory.

**Key features:**

- Row Level Security (RLS) ensures users can only access their own snippets
- Full-text search with PostgreSQL GIN indexes
- Tag-based filtering with array operations
- Auto-updating timestamps via triggers

For detailed schema documentation, see [`.ai/db-plan.md`](.ai/db-plan.md).

## Available Scripts

| Script             | Description                                  |
| ------------------ | -------------------------------------------- |
| `npm run dev`      | Start the development server with hot reload |
| `npm run build`    | Build the production application             |
| `npm run preview`  | Preview the production build locally         |
| `npm run lint`     | Run ESLint to check code quality             |
| `npm run lint:fix` | Run ESLint and automatically fix issues      |
| `npm run format`   | Format code using Prettier                   |
| `npm run test`     | Run unit tests with Vitest                   |
| `npm run test:watch` | Run unit tests in watch mode               |
| `npm run test:coverage` | Run tests with coverage report          |
| `npm run test:e2e` | Run E2E tests with Playwright                |
| `npm run test:e2e:ui` | Run E2E tests with Playwright UI          |

## Project Scope

### ✅ MVP Features (In Scope)

- **Authentication**
  - User registration and login (email/password)
  - Password reset functionality
  - Protected routes
  - Session management

- **Snippet Management (CRUD)**
  - Create new snippets with title, content, language, description, and tags
  - View snippet list with responsive grid layout
  - View individual snippet details with syntax highlighting
  - Edit existing snippets
  - Delete snippets with confirmation modal
  - Copy snippet content to clipboard

- **Search & Filtering**
  - Full-text search across title and content
  - Filter by programming language
  - Tag-based filtering
  - Newest-first sorting (by `created_at`)

- **Data Validation**
  - Client-side validation (Zod)
  - Server-side validation (PostgreSQL constraints)
  - Row Level Security (RLS) for data isolation

- **UX Features**
  - Syntax highlighting for all code snippets (Shiki)
  - AI-powered code explanations (OpenRouter)
  - Toast notifications for success/error messages
  - Loading states (skeleton screens, button spinners)
  - Empty state with call-to-action
  - Copy-to-clipboard for snippet content
  - Responsive design (mobile, tablet, desktop)
  - Debounced search for better performance

- **Testing & CI/CD**
  - E2E tests with Playwright (Page Object Model pattern)
  - Unit tests with Vitest (80%+ coverage for utilities)
  - GitHub Actions pipeline (build, type check, lint, tests)
  - Automated test fixtures and helpers

## Project Status

✅ **Status**: MVP Complete + Extensions

This project is being developed as part of the **10xDevs course** with the following constraints:

- **Timeline**: 3 weeks (42 hours total, 2 hours/day)
- **Focus**: Learning React, TypeScript, and modern web development
- **Deployment**: Local development only (no production deployment required for MVP)
- **Cost**: $0/month (leveraging free tiers)

### Course Requirements Met

- ✅ Authentication (Supabase Auth with middleware)
- ✅ CRUD operations (Snippet management with service layer)
- ✅ Business logic (Validation, search, filtering, RLS)
- ✅ Product Requirements Document (PRD)
- ✅ End-to-end tests (Playwright with Page Object Model)
- ✅ Unit tests (Vitest with 80%+ coverage)
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Documentation (PRD, Tech Stack, Architecture)

### Additional Features Beyond MVP

- ✅ Syntax highlighting (Shiki)
- ✅ AI code explanations (OpenRouter)
- ✅ Copy to clipboard
- ✅ Comprehensive testing strategy
- ✅ Service layer architecture
- ✅ Type-safe database operations

### Success Metrics

**MVP Success:**

- Application runs locally without errors
- All functional requirements implemented
- Minimum 1 E2E test passes
- CI/CD pipeline executes successfully
- Documentation complete

**Usability Success:**

- Add/edit/delete snippet < 30 seconds
- Find snippet < 10 seconds
- Minimum 10 real snippets in use

## License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ for learning and personal productivity**

For detailed technical documentation, see:

- [Product Requirements Document](.ai/prd.md)
- [Tech Stack Decision](.ai/tech-stack.md)
- [Technical Architecture](docs/tech-architecture.md)
- [Project Analysis](docs/project-analysis.md)
