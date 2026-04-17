# AlgOlympia Phase 3 — Complete System Audit

> **Auditor Role:** Senior Backend Architect + Security Engineer + Competitive Platform Designer
> **Scope:** Admin → Contest → Problem → Testcase (full-stack)
> **Stack:** Express/TypeScript · Prisma · PostgreSQL · Redis · Clerk · React + React Query

---

## 🔴 CRITICAL ISSUES (Fix Immediately)

---

### CRIT-01 — Admin route has NO rate limiter

**File:** `backend/src/index.ts` line 123

```ts
// Current — no limiter on admin route
app.use("/api/admin", contestRoutes);

// User/team routes have a limiter, admin does not
app.use("/api/user", apiLimiter, userRoutes);
app.use("/api/team", apiLimiter, teamRoutes);
```

**Why it's dangerous:** An authenticated admin (or a stolen admin JWT) can hammer `POST /api/admin/testcase` with thousands of requests per second. No rate limiting means no protection against runaway scripts or buggy clients.

**Fix:**
```ts
app.use("/api/admin", apiLimiter, contestRoutes);
```

---

### CRIT-02 — Contest lifecycle is NOT enforced (free jumps allowed)

**File:** `backend/src/modules/contest/contest.service.ts` lines 61–113

The `updateContestStatus` function accepts any valid enum value and writes it directly to the database with zero transition validation. You can:

- Jump directly DRAFT → ENDED (skipping UPCOMING and RUNNING)
- Set ENDED → RUNNING (restart a finished contest)
- Set RUNNING → DRAFT (revert a live contest)
- Set UPCOMING → DRAFT (no-op, but still no guard)

**Fix — enforce a strict FSM:**
```ts
const TRANSITIONS: Record<string, string[]> = {
    DRAFT:    ["UPCOMING"],
    UPCOMING: ["RUNNING"],
    RUNNING:  ["ENDED"],
    ENDED:    [],          // terminal state — no exits
};

export const updateContestStatus = async (contestId: string, status: string) => {
    const contest = await prisma.contest.findUnique({ where: { id: contestId } });

    if (!contest) throw new AppError("Contest not found", 404);

    const allowed = TRANSITIONS[contest.status] ?? [];
    if (!allowed.includes(status)) {
        throw new AppError(
            `Cannot transition from ${contest.status} to ${status}`,
            400,
            "INVALID_STATUS_TRANSITION"
        );
    }

    // ... rest of logic
};
```

---

### CRIT-03 — Problem can be added to ENDED contests

**File:** `backend/src/modules/contest/contest.service.ts` lines 30–32

```ts
// Current — only blocks RUNNING
if (contest.status === "RUNNING") {
    throw new AppError("Cannot modify running contest", 400);
}
```

This silently allows adding problems when the contest is `ENDED`. A problem added after a contest ends corrupts the historical record and any cached payloads.

**Fix:**
```ts
if (contest.status === "RUNNING" || contest.status === "ENDED") {
    throw new AppError(
        "Cannot add problems to a contest that is RUNNING or ENDED",
        400,
        "CONTEST_LOCKED"
    );
}
```

---

### CRIT-04 — Testcase can be added to ENDED contests

**File:** `backend/src/modules/contest/contest.service.ts` lines 49–51

Same as CRIT-03 — only blocks `RUNNING`, not `ENDED`.

**Fix:**
```ts
if (["RUNNING", "ENDED"].includes(problem.contest.status)) {
    throw new AppError(
        "Cannot modify testcases for a RUNNING or ENDED contest",
        400,
        "CONTEST_LOCKED"
    );
}
```

---

### CRIT-05 — `addProblem` passes raw `data: any` directly to Prisma without field whitelisting

**File:** `backend/src/modules/contest/contest.service.ts` line 34

```ts
// Current — blindly passes the entire request body into Prisma
return prisma.problem.create({ data });
```

Even though Zod validates the _shape_, the Zod output is assigned back to `req.body` and then passed wholesale. If a future field is added to the schema (e.g., `createdBy`), an attacker can inject it now through extra fields that Zod strips but your service then re-introduces via the middleware chain. This is prototype pollution territory.

**Fix — always whitelist fields explicitly:**
```ts
export const addProblem = async (data: {
    contestId: string;
    title: string;
    index: string;
    description: string;
    timeLimit: number;
}) => {
    // ... contest existence + status check ...

    return prisma.problem.create({
        data: {
            contestId: data.contestId,
            title:     data.title,
            index:     data.index.toUpperCase(),   // normalize to uppercase
            description: data.description,
            timeLimit: data.timeLimit,
        },
    });
};
```

---

### CRIT-06 — `addTestcase` passes raw `data: any` directly to Prisma

**File:** `backend/src/modules/contest/contest.service.ts` lines 53–58

```ts
// Current
return prisma.testcase.create({
    data: {
        ...data,              // ← spreading any-typed object into Prisma
        isHidden: data.isHidden ?? true,
    },
});
```

**Fix:**
```ts
return prisma.testcase.create({
    data: {
        problemId: data.problemId,
        input:     data.input,
        output:    data.output,
        isHidden:  data.isHidden ?? true,
    },
});
```

---

### CRIT-07 — `req: any` used in multiple controllers — type safety completely bypassed

**Files:** `contest.controller.ts` lines 12, 17, 22

```ts
// Current — all three controllers use req: any
export const createContestController = async (req: any, res: Response) => { ... }
export const getAllContestsController = async (req: any, res: Response) => { ... }
export const getProblemsByContestController = async (req: any, res: Response) => { ... }
```

Using `req: any` eliminates all TypeScript benefits. `req.user` becomes untyped, and a typo like `req.user.Id` (capital I) compiles silently.

**Fix — import the augmented Request type:**
```ts
import { Request, Response } from "express";

// TypeScript now knows req.user is User | undefined
export const createContestController = async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Unauthorized", 401);
    const data = await createContest(req.body, req.user.id);
    res.status(201).json({ success: true, data });
};
```

---

### CRIT-08 — `isAdmin` middleware uses `req: any`

**File:** `backend/src/middleware/admin.middleware.ts` line 3

```ts
// Current
export const isAdmin = (req: any, res: Response, next: NextFunction) => {
```

The entire reason `express.d.ts` exists is to augment `Request` with `user`. Using `req: any` defeats this entirely — TypeScript won't catch if a future refactor breaks the `req.user` attachment.

**Fix:**
```ts
import { Request, NextFunction, Response } from "express";

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({ success: false, message: "Admin only" });
    }
    next();
};
```

---

### CRIT-09 — Double toast on mutation success (`useCreateContest`)

**File:** `frontend/src/hooks/useAdmin.ts` lines 36–39

```ts
onSuccess: () => {
    toast.success("Contest created");       // ← fires from hook
    queryClient.invalidateQueries(...)
},
```

**File:** `frontend/src/components/CreateContest.tsx` line 40

```ts
onSuccess: () => {
    toast.success("Contest created successfully!");  // ← also fires from component
}
```

Both the hook's `onSuccess` and the component's `onSuccess` callback fire. The user sees two toasts. On slower connections the second toast is meaningless.

**Fix — pick one location. Hooks should handle global concerns (cache invalidation). Components handle local UI feedback:**
```ts
// In useAdmin.ts — remove the toast, keep cache invalidation
onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["contests"] });
},

// In CreateContest.tsx — toast lives here, where context is clear
onSuccess: () => {
    toast.success("Contest created successfully!");
    setTitle(""); setStartTime(""); setEndTime("");
},
```

---

## 🟠 MAJOR IMPROVEMENTS

---

### MAJOR-01 — No contest ownership check on status update — any admin can modify any contest

**File:** `backend/src/modules/contest/contest.service.ts` line 69+

The `updateContestStatus` function fetches the contest and updates it, but never checks if the requesting admin is the one who created it. In a multi-admin environment, Admin B can end Admin A's contest.

**Fix — check `createdBy` in the service:**
```ts
export const updateContestStatus = async (
    contestId: string,
    status: string,
    requestingUserId: string   // add this param
) => {
    const contest = await prisma.contest.findUnique({ where: { id: contestId } });

    if (!contest) throw new AppError("Contest not found", 404);

    if (contest.createdBy !== requestingUserId) {
        throw new AppError("You do not own this contest", 403, "FORBIDDEN");
    }

    // ... FSM transition check + update
};
```

