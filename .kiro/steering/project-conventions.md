# Review Intelligence Frontend - Project Conventions

## Tech Stack

- React 19 with TypeScript 5.8
- Vite 6 for build tooling
- Zustand 5 for state management
- React Router 7 (HashRouter)
- Tailwind CSS with custom design tokens
- Recharts 3 for data visualization
- Vitest 4 with React Testing Library for testing
- Lucide React for icons

## Project Structure

```
├── components/           # Reusable UI components
│   ├── ui/              # Base UI primitives (Card, Button, Badge, etc.)
│   ├── competitive/     # Feature-specific components
│   └── [Feature]/       # Feature component folders with index.ts barrel
├── hooks/               # Custom React hooks (useXxx.ts)
├── pages/               # Page components (XxxPage.tsx)
├── services/            # API service layer (apiService.ts)
├── types/               # TypeScript type definitions
│   └── api.ts           # API response/request types
├── utils/               # Utility functions
├── store.ts             # Zustand global store
└── types.ts             # Shared frontend types
```

## Coding Conventions

### TypeScript

- Use explicit type annotations for function parameters and return types
- Define interfaces for component props with descriptive names (e.g., `CardProps`, `ButtonProps`)
- Use `type` for unions and simple types, `interface` for object shapes
- Prefer `const` assertions for literal arrays: `as const`
- API types go in `types/api.ts`, frontend types in `types.ts`

### React Components

- Use functional components with `React.FC<Props>` typing
- Props interface defined above component, named `ComponentNameProps`
- Use `clsx` and `tailwind-merge` via local `cn()` helper for conditional classes
- Destructure props in function signature
- Export components as named exports, pages as default exports

```tsx
interface CardProps {
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  variant = 'default',
}) => {
  // ...
};
```

### Custom Hooks

- Name hooks with `use` prefix: `useDashboardData`, `useCompetitiveData`
- Return object with data, loading state, error, and refetch function
- Use `useCallback` for memoized functions, `useMemo` for derived data
- Track mounted state with `useRef` to prevent state updates after unmount
- Document requirements in JSDoc comments

```ts
interface UseXxxResult {
  data: DataType | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useXxx(param: string): UseXxxResult {
  // ...
}
```

### API Service Layer

- All API calls go through `services/apiService.ts`
- Use the `apiFetch<T>()` wrapper for type-safe requests
- Throw `ApiError` with status code, message, and endpoint
- Function naming: `fetchXxx()` for GET, `sendXxx()` or `processXxx()` for POST
- Document API endpoints in JSDoc comments

### State Management (Zustand)

- Single store in `store.ts` with typed `AppState` interface
- Group related state and actions together
- Use selectors in components: `useStore((state) => state.xxx)`
- Naming: `setXxx` for setters, `xxxLoading` for loading states

### Styling

- Use Tailwind CSS utility classes
- Custom design tokens defined in Tailwind config:
  - Colors: `text-primary`, `text-secondary`, `text-tertiary`, `bg-base`, `bg-elevated`, `bg-surface`, `accent-primary`
  - Sentiment: `sentiment-positive`, `sentiment-negative`, `sentiment-neutral`
- No inline styles; use `className` prop
- Rounded corners: `rounded-none` (brutalist design)
- Borders: `border-2 border-accent-primary/20`

### Testing

- Test files co-located with source: `Component.test.tsx`, `useHook.test.ts`
- Use Vitest with `describe`, `it`, `expect`
- Mock API calls with `vi.mock()` and `vi.mocked()`
- Test loading states, error states, and successful data fetching
- Document requirements tested in JSDoc comments

```ts
describe('ComponentName', () => {
  it('should render correctly', () => {
    // ...
  });
});
```

## API Integration Patterns

### Data Fetching

- Fetch data in custom hooks, not directly in components
- Use `Promise.all` for parallel requests, `Promise.allSettled` for partial failures
- Transform API responses to chart-compatible formats in `useMemo`
- Handle empty states gracefully with fallback UI

### Error Handling

- Display `ErrorState` component with retry button on failures
- Show `LoadingState` or skeleton components while loading
- Partial failures: show available data with error indicator

## File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` (e.g., `useDashboardData.ts`)
- Tests: `*.test.tsx` or `*.test.ts`
- Types: `camelCase.ts`
- Utils: `camelCase.ts`

## Import Order

1. React and external libraries
2. Internal components (`../components/`)
3. Hooks (`../hooks/`)
4. Services (`../services/`)
5. Store (`../store`)
6. Types (`../types/`)
7. Utils (`../utils/`)

## Brand/Competitive Analysis

- Own brands: `avis`, `budget`, `payless`, `apex`, `maggiore`
- Use `isOwnBrand()` helper from `types/api.ts`
- Color coding: Purple (`#7C3AED`) for portfolio, Red (`#EF4444`) for competitors
