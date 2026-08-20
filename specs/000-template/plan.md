# Implementation Plan: [Feature Name]

> **Perspective**: Frontend Architect / Lead Developer  
> **Purpose**: Answer the question **"HOW & ARCHITECTURE"** (Angular Standalone + Signals + Services)

---

## 1. Technical Context & Constraints
- **Framework**: Angular 19 (Standalone Components, Signals, RxJS)
- **Styling**: SCSS (Vanilla), CSS Variables design tokens from `styles.scss`
- **Design Language**: Dark Mode Glassmorphism (see `UI_STYLE_GUIDE.md`)
- **Backend API**: Connects to `http://localhost:8080/api` via `ApiBaseService`
- **State Management**: Angular Signals (`signal`, `computed`, `effect`)

---

## 2. Models & Data Contracts (`src/app/shared/models/index.ts`)

```typescript
export interface [FeatureModel] {
  id: string;
  name: string;
  createdAt?: string;
}

export interface [FeatureRequest] {
  name: string;
}
```

---

## 3. Services Layer (`src/app/core/services/`)

```typescript
@Injectable({ providedIn: 'root' })
export class [Feature]ApiService extends ApiBaseService {
  private readonly BASE = '/[endpoint]';

  getAll(params?: PageParams): Observable<PageResponse<[FeatureModel]>> {
    return this.get<PageResponse<[FeatureModel]>>(this.BASE, params);
  }

  getById(id: string): Observable<[FeatureModel]> {
    return this.get<[FeatureModel]>(`${this.BASE}/${id}`);
  }

  create(data: [FeatureRequest]): Observable<[FeatureModel]> {
    return this.post<[FeatureModel]>(this.BASE, data);
  }
}
```

---

## 4. Component Hierarchy & File Structure

```
src/app/features/[feature]/
├── [feature].routes.ts               ← lazy routes
├── [feature]-list/
│   ├── [feature]-list.component.ts   ← standalone component with signals
│   ├── [feature]-list.component.html
│   └── [feature]-list.component.scss
└── [feature]-detail/
    ├── [feature]-detail.component.ts
    ├── [feature]-detail.component.html
    └── [feature]-detail.component.scss
```

---

## 5. Routing Configuration (`src/app/app.routes.ts`)

```typescript
{
  path: '[feature]',
  loadChildren: () => import('./features/[feature]/[feature].routes').then(m => m.[FEATURE]_ROUTES),
  canActivate: [authGuard]
}
```

---

## 6. Verification & Quality Checklist
- [ ] Responsive UI verified on mobile and desktop viewports.
- [ ] Build passes with `npx ng build --configuration=development` (0 errors).
- [ ] Verified API connection with `BACKEND_CONTRACT.md`.