**Update the controller to pass `req.user.id`:**
```ts
export const updateContestStatusController = async (req: Request<{ id: string }>, res: Response) => {
    const data = await updateContestStatus(req.params.id, req.body.status, req.user!.id);
    res.json({ success: true, data });
};
```

---

### MAJOR-02 — Same ownership check missing for `addProblem`

Ownership of the contest is not verified before adding problems. Any admin can add problems to any other admin's contest.

**Fix:** Pass the requesting user's ID into `addProblem` and validate `contest.createdBy`.

---

### MAJOR-03 — `getProblemsByContest` is an admin-only route but is designed to serve participants

**File:** `backend/src/modules/contest/contest.routes.ts` line 29
**File:** `backend/src/modules/contest/contest.service.ts` lines 121–148

The `GET /api/admin/problems?contestId=...` route is behind `isAdmin`, yet its implementation has participant-facing logic (checking if the contest has started, returning Redis-cached contest payloads). This is a **routing architecture conflict**. Admin-facing and participant-facing endpoints must be separate routes on separate routers.

**Fix — split into two routes:**
```
// Admin router (behind isAdmin)
GET /api/admin/contests/:id/problems   → returns ALL problems with ALL testcases

// Public / participant router (behind requireUser only)
GET /api/contests/:id/problems         → returns only started contests, only visible testcases
```

---

### MAJOR-04 — Redis cache is populated with only `isHidden: false` testcases

**File:** `backend/src/modules/contest/contest.service.ts` lines 88–90

```ts
testcases: {
    where: { isHidden: false },   // ← the cache only contains public testcases
},
```

This is correct for participants. But if an admin calls `GET /api/admin/problems`, they get the cached payload (which has no hidden testcases). Admins should see all testcases. The cache leaks participant-scoped data into the admin view.

---

### MAJOR-05 — No `contestId` existence validation before querying problems

**File:** `backend/src/modules/contest/contest.controller.ts` lines 23–29

The controller validates that `contestId` is provided in the query string, but `getProblemsByContest` queries the DB directly without checking it is a valid CUID first. An attacker can pass arbitrary strings → Prisma catches it, but the error message leaks Prisma internals.

**Fix:** Add `z.string().cuid()` validation to query params in the validator or a separate query param validator middleware.

---

### MAJOR-06 — Cache warming happens for both `UPCOMING` and `RUNNING`, but only `RUNNING` makes sense

**File:** `backend/src/modules/contest/contest.service.ts` lines 82–106

```ts
if (status === "UPCOMING" || status === "RUNNING") {
    // warm cache
}
```

Problems can still be added while in `UPCOMING`. If an admin adds a problem _after_ the cache is warmed (when status was set to `UPCOMING`), the cache is stale immediately. Cache warming should only happen on transition to `RUNNING`.

**Fix:**
```ts
if (status === "RUNNING") {
    // warm cache — at this point, problems are locked
}
if (status === "DRAFT" || status === "ENDED") {
    await redis.del(`contest:problems:${contestId}`);
    await redis.del(`contest:start:${contestId}`);
}
```

---

### MAJOR-07 — `console.log` in production service code

**File:** `backend/src/modules/contest/contest.service.ts` line 105

```ts
console.log(`[CACHE] Warmed problem payload for ${cacheKey}`);
```

You have a structured `pino` logger set up. Using `console.log` in a production service silently bypasses your logging pipeline (no correlation IDs, no log levels, no structured JSON).

**Fix:**
```ts
import { logger } from "../../lib/logger";
logger.info({ cacheKey }, "Cache warmed for contest");
```

---

### MAJOR-08 — Error handler exposes raw error messages in production

**File:** `backend/src/middleware/logging.middleware.ts` lines 37–42

```ts
res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",  // ← raw message always returned
    code: err.code || "INTERNAL_ERROR",
    errorId: req.id,
});
```

For non-operational errors (e.g., Prisma crashes, unhandled exceptions), `err.message` will contain internal details like `"PrismaClientKnownRequestError: The table 'Contest' doesn't exist"`. This is an information disclosure vulnerability.

