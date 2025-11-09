## DRY Refactor and Folder Structure Guide (Admin Panel)

This guide standardizes API integration, state management, and UI patterns for the Next.js 15 Admin app. It aligns with the backend response format and introduces shared utilities to remove duplication across dashboards, tables, and forms.

### Goals
- Single, typed API client with consistent errors
- Reusable admin primitives: DataTable, Form, Pagination, Skeleton, Dialogs
- Clear feature layering: services and endpoints, not inline fetches
- Simple, explicit auth and RBAC handling

---

## Recommended Folder Structure

```
src/
├── app/                           # Route segments (RSC by default)
│   ├── (dashboard)/               # Group routes (optional)
│   ├── layout.tsx
│   └── providers.tsx              # Client providers (QueryClient, Theme, Toast)
├── components/
│   ├── ui/                        # Design system primitives
│   ├── admin/                     # Admin composites (DataTable, Toolbar, Filters)
│   └── features/                  # Feature-specific components (JobsTable, Forms)
├── lib/
│   ├── api/
│   │   ├── client.ts              # fetch wrapper (SSR/CSR safe)
│   │   ├── endpoints.ts           # URL builders
│   │   └── auth.ts                # token storage, header helpers
│   ├── config/                    # env, constants
│   ├── types/                     # ApiResponse, entities, DTOs
│   └── utils/                     # cn, formatters, guards
├── services/                      # Feature facades (admins, jobs, categories,...)
├── hooks/                         # useToast, useConfirm, usePagination, etc.
└── styles/                        # Tailwind theme extensions
```

Notes:
- Keep tables and forms generic in `components/admin/`; feature-specific wrappers live in `components/features/*`.

---

## Backend Contract (Types)

`src/lib/types/api.ts`
```ts
export type ApiSuccess<T> = { success: true; data: T; timestamp: string; pagination?: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean } };
export type ApiError = { success: false; error: { message: string; statusCode: number }; timestamp: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
```

---

## Single API Client with Auth

`src/lib/api/auth.ts`
```ts
export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

export function setAuthToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin_token', token);
}

export function clearAuthToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_token');
}
```

`src/lib/api/client.ts`
```ts
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

import { getAuthToken } from './auth';

export async function apiFetch<T>(path: string, options: { method?: HttpMethod; body?: unknown; headers?: HeadersInit; cache?: RequestCache } = {}): Promise<T> {
  const { method = 'GET', body, headers, cache } = options;
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { 'x-api-key': API_KEY } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...(cache ? { cache } : {}),
    next: { revalidate: 0 },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    const message = data?.error?.message ?? res.statusText;
    const statusCode = data?.error?.statusCode ?? res.status;
    throw new Error(`${statusCode}: ${message}`);
  }
  return data as T;
}
```

`src/lib/api/endpoints.ts`
```ts
export const endpoints = {
  auth: {
    adminLogin: () => `/auth/adminLogin`,
    verify: () => `/auth/verifyAdmin`,
  },
  jobs: (q?: string) => `/jobs${q ? `?${q}` : ''}`,
  job: (id: number | string) => `/jobs/${id}`,
  categories: () => `/categories`,
  feedback: () => `/feedback`,
  contact: () => `/contact`,
  analytics: {
    overview: () => `/analytics/overview`,
    summary: () => `/analytics/summary`,
    jobs: () => `/analytics/jobs`,
  },
  admins: () => `/admins`,
  users: () => `/users`,
  safetyAlerts: () => `/safety-alerts`,
};
```

---

## Feature Services (Thin, Typed)

`src/services/jobsService.ts`
```ts
import { apiFetch } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { ApiResponse } from '@/lib/types/api';

export type Job = { id: number; title: string; company: string; status: string; created_at: string };

export async function listJobs(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  const q = new URLSearchParams();
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.search) q.set('search', params.search);
  if (params?.status) q.set('status', params.status);
  return apiFetch<ApiResponse<Job[]>>(endpoints.jobs(q.toString()));
}

export async function createJob(payload: Partial<Job>) {
  return apiFetch<ApiResponse<Job>>(endpoints.jobs(), { method: 'POST', body: payload });
}

export async function updateJob(id: number, payload: Partial<Job>) {
  return apiFetch<ApiResponse<Job>>(`/jobs/${id}`, { method: 'PUT', body: payload });
}

export async function deleteJob(id: number) {
  return apiFetch<ApiResponse<{ message: string }>>(`/jobs/${id}`, { method: 'DELETE' });
}
```

Repeat for `categories`, `admins`, `feedback`, `contact`, and `safetyAlerts` as needed.

---

## Reusable Admin Components

Focus DRY on tables and forms:

- `components/admin/DataTable.tsx`: columns, rows, pagination, sorting, selection, batch actions.
- `components/admin/Toolbar.tsx`: Search input (debounced), filters, create button.
- `components/admin/FormDialog.tsx`: Modal for create/edit forms.
- `components/ui/`: Button, Input, Select, Card, Badge, Dialog, Pagination, Skeleton.

Use a debounced search hook and a shared Paginator component to eliminate duplicated logic.

`src/hooks/useDebounce.ts`
```ts
import { useEffect, useState } from 'react';
export function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => { const id = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(id); }, [value, delay]);
  return debounced;
}
```

---

## Auth and RBAC

Admin routes rely on `adminLogin` and `verifyAdmin` endpoints.

Pattern:
1) On login, store token via `setAuthToken(token)`; redirect to dashboard.
2) A client-side guard HOC or layout checks `verifyAdmin` on mount; on failure, redirect to login.
3) For RBAC, enrich token payload (role/permissions) and gate UI actions/buttons.

Tip: Keep verification lightweight and cache for the session using memory state; re-verify on tab reload.

---

## Error, Loading, and Empty States

Standardize across pages:
- Route-level `loading.tsx` and `error.tsx` for skeletons and error messages.
- Empty state component (icon + message + primary action).

---

## Caching and Revalidation

Default to `no-store` for admin mutations and lists. If analytics charts are heavy, set `next: { revalidate: N }` selectively or hydrate charts client-side with React Query for refetch.

---

## Step-by-Step Migration

1) Foundations
   - Add `lib/types/api.ts`, `lib/api/client.ts`, `lib/api/auth.ts`, `lib/api/endpoints.ts`.
   - Create `services/*Service.ts` for core entities.
   - Add `components/ui/` primitives and `components/admin/` composites.

2) Replace Inline Fetches
   - List pages: use `listJobs` (etc.), render `DataTable` with `Toolbar` and `Paginator`.
   - Forms: use `FormDialog` and service methods for create/update; show toasts on success/error.

3) Auth
   - Implement login using `adminLogin`, save token; add verify guard to dashboard layout.

4) Cleanup
   - Remove mock data and duplicated fetch logic.
   - Centralize constants and utils to `lib/`.

---

## Checklists

API
- [ ] All requests use `apiFetch`
- [ ] Endpoints built via `endpoints.ts`
- [ ] Typed `ApiResponse<T>` everywhere

UI
- [ ] DataTable, Toolbar, FormDialog reused across features
- [ ] Debounced search and shared Paginator
- [ ] Standard loading/error/empty states

Auth
- [ ] Token stored/cleared consistently
- [ ] Verify guard on protected routes
- [ ] Role-based UI gating where applicable

This structure eliminates repeated fetch/response handling, unifies UI patterns, and makes the admin panel easier to extend.


