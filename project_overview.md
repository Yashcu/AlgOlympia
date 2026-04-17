# AlgOlympia 2.0: Project Architecture & Implementation

AlgOlympia 2.0 is a full-stack platform designed for competitive programming team management and synchronization. It leverages modern web technologies to provide a high-performance, real-time experience.

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, TypeScript, Vite, Socket.io-client, Tailwind CSS, Clerk (Auth) |
| **Backend** | Node.js, Express, TypeScript, Socket.io, Prisma (ORM) |
| **Database** | PostgreSQL (Primary), Redis (Caching & Socket Adapter) |
| **Infrastructure** | Clerk Middleware, Zod (Validation), Winston (Logging) |

---

## 🏗️ Project Structure

### Backend (`/backend`)
The backend follows a modular, domain-driven structure:
- **`src/modules/`**: Contains core business logic. Each module (e.g., `team`, `user`) has its own:
    - `*.routes.ts`: API endpoints.
    - `*.controller.ts`: Request/Response handling.
    - `*.service.ts`: Business logic & Database transactions.
    - `*.socket.ts`: Web Socket event handlers.
    - `*.validator.ts`: Schema validation using Zod.
- **`src/lib/`**: Singleton instances and shared clients (Prisma, Redis, Logger, Emitter).
- **`src/middleware/`**: Cross-cutting concerns like Auth, Error Handling, and Rate Limiting.
- **`src/utils/`**: Helper functions (Invite code generation, Custom Errors).

### Frontend (`/frontend`)
The frontend is built for performance and maintainability:
- **`src/api/`**: Strongly typed API client services.
- **`src/components/`**: Reusable UI components (Atomic design) and feature components.
- **`src/hooks/`**: Custom React hooks for data fetching (`useTeam`, `useUserData`) and sockets (`useTeamSocket`).
- **`src/lib/`**: Core configurations (Axios instance, Socket connection).
- **`src/types/`**: Shared TypeScript interfaces/types.

---

## 🔐 Authentication Flow
1. **Frontend**: Uses Clerk for secure Google/Email authentication.
2. **Backend**: 
    - `clerkMiddleware()` populates the request with session info.
    - `requireUser` middleware ensures the request is authenticated.
    - `attachUser` middleware syncs/fetches the local `User` record from PostgreSQL based on the `clerkId`.

---

## 📡 Real-Time Synchronization
The project implements a robust real-time update system:
1. **Socket.io**: Establishes a permanent connection between client and server.
2. **Rooms**: Users join a team-specific room: `team:${teamId}`.
3. **Triggers**: When a team-related action occurs (Join, Leave, Kick, Delete):
    - The backend performs the DB update.
    - **Cache Invalidation**: Redis keys for affected users are deleted.
    - **Emission**: `emitTeamUpdate(teamId)` sends a `team:updated` signal to the room.
4. **Frontend Reaction**: The `useTeamSocket` hook listens for `team:updated` and automatically re-fetches data using standard API calls.

---

## 💾 Data & Caching Strategy
- **Prisma + PostgreSQL**: Ensures data integrity with transactions (`$transaction`) for complex operations like joining a team.
- **Redis Caching**:
    - **API Cache**: `getMyTeam` results are cached in Redis for 30 seconds to reduce DB load.
    - **Socket Adapter**: Uses Redis to synchronize Socket.io events across multiple server instances (production-ready).

---

## 📊 API Response Pattern
All API responses follow a consistent pattern:
- **Success**: Returns the data object directly (e.g., `Team` object with included members).
- **Errors**: Handled by a global `errorHandler` middleware.
  ```json
  {
    "success": false,
    "message": "Error description",
    "error": "Error Code (e.g., USER_ALREADY_IN_TEAM)",
    "stack": "..." // (Only in development)
  }
  ```

---

## 🚀 Key Features Implemented
- [x] **Secure Auth**: Clerk integration + local User syncing.
- [x] **Team Management**: Create teams, Join via unique invite codes, Leave/Delete functionality.
- [x] **Member Control**: Leader-only permissions to remove members.
- [x] **Real-time Dashboard**: Live updates when members join or leave.
- [x] **Performance**: Redis caching and optimized database queries.