**Fix:**
```ts
const isOperational = err.isOperational === true;

res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : "Internal Server Error",
    code: err.code || "INTERNAL_ERROR",
    errorId: req.id,
});
```

---

### MAJOR-09 — `attachUser` runs on every single request, including admin ones — Clerk SDK network call per request

**File:** `backend/src/middleware/user.middleware.ts` line 17

```ts
const user = await getOrCreateUser(userId);
```

`getOrCreateUser` first hits the DB to find the user. Only on cache miss does it call `clerkClient.users.getUser(clerkId)` (a network call to Clerk's API). With 400 RPS (your rate limit), under cold cache conditions this creates 400 external Clerk API calls per second. Clerk has its own rate limits.

There is no Redis caching of the resolved user object. This is a hidden N+1 at the infrastructure layer.

**Fix — cache the resolved user in Redis:**
```ts
export const getOrCreateUser = async (clerkId: string) => {
    const cacheKey = `user:${clerkId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    let user = await prisma.user.findUnique({ where: { clerkId } });

    if (!user) {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const mapped = mapClerkUser(clerkUser);
        // ... create user
    }

    await redis.set(cacheKey, JSON.stringify(user), "EX", 3600); // 1hr TTL
    return user;
};
```

---

### MAJOR-10 — Problem `index` is not normalized — case-sensitive duplicates possible

**File:** `backend/prisma/schema.prisma` line 81
**File:** `backend/src/modules/contest/contest.validator.ts` line 12

The DB has a `@@unique([contestId, index])` constraint. But `index` is just a raw string. The validator accepts `z.string().min(1).max(2)` — meaning `"a"` and `"A"` are treated as different indexes. A contest can have both problem `"a"` and problem `"A"` — which is a contradiction in competitive programming.

**Fix in service:**
```ts
index: data.index.toUpperCase().trim(),
```

**Fix in validator:**
```ts
index: z.string().min(1).max(2).toUpperCase(),
```

---

## 🟡 MINOR IMPROVEMENTS

---

### MINOR-01 — Missing `201 Created` status code on resource creation

All three `POST` controllers return `200 OK`. RESTfully, creating a resource should return `201 Created`.

```ts
// All three controllers
res.status(201).json({ success: true, data });
```

---

### MINOR-02 — No pagination on `getAllContests`

**File:** `backend/src/modules/contest/contest.service.ts` lines 115–119

```ts
return prisma.contest.findMany({ orderBy: { createdAt: "desc" } });
```

With 1,000 contests, this returns everything. There is no `take`, `skip`, or cursor.

**Fix:**
```ts
export const getAllContests = async (page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const [contests, total] = await Promise.all([
        prisma.contest.findMany({ orderBy: { createdAt: "desc" }, skip, take: limit }),
        prisma.contest.count(),
    ]);
    return { contests, total, page, totalPages: Math.ceil(total / limit) };
};
```

---

### MINOR-03 — No `updatedAt` on `Contest`, `Problem`, or `Testcase` models

**File:** `backend/prisma/schema.prisma`

The `Contest` model has `createdAt` but no `updatedAt`. You cannot tell when a contest was last modified — critical for debugging production issues and for cache invalidation strategies.

**Fix:**
```prisma
model Contest {
  // ...
  updatedAt DateTime @updatedAt
}

model Problem {
  // ...
  updatedAt DateTime @updatedAt
}
```

---

### MINOR-04 — No `DELETE` or `UPDATE` endpoints for Contest, Problem, or Testcase

None exist. Admin cannot:
- Delete a wrongly created contest in `DRAFT`
- Edit a problem's description before contest starts
- Delete a bad testcase
- Update contest `startTime`/`endTime` while in `DRAFT`

This forces workarounds and direct DB access in production.

---

### MINOR-05 — `Contest.createdBy` is a bare `String`, not a foreign key

**File:** `backend/prisma/schema.prisma` lines 58–68

```prisma
model Contest {
  // ...
  createdBy String    // ← not referencing User.id
}
```

There is no `@relation` to `User`. This means:
- No cascade on user deletion
- No `JOIN` possible through Prisma
- Contest can reference a deleted user's ID without error

**Fix:**
```prisma
model Contest {
  // ...
  createdById String
  createdBy   User   @relation("ContestCreator", fields: [createdById], references: [id])
}
```

---

### MINOR-06 — Frontend admin guard relies on stale React Query data

**File:** `frontend/src/pages/AdminPage.tsx` lines 34–37

```tsx
if (!user || user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
}
```

`useUserData` is a React Query call. The redirect only fires after the query resolves. If a non-admin user navigates to `/admin`, they see "Verifying permissions..." for the query duration, then get redirected. An attacker can read the admin UI response structure during that window.

This is not a backend bypass (the API is protected), but it leaks admin UI shape. Better to wrap `/admin` in a dedicated `<AdminRoute>` component that defers rendering until confirmed.

---

### MINOR-07 — `timeLimit` is stored as integer seconds but the UI allows `0.5` step floats

**File:** `frontend/src/components/AddProblem.tsx` lines 158–163

```tsx
<Input type="number" min="0.5" step="0.5" ... />
```

**Validator:**
```ts
timeLimit: z.number().int().positive()  // ← only int
```

Submitting `1.5` from the UI silently fails validation. The user gets a cryptic validation error referencing the field path. The UI and validator are contradictory — pick one. If fractional seconds are needed, store as milliseconds (Int) or change the schema to `Float`.

---

### MINOR-08 — `addTestcase` has no max size guard on `input`/`output`

**File:** `backend/src/modules/contest/contest.validator.ts` lines 17–22

```ts
input: z.string().min(1),
output: z.string().min(1),
```

There is no `.max()`. A malicious admin (or script) can store a 10MB testcase for a single problem. Your Express body limit is `10kb`, which protects the transport layer, but the `10kb` limit includes all fields combined. A `5kb` input + `5kb` output still fits.

**Fix:**
```ts
input:  z.string().min(1).max(65536),   // 64KB per field max
output: z.string().min(1).max(65536),
```

---

### MINOR-09 — Error is surfaced twice in `useAdmin` mutations

See CRIT-09. The same applies to `useAddProblem` and `useUpdateContestStatus` — `onSuccess` toast fires both in the hook and in the component.

---

### MINOR-10 — `redis.set` with no TTL on cached problem payloads

**File:** `backend/src/modules/contest/contest.service.ts` line 101

```ts
await redis.set(cacheKey, cachePayload);  // ← no TTL
```

If a contest status is stuck (e.g., never transitions to `ENDED` due to a bug), the cached payload lives in Redis **forever**. If problems were updated before the cache was warmed, the stale data persists indefinitely.

**Fix:**
```ts
await redis.set(cacheKey, cachePayload, "EX", 86400); // 24 hour safety TTL
```

---

## 🔵 SUGGESTED REFACTORS

---

### REFACTOR-01 — Extract contest status validation into a shared enum/guard

Instead of scattered string comparisons like `=== "RUNNING"` and `=== "ENDED"`, define a shared guard:

```ts
// utils/contest.guards.ts
import { ContestStatus } from "@prisma/client";

export const isContestLocked = (status: ContestStatus): boolean =>
    status === ContestStatus.RUNNING || status === ContestStatus.ENDED;
```

Use in both `addProblem` and `addTestcase` services.

---

### REFACTOR-02 — `getProblemsByContest` has mixed caching and DB logic — violates SRP

The function is responsible for:
1. Checking contest start time from Redis
2. Falling back to DB if Redis key missing
3. Returning raw cached JSON string vs structured objects depending on hit/miss

This dual-path return `{ isRaw: true, payload: string } | { isRaw: false, payload: Problem[] }` is a code smell. The controller then has to branch on `result.isRaw`. Both paths should return the same JSON-serializable type.

**Fix pattern:**
```ts
// Always return structured data; let a middleware handle caching
export const getProblemsByContest = async (contestId: string): Promise<Problem[]> => {
    // check timing...
    const cached = await redis.get(`contest:problems:${contestId}`);
    if (cached) return JSON.parse(cached);
    // DB fallback...
};

// Controller is now trivial
export const getProblemsByContestController = async (req: Request, res: Response) => {
    const data = await getProblemsByContest(req.query.contestId as string);
    res.json({ success: true, data });
};
```

---

### REFACTOR-03 — Service functions accept `data: any` — fix all signatures

Every service function should have a strictly typed parameter interface. The Zod schema output types should be re-exported and used as service function param types to maintain a single source of truth:

```ts
import { z } from "zod";
import { addProblemSchema } from "./contest.validator";

type AddProblemInput = z.infer<typeof addProblemSchema>;

export const addProblem = async (data: AddProblemInput, userId: string) => { ... };
```

---

### REFACTOR-04 — `isAdmin` middleware error response format inconsistency

`admin.middleware.ts` uses CRLF line endings (`\r\n`) while all other middleware files use LF. This will cause Git diff noise and potential issues in CI pipelines running on Unix. Run `git config core.autocrlf false` and normalize the file.

---

### REFACTOR-05 — `useContests` and `useProblems` hooks should have `staleTime` configured

Currently React Query will refetch on every window focus. For an admin panel where contests don't change second-to-second, this creates unnecessary API calls.

```ts
return useQuery({
    queryKey: ["contests"],
    queryFn: ...,
    staleTime: 30_000,   // 30 seconds — don't refetch unless >30s stale
});
```

---

## 📊 PRODUCTION READINESS SCORE

| Category | Score | Verdict |
|---|---|---|
| **Correctness** | 5/10 | Business rules partially enforced; critical lifecycle gaps allow illegal state transitions |
| **Security** | 6/10 | Auth pipeline is solid; IDOR risk on multi-admin, no rate limit on admin routes |
| **Scalability** | 6/10 | Redis caching is a good start; no pagination, no user cache, N+1 at middleware level |
| **Maintainability** | 5/10 | `req: any` everywhere, `data: any` in services, mixed dual-return patterns, `console.log` in services |
| **Overall** | **5.5 / 10** | Not production-ready. The auth/transport layer is mature; the domain logic layer has multiple correctness and security gaps that could corrupt live contest data. |

---

## 📋 PRIORITIZED FIX LIST

```
IMMEDIATE (before any production deployment):
  [1] CRIT-02 — Enforce contest lifecycle FSM
  [2] CRIT-03 — Block addProblem on ENDED contests
  [3] CRIT-04 — Block addTestcase on ENDED contests
  [4] CRIT-01 — Add rate limiter to /api/admin
  [5] CRIT-05/06 — Whitelist fields in addProblem / addTestcase
  [6] MAJOR-06 — Fix cache warming to happen only on RUNNING
  [7] MAJOR-08 — Don't leak raw error messages in production

SHORT TERM (before first contest runs):
  [8]  MAJOR-01/02 — Contest ownership checks for status update and addProblem
  [9]  MAJOR-03 — Split admin vs participant problem endpoint
  [10] MAJOR-04 — Fix Redis cache serving admin with participant-scoped data
  [11] MINOR-03 — Add updatedAt fields to models
  [12] MINOR-04 — Add delete/update endpoints for draft-phase resources
  [13] MINOR-05 — Add foreign key for Contest.createdBy

MEDIUM TERM:
  [14] MAJOR-09 — Cache resolved user in Redis
  [15] MAJOR-10 — Normalize problem index to uppercase
  [16] MINOR-02 — Pagination on getAllContests
  [17] MINOR-07 — Align timeLimit field (int vs float)
  [18] MINOR-10 — Add TTL to Redis problem cache
  [19] REFACTOR-01 through REFACTOR-05
```

---

## 🔍 SECURITY THREAT MATRIX

| Threat | Severity | Exploitable Now? |
|---|---|---|
| Admin route has no rate limit | **High** | ✅ Yes |
| Illegal status transitions (ENDED → RUNNING) | **High** | ✅ Yes |
| IDOR: any admin modifies any contest | **Medium** | ✅ Yes (multi-admin) |
| Raw Prisma error messages in prod | **Medium** | ✅ Yes |
| Admin sees stale participant cache | **Medium** | ✅ Yes |
| `req: any` bypasses TypeScript safety | **Low** | ✅ Latent bug risk |
| Unbound testcase I/O size | **Low** | ✅ Yes (within 10kb limit) |
| Frontend admin guard timing window | **Low** | ✅ UI-only, API is safe |
