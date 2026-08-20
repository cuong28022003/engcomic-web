# Task Breakdown: [Feature Name]

> **Perspective**: Frontend Developer / AI Agent  
> **Purpose**: Answer the question **"EXECUTION & CHECKLIST"**  
> **Instructions for AI**: Execute tasks sequentially. Run `npx ng build --configuration=development` after completing tasks to verify syntax before checking `[x]`.

---

## Phase 1: Models & API Service Layer (`models/` & `services/`)
- [ ] **T001**: Define TypeScript interfaces in `src/app/shared/models/index.ts`
- [ ] **T002**: Implement API Service extending `ApiBaseService` in `src/app/core/services/`

---

## Phase 2: Routing & Component Scaffolding (`features/`)
- [ ] **T003**: Create feature route definition `[feature].routes.ts`
- [ ] **T004**: Register route in `src/app/app.routes.ts` (with appropriate Guard)
- [ ] **T005**: Scaffold standalone components (TypeScript, HTML, SCSS)

---

## Phase 3: UI Implementation & State Management
- [ ] **T006**: Implement main list / dashboard component (Signals, Loading, Empty states, Pagination)
- [ ] **T007**: Implement detail / form component (Reactive interactions, Validations, Toasts)
- [ ] **T008**: Apply styling conforming to `UI_STYLE_GUIDE.md` (Glassmorphism, Responsive layout)

---

## Phase 4: Navigation & Verification
- [ ] **T009**: Add navigation entry in Header / Sidebar
- [ ] **T010**: Full build verification with `npx ng build --configuration=development`
- [ ] **T011**: End-to-end user flow verification with backend API
