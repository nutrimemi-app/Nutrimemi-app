---
name: search-first
description: |
  Research-before-coding workflow. Systematizes searching package registries (npm, PyPI), MCP ecosystems, existing skills, GitHub, and official documentation for proven solutions before writing custom code. Enforces the adopt, extend, or build decision hierarchy.
  Trigger when:
  - Starting a new feature, architecture design, or algorithm implementation.
  - Adding a dependency, integration, or utility function.
  - Considering writing custom logic for persistence, synchronization, state reconciliation, or data transformation.
  - Before creating any net-new helper, abstraction, or protocol.
---

# Search First — Research-Before-Coding Methodology

Enforces a strict **Research & Reuse** paradigm before any code is designed or implemented. AI agents must not guess, reinvent architectures, or write net-new code without first discovering battle-tested solutions in the ecosystem.

## Core Rules

1. **ANTES DE PROGRAMAR:**
   - Comprueba qué existe ya en el proyecto.
   - Busca soluciones similares en proyectos reales de GitHub, npm y documentación oficial.
   - Investiga si existe una biblioteca, RFC o patrón probado que resuelva el problema.
   - No inventes una arquitectura propia si existe una solución estándar adecuada.

2. **COMPARA Y DECIDE:**
   - Presenta como máximo 3 alternativas relevantes.
   - Recomienda una sola.
   - Explica brevemente por qué es la mejor para el stack y las restricciones del proyecto.
   - Si ninguna sirve, desarrolla la solución mínima necesaria estrictamente adaptada al problema.

3. **IMPLEMENTA:**
   - No te quedes en informes, diagramas o propuestas abstractas.
   - Después de investigar y aprobar, implementa la solución en los archivos reales.
   - Trabaja por módulos pequeños, controlados y funcionales.
   - No reescribas código que ya funciona sin una razón demostrable.

4. **VERIFICA:**
   - Ejecuta las pruebas disponibles.
   - Comprueba el resultado real en navegador cuando corresponda.
   - Si una herramienta de ejecución falla, identifica el bloqueo y utiliza una alternativa razonable sin inventar resultados.
   - Nunca declares pruebas exitosas sin haberlas ejecutado.

5. **EVITA LOS CICLOS INFINITOS:**
   - No repitas auditorías que ya se realizaron.
   - No redactes un nuevo informe cada vez que encuentres un detalle.
   - No abras una nueva fase hasta cerrar la anterior.
   - Si encuentras un problema, corrígelo directamente cuando esté dentro del alcance autorizado.
   - Si no puedes corregirlo, explica exactamente qué lo bloquea y qué decisión necesitas.

6. **ENTREGA:**
   - Archivos modificados.
   - Funcionalidad terminada.
   - Pruebas realmente ejecutadas y sus resultados.
   - Problemas pendientes concretos.

## Workflow

### 1. Need Analysis
- Clarify the exact functional requirement and constraints (e.g. Next.js App Router, React 18, Supabase JSONB, zero unauthorized dependencies, no SQL modifications).

### 2. Multi-Channel Search
- **Registry Check**: Search npm/PyPI for existing packages covering the use case.
- **GitHub Code Search**: Search public implementations, RFCs, and real-world patterns.
- **Official Docs**: Consult authoritative specifications (e.g., JSON Patch RFC 6902, JSON Merge Patch RFC 7396, CRDT / OT literature, Supabase optimistic concurrency).

### 3. Adopt, Extend, or Build Hierarchy
- **Adopt**: If a battle-tested, zero-risk standard solves $\ge 80\%$ of the need within project constraints, adopt it.
- **Extend**: If an existing internal helper or standard pattern exists, adapt it minimally.
- **Build**: Only if no standard fits the specific clinical/data constraints, build a minimal, deterministic pure-function solution.
