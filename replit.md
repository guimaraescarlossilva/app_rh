# Overview

This is a comprehensive Human Resources (HR) management system built with a modern full-stack architecture. The system manages employee lifecycle operations including hiring, vacation tracking, terminations, payroll processing, salary advances, and user permissions. It features a React-based frontend with shadcn/ui components and an Express.js backend with PostgreSQL database storage.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod schema validation
- **Build Tool**: Vite with custom configuration for development and production

## Backend Architecture
- **Runtime**: Node.js with TypeScript (ES modules)
- **Framework**: Express.js with RESTful API design
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based with bcrypt password hashing
- **Validation**: Zod schemas shared between client and server
- **Development**: Hot reloading with Vite integration in development mode

## Database Design
- **Primary Database**: PostgreSQL via Neon Database serverless connection
- **Schema Management**: Drizzle Kit for migrations and schema synchronization
- **Key Entities**: Users, Employees, Job Positions, Vacations, Terminations, Advances, Payroll, Permission Groups
- **Data Relationships**: Foreign key constraints with cascade delete operations
- **Enums**: PostgreSQL enums for status fields (employee status, vacation status, payment status, etc.)

## Core Modules

### Employee Management
- Complete employee lifecycle from hiring to termination
- Job position hierarchy and salary management
- Employee status tracking (active, inactive, on leave)

### Vacation System
- Vacation request workflow with approval process
- Period tracking for acquisition and enjoyment dates
- Status management (pending, approved, in progress, completed, rejected)

### Payroll Processing
- Monthly payroll calculation with multiple components
- Support for base salary, night shift differentials, overtime
- Deduction handling (INSS, IRRF, union fees, etc.)
- Advance payment integration

### Termination Management
- Multiple termination reasons (dismissal, resignation, retirement, etc.)
- Severance calculation and documentation tracking
- FGTS and receipt management workflow

### Permission System
- Role-based access control with granular permissions
- Module-level permissions (read, create, update, delete)
- User group assignments with hierarchical access

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **WebSocket Support**: Real-time database connections via ws library

### UI Components
- **Radix UI**: Comprehensive primitive component library for accessibility
- **Lucide React**: Icon system with consistent design language
- **React Hook Form**: Form state management with validation
- **TanStack Query**: Server state management and caching

### Development Tools
- **Vite**: Fast build tool with HMR and optimized production builds
- **TypeScript**: Static type checking across the entire stack
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Drizzle Kit**: Database schema management and migration tools

### Authentication & Security
- **bcrypt**: Password hashing for secure user authentication
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Date Handling
- **date-fns**: Comprehensive date manipulation and formatting library