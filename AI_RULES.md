# AI_RULES.md

Guidelines for AI agents and developers working on this codebase.

---

## 1. Tech Stack Overview (5–10 bullet points)

- **Language & Build:** TypeScript with **Vite** as the bundler/dev server.
- **Frontend Framework:** **React 18** with **React Router DOM** for client-side routing.
- **Styling & UI:** **Tailwind CSS** for styling plus **shadcn/ui** components built on **Radix UI** primitives; **lucide-react** for icons.
- **State & Data Fetching:** **@tanstack/react-query** for server state and caching; standard React hooks for local UI state.
- **Backend & Data:** **Supabase** (Postgres + Auth + Storage) with Supabase **Edge Functions** for server-side logic.
- **Forms & Validation:** **react-hook-form** for form state and submission; **zod** for schema validation and shared types.
- **Dates, Charts & Visualization:** **date-fns** for date/time operations; **recharts** for charts and visual analytics.
- **Notifications & UX:** **sonner** and the local **toaster** utilities (`src/components/ui/toaster.tsx`, `src/components/ui/use-toast.ts`) for toast notifications.
- **UI Utilities:** **class-variance-authority**, **clsx**, and **tailwind-merge** for composing Tailwind-based class names.

---

## 2. General Rules

1. **TypeScript only**
   - All new code must be written in TypeScript (`.ts` / `.tsx`), no plain JavaScript in `src/`.
   - Keep TypeScript strict; do not silence type errors with `any` unless absolutely unavoidable and clearly documented.

2. **Single, consistent way to do things**
   - If a library or pattern is specified below, use it instead of introducing alternatives.
   - Avoid adding new dependencies unless there is a clear, project-level need.

3. **Minimal dependencies**
   - Prefer built-in language features, React APIs, and existing project utilities.
   - Any new third-party package must be justified (why the existing stack is insufficient).

4. **Supabase as the backend**
   - Use Supabase (database, auth, storage, and edge functions) for backend features.
   - Do not introduce other backends/ORMs (Firebase, Prisma, etc.) without an explicit architectural decision.

---

## 3. UI, Styling & Components

### 3.1 Styling

- Use **Tailwind CSS** for all styling:
  - Layout, spacing, colors, typography, and responsive design.
  - Prefer utilities plus small abstractions (`class-variance-authority`, `tailwind-merge`) rather than custom CSS.
- Avoid:
  - Raw CSS files, CSS modules, or CSS-in-JS unless you are working around a specific third-party limitation.

### 3.2 Components & Layout

- Use **shadcn/ui** components under `src/components/ui` as the primary building blocks:
  - Buttons, inputs, dialogs, dropdowns, tabs, accordions, etc.
- For lower-level behavior, rely on **Radix UI** primitives that shadcn is based on.
- Do **not** introduce other UI kits (MUI, Ant Design, Chakra, Bootstrap, etc.) for new functionality.

### 3.3 Icons & Graphics

- Use **lucide-react** for icons.
- Do not add additional icon packs unless requested or required for branding.

---

## 4. Routing & Navigation

- Use **React Router DOM** for all routing:
  - Define routes in `src/App.tsx` and individual pages in `src/pages/`.
  - For navigation, use `<Link>` and other components from `react-router-dom`.
- Do not introduce alternative routing solutions or manual history manipulation.

---

## 5. Data Fetching & State Management

### 5.1 Server State (remote data)

- Use **@tanstack/react-query** for anything that:
  - Fetches data from Supabase (via Supabase client or HTTP calls to edge functions).
  - Needs caching, refetching, or synchronization across the app.
- Patterns:
  - Use `useQuery` for data fetching and `useMutation` for write operations.
  - Invalidate queries instead of manually forcing reloads where possible.
- Do not:
  - Implement custom global fetching/caching layers when React Query fits the use case.
  - Introduce Redux, SWR, Apollo, or similar libraries for new features.

### 5.2 Client State (local UI state)

- Use **React hooks** (`useState`, `useReducer`, `useContext`) for local component or small shared UI state.
- If you need global UI state across many routes, prefer:
  - A small, focused context provider, or
  - A minimal store using existing patterns already used in this project (do not add new state libraries like Zustand unless agreed).

---

## 6. Backend, Supabase & APIs

### 6.1 Supabase Usage

- Use **`@supabase/supabase-js`** and the client in `src/integrations/supabase/client.ts` to talk to Supabase:
  - For database queries, auth operations, and storage interactions on the client.
- Use **Supabase Edge Functions** (under `supabase/functions`) for:
  - Server-side operations that require secrets or elevated privileges.
  - Long-running or complex workflows that should not run in the browser.

### 6.2 API Shape

- Prefer **Supabase RPC / PostgREST** or **Edge Functions** instead of rolling your own HTTP server.
- When creating new endpoints:
  - Implement them as Supabase Edge Functions using TypeScript.
  - Validate input using **zod** where appropriate.

### 6.3 No extra backend frameworks

- Do **not** add Express, Fastify, NestJS, or other server frameworks in this project.
- All backend logic should be within Supabase and its ecosystem unless explicitly decided otherwise.

---

## 7. Forms & Validation

- Use **react-hook-form** for any non-trivial form:
  - Manage form state, validation, and submission using `useForm` and related hooks.
- Use **zod** for validation:
  - Define schemas for form data and API payloads.
  - Use `zodResolver` from `@hookform/resolvers` to connect zod with react-hook-form.
- Do not:
  - Introduce Formik, Yup, or other form/validation libraries for new features.
  - Hand-roll complex validation when a zod schema is more appropriate.

---

## 8. Dates, Charts & Visualization

- Use **date-fns** for:
  - Parsing, formatting, and manipulating dates and times.
  - Time zone handling as needed (together with JS `Intl` APIs).
- Use **recharts** for:
  - Charts, graphs, and other visual data representations on dashboards.
- Do not introduce:
  - Moment.js, Day.js, or other date libraries for new functionality.
  - Additional charting libraries (Chart.js, ECharts, etc.) unless agreed upon.

---

## 9. Notifications & UX Feedback

- Use **sonner** or the local toast utilities (`src/components/ui/toaster.tsx`, `src/components/ui/use-toast.ts`) for:
  - Success, error, and info notifications.
  - Feedback on async operations (loading, completion, failures).
- Avoid:
  - Browser `alert`/`confirm` for user-facing messages.
  - New notification libraries (react-hot-toast, notistack, etc.).

---

## 10. AI Assistant–Specific Rules

These rules apply specifically when an AI model is generating or editing code:

1. **Follow the established stack**
   - Only use libraries and patterns defined in this document and present in `package.json`.
   - Do not install new packages unless the user explicitly asks or there is a clear gap.

2. **Prefer existing abstractions**
   - Before creating a new utility, hook, or component, look for an existing one in:
     - `src/components/` and `src/components/ui/`
     - `src/hooks/`
     - `src/integrations/`
   - Reuse and extend existing patterns when possible.

3. **Keep it simple and consistent**
   - Favor straightforward, readable implementations over clever solutions.
   - Match the existing coding style (TypeScript types, Tailwind patterns, component structure).

4. **Respect routing & structure**
   - Keep routes in `src/App.tsx`.
   - Place new pages in `src/pages/` and new reusable components in `src/components/` (or appropriate subfolders).
   - Always update the main page (`src/pages/Index.tsx`) when new features should be visible there.

5. **No partial implementations**
   - Do not leave TODOs or incomplete features; any new code must be fully functional or not added.
   - If a feature is too large, clearly scope what is implemented and what is not.

---

If a new requirement conflicts with these rules (for example, real-time collaboration or heavy analytics that require different tools), the architecture should be revisited and this document updated instead of bypassing the rules.