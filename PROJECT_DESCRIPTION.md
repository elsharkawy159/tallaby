# Tallaby - Multi-Vendor E-Commerce Platform

## Project Overview

**Tallaby** is a comprehensive, enterprise-grade multi-vendor e-commerce platform built as a modern monorepo. It serves as a full-featured marketplace solution where multiple vendors can list and sell their products to customers, similar to platforms like Amazon or eBay. The platform consists of three main applications: a customer-facing e-commerce storefront, a vendor dashboard for sellers, and an admin panel for platform management.

## Architecture

The project is structured as a **Turborepo monorepo** using **pnpm workspaces**, enabling code sharing, optimized builds, and efficient development workflows across multiple applications. The architecture follows a strict separation of concerns with shared packages for database schemas, UI components, and utilities.

## Main Applications

### 1. E-Commerce Storefront (`apps/ecommerce`)

The customer-facing application where users browse products, make purchases, and manage their accounts.

**Key Features:**

- Product catalog with advanced search and filtering
- Shopping cart and wishlist functionality
- Guest checkout and user authentication
- Order tracking and management
- Product reviews and ratings
- Multi-language support (English, Arabic)
- Real-time notifications
- Returns and refunds management
- Seller/store pages
- Category browsing
- Brand pages
- Coupon and promotion system
- Product recommendations
- Analytics integration

**Tech Stack:**

- Next.js 16.1.1 (App Router)
- React 19.2.3
- TypeScript 5.9.3
- Tailwind CSS 4.1.18
- shadcn/ui components
- Next-intl (internationalization)
- React Query (TanStack Query)
- Zustand (state management)
- react-hook-form + Zod (form handling)
- Supabase (authentication & database)

### 2. Vendor Dashboard (`apps/dashboard`)

A comprehensive dashboard for vendors/sellers to manage their store operations.

**Key Features:**

- Product management (CRUD operations)
- Order management and fulfillment
- Inventory management
- Sales analytics and reporting
- Payout tracking and management
- Shipping management
- Brand and category management
- Coupon creation and management
- Review management
- Site data configuration
- File uploads (drag-and-drop)

**Tech Stack:**

- Next.js 16.1.1 (App Router)
- React 19.2.3
- TypeScript 5.9.3
- TanStack Table (data tables)
- Recharts (analytics charts)
- React Dropzone (file uploads)
- Excel export functionality (xlsx)
- Drag-and-drop (react-beautiful-dnd)

### 3. Admin Panel (`apps/admin`)

Platform administration interface for managing the entire marketplace.

**Key Features:**

- User and customer management
- Vendor approval and management
- Order oversight
- Product moderation
- Category and brand administration
- Analytics and reporting
- Platform-wide settings
- Role-based access control

**Tech Stack:**

- Next.js 16.1.1 (App Router)
- React 19.2.3
- TypeScript 5.9.3
- TanStack Table
- Recharts
- Comprehensive admin controls

## Shared Packages

### Database Package (`packages/db`)

Centralized database schema and utilities using Drizzle ORM.

**Features:**

- Comprehensive PostgreSQL schema with 50+ tables
- Type-safe database operations
- Migrations management
- Support for complex e-commerce entities:
  - Products, variants, inventory
  - Orders, payments, shipments
  - Users, sellers, customers
  - Reviews, ratings, notifications
  - Coupons, promotions, deals
  - Categories, brands, attributes
  - Carts, wishlists
  - Returns, refunds
  - Analytics and reporting

### UI Package (`packages/ui`)

Shared component library built on shadcn/ui and Radix UI primitives.

**Components:**

- Form components (inputs, selects, checkboxes, etc.)
- Data display (tables, cards, badges)
- Navigation (menus, dropdowns, tabs)
- Feedback (toasts, alerts, dialogs)
- Layout components
- And 60+ reusable UI components

### TypeScript & ESLint Configs (`packages/typescript-config`, `packages/eslint-config`)

Shared configuration packages ensuring consistent code quality and type safety across all applications.

### Shared Library (`packages/lib`)

Common utilities and helper functions used across applications.

## Technology Stack

### Frontend

- **Framework:** Next.js 16.1.1 (App Router, React Server Components)
- **UI Library:** React 19.2.3
- **Language:** TypeScript 5.9.3 (strict mode)
- **Styling:** Tailwind CSS 4.1.18
- **Component Library:** shadcn/ui + Radix UI
- **State Management:** Zustand 5.0.9
- **Form Handling:** react-hook-form 7.69.0 + Zod 4.2.1
- **Data Fetching:** TanStack Query 5.90.14
- **Internationalization:** next-intl 4.6.1
- **Theming:** next-themes

### Backend & Database

- **Database:** PostgreSQL (via Supabase)
- **ORM:** Drizzle ORM 0.45.1
- **Authentication:** Supabase Auth
- **Caching:** Upstash Redis
- **File Storage:** Supabase Storage (presumably)

### Development Tools

- **Monorepo:** Turborepo 2.7.2
- **Package Manager:** pnpm 10.4.1
- **Code Quality:** ESLint 9.39.2 + Prettier
- **Build Tool:** Next.js Turbopack (development)

## Key Features & Capabilities

### E-Commerce Core

- ✅ Multi-vendor marketplace architecture
- ✅ Product catalog with variants, attributes, and inventory
- ✅ Advanced search and filtering
- ✅ Shopping cart with guest checkout support
- ✅ Wishlist functionality
- ✅ Order management (pending → delivered workflow)
- ✅ Payment processing with multiple payment methods
- ✅ Shipping management with multiple carriers
- ✅ Returns and refunds system
- ✅ Product reviews and ratings
- ✅ Coupon and promotion system
- ✅ Deal types (daily deals, lightning deals, clearance)
- ✅ Product recommendations engine
- ✅ Real-time notifications

### Vendor Management

- ✅ Vendor registration and approval workflow
- ✅ Seller dashboard with analytics
- ✅ Product listing and management
- ✅ Order fulfillment
- ✅ Inventory tracking
- ✅ Payout management
- ✅ Performance metrics

### Platform Administration

- ✅ Multi-role access control (customer, seller, admin, support, driver)
- ✅ Vendor approval and management
- ✅ Content moderation
- ✅ Platform-wide analytics
- ✅ User management
- ✅ System configuration

### User Experience

- ✅ Responsive design (mobile-first)
- ✅ Internationalization (i18n) support
- ✅ Dark mode support
- ✅ Progressive Web App (PWA) capabilities
- ✅ SEO optimization
- ✅ Performance optimization (LCP, CLS, FID)
- ✅ Accessibility features

## Development Standards

The project follows strict coding standards and architectural patterns:

- **Server Components First:** Prioritizes Next.js Server Components for optimal performance
- **Component Separation:** Complex components split into `.tsx`, `.client.tsx`, `.server.ts`, `.lib.ts`, `.types.ts`, `.dto.ts` files
- **Type Safety:** Strict TypeScript with proper typing throughout
- **Code Organization:** kebab-case file naming, proper folder structure
- **Clean Code:** Removes unused code, proper imports, DRY principles
- **Database Patterns:** Drizzle ORM with type-safe schemas, server actions for mutations
- **Form Patterns:** react-hook-form + Zod validation with proper error handling
- **Performance:** Code splitting, image optimization, lazy loading, Suspense boundaries

## Project Status

Active development on a modern, production-ready multi-vendor e-commerce platform designed to scale and handle complex marketplace operations. The codebase emphasizes type safety, performance, developer experience, and maintainability.
