# Graph Report - nutrimemi  (2026-09-30)

## Corpus Check
- 82 files · ~70,394 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 294 nodes · 505 edges · 37 communities (28 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4dac8927`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useUI
- useAuth
- dependencies
- seed-alimentos.js
- AppProviders.js
- [id]/menu/page.js
- getMealTypes
- compilerOptions
- sw.js
- route.js
- patients.js
- debug_appt.js
- fix_r24_ajustes.js
- move_diet.js
- refactor_2.js
- move_ajustes.js
- move_diet2.js
- move_diet3.js
- fix_states.js
- fix_report.js
- clean_ghosts.js
- get_states.js
- refactor_3.js
- refactor.js
- scratch_parse.js
- get_git_info.js
- update_meal_plans.js
- rules/graphify.md
- workflows/graphify.md
- next.config.js
- push_git.js

## God Nodes (most connected - your core abstractions)
1. `useUI()` - 29 edges
2. `useAuth()` - 22 edges
3. `updatePatient()` - 18 edges
4. `usePatient()` - 16 edges
5. `getMealTypes()` - 15 edges
6. `calculateClinicalData()` - 12 edges
7. `PatientFile()` - 11 edges
8. `getPatientById()` - 11 edges
9. `ManageMenu()` - 9 edges
10. `loadFoods()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `NutriAgenda()` --calls--> `getPatients()`  [EXTRACTED]
  src/app/nutri/agenda/page.js → src/lib/patients.js
- `NutriDashboard()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/nutri/dashboard/page.js → src/context/AuthContext.js
- `NutriDashboard()` --calls--> `useUI()`  [EXTRACTED]
  src/app/nutri/dashboard/page.js → src/context/UIContext.js
- `NutriLayout()` --calls--> `useAuth()`  [EXTRACTED]
  src/app/nutri/layout.js → src/context/AuthContext.js
- `NewPatient()` --calls--> `calculateAge()`  [EXTRACTED]
  src/app/nutri/new-patient/page.js → src/lib/patients.js

## Import Cycles
- None detected.

## Communities (37 total, 9 thin omitted)

### Community 0 - "useUI"
Cohesion: 0.17
Nodes (17): NutriAgenda(), NutriFoods(), NewPatient(), Recordatorio24H(), PatientSelfRegister(), PatientRegistration(), R24H(), UIContext (+9 more)

### Community 1 - "useAuth"
Cohesion: 0.12
Nodes (20): NutriLayout(), NutriProfile(), LoginPage(), DailyLog(), EXCHANGE_VALUES, FOOD_GROUPS, UNUSUAL_FOODS, PatientEvolution() (+12 more)

### Community 2 - "dependencies"
Cohesion: 0.09
Nodes (21): lucide-react, next, dependencies, lucide-react, next, react, react-dom, @supabase/supabase-js (+13 more)

### Community 3 - "seed-alimentos.js"
Cohesion: 0.18
Nodes (9): { createClient }, lista1, lista2, lista3, lista4, lista5, lista6, supabase (+1 more)

### Community 4 - "AppProviders.js"
Cohesion: 0.24
Nodes (6): metadata, viewport, AppProviders(), BottomNav(), AuthProvider(), UIProvider()

### Community 5 - "[id]/menu/page.js"
Cohesion: 0.12
Nodes (18): ControlPage(), EXCHANGE_VALUES, foodGroups, ManageMenu(), PRESET_RECIPES, suggestRecipesForPortions(), EXCHANGE_GUIDE_DB, PatientFile() (+10 more)

### Community 6 - "getMealTypes"
Cohesion: 0.28
Nodes (8): EXCHANGE_EXAMPLES, FOOD_GROUPS, MenuCard(), ClinicalReport(), EvolutionChart(), MealCustomizerModal(), getMealTypes(), MEAL_PLANS

### Community 7 - "compilerOptions"
Cohesion: 0.50
Nodes (3): compilerOptions, baseUrl, paths

### Community 11 - "patients.js"
Cohesion: 0.19
Nodes (16): NutriDashboard(), PatientFoodLog(), displayCalculatedPortion(), EXCHANGE_GUIDE_DB, PatientDashboard(), MeasurementsPage(), PhotosPage(), QuestionsPage() (+8 more)

### Community 13 - "debug_appt.js"
Cohesion: 0.18
Nodes (8): { createClient }, envContent, envPath, fs, path, supabase, supabaseKey, supabaseUrl

### Community 15 - "fix_r24_ajustes.js"
Cohesion: 0.25
Nodes (7): content1, content2, endAjustes, fs, r24hFullEnd, r24hFullStart, startAjustes

### Community 16 - "move_diet.js"
Cohesion: 0.25
Nodes (7): ajustPeso, content, dietBlock, endDiet, fs, nextSection, startDiet

### Community 17 - "refactor_2.js"
Cohesion: 0.25
Nodes (7): content, fichaMatch, footerPos, fs, previMatch, r24hMatch, respMatch

### Community 18 - "move_ajustes.js"
Cohesion: 0.29
Nodes (6): ajustesBlock, content, endAjustes, fs, insertPos, startAjustes

### Community 19 - "move_diet2.js"
Cohesion: 0.29
Nodes (6): content, dietBlock, distrMatch, endDiet, fs, startDiet

### Community 20 - "move_diet3.js"
Cohesion: 0.29
Nodes (6): content, endNotas, extractBlock, fs, insertPos, startAjustes

### Community 21 - "fix_states.js"
Cohesion: 0.33
Nodes (5): code, existingDeclarations, fs, setters, toAdd

### Community 22 - "fix_report.js"
Cohesion: 0.40
Nodes (4): content, filePath, fs, path

### Community 24 - "get_states.js"
Cohesion: 0.50
Nodes (3): code, fs, setters

### Community 25 - "refactor_3.js"
Cohesion: 0.50
Nodes (3): content, distrMatch, fs

### Community 26 - "refactor.js"
Cohesion: 0.50
Nodes (3): antroMatch, content, fs

### Community 27 - "scratch_parse.js"
Cohesion: 0.50
Nodes (3): data, fs, out

## Knowledge Gaps
- **122 isolated node(s):** `{ createClient }`, `supabase`, `{ createClient }`, `fs`, `path` (+117 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useUI()` connect `useUI` to `useAuth`, `AppProviders.js`, `[id]/menu/page.js`, `getMealTypes`, `patients.js`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useAuth` to `useUI`, `patients.js`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `supabase` connect `[id]/menu/page.js` to `useUI`, `useAuth`, `patients.js`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `{ createClient }`, `supabase`, `{ createClient }` to the rest of the system?**
  _122 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.11742424242424243 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `[id]/menu/page.js` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._