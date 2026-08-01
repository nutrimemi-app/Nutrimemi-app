# Graph Report - .  (2026-07-31)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 111 nodes · 166 edges · 16 communities (15 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3ed97b05`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useUI
- useAuth
- dependencies
- seed-alimentos.js
- AuthContext.js
- package.json
- foods/page.js
- compilerOptions
- sw.js

## God Nodes (most connected - your core abstractions)
1. `useUI()` - 21 edges
2. `useAuth()` - 14 edges
3. `calculateClinicalData()` - 7 edges
4. `usePushNotifications()` - 6 edges
5. `scripts` - 5 edges
6. `TabBar()` - 5 edges
7. `loadFoods()` - 5 edges
8. `NutriFoods()` - 4 edges
9. `ManageMenu()` - 4 edges
10. `NutriProfile()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `NutriAgenda()` --calls--> `useUI()`  [EXTRACTED]
  src/app/nutri/agenda/page.js → src/context/UIContext.js
- `NutriDashboard()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/nutri/dashboard/page.js → src/context/AuthContext.js
- `NutriFoods()` --calls--> `useUI()`  [EXTRACTED]
  src/app/nutri/foods/page.js → src/context/UIContext.js
- `NewPatient()` --calls--> `useUI()`  [EXTRACTED]
  src/app/nutri/new-patient/page.js → src/context/UIContext.js
- `ManageMenu()` --calls--> `loadFoods()`  [EXTRACTED]
  src/app/nutri/patient/[id]/menu/page.js → src/data/defaultFoods.js

## Import Cycles
- None detected.

## Communities (16 total, 1 thin omitted)

### Community 0 - "useUI"
Cohesion: 0.19
Nodes (13): NutriAgenda(), NewPatient(), EXCHANGE_VALUES, ManageMenu(), PatientFile(), ClinicalReport(), PhotosPage(), PatientRegistration() (+5 more)

### Community 1 - "useAuth"
Cohesion: 0.19
Nodes (10): NutriDashboard(), NutriProfile(), LoginPage(), PatientHome(), PatientMenu(), PatientProfile(), TabBar(), useAuth() (+2 more)

### Community 2 - "dependencies"
Cohesion: 0.15
Nodes (13): lucide-react, next, dependencies, lucide-react, next, react, react-dom, @supabase/supabase-js (+5 more)

### Community 3 - "seed-alimentos.js"
Cohesion: 0.18
Nodes (9): { createClient }, lista1, lista2, lista3, lista4, lista5, lista6, supabase (+1 more)

### Community 4 - "AuthContext.js"
Cohesion: 0.24
Nodes (6): metadata, outfit, viewport, BottomNav(), AuthContext, AuthProvider()

### Community 5 - "package.json"
Cohesion: 0.22
Nodes (8): name, private, scripts, build, dev, lint, start, version

### Community 6 - "foods/page.js"
Cohesion: 0.60
Nodes (4): NutriFoods(), DEFAULT_FOODS, loadFoods(), saveFoods()

### Community 7 - "compilerOptions"
Cohesion: 0.50
Nodes (3): compilerOptions, baseUrl, paths

## Knowledge Gaps
- **32 isolated node(s):** `baseUrl`, `paths`, `name`, `version`, `private` (+27 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useUI()` connect `useUI` to `useAuth`, `AuthContext.js`, `foods/page.js`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `AuthContext.js`, `foods/page.js`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `baseUrl`, `paths`, `name` to the rest of the system?**
  _32 weakly-connected nodes found - possible documentation gaps or missing edges._