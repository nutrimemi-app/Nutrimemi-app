# AGENTS.md — Reglas de trabajo de Nutrimemi

## 1. Objetivo del proyecto

Nutrimemi es una aplicación de gestión nutricional y pacientes.
Toda mejora debe fortalecer la experiencia del usuario, la calidad
del software, la seguridad y la confiabilidad de la información.

## 2. Reglas obligatorias antes de modificar

- Inspeccionar primero los archivos y comprender su funcionamiento.
- Identificar las dependencias entre componentes, páginas, APIs y datos.
- Explicar el alcance de los cambios antes de implementarlos.
- Realizar modificaciones pequeñas, controladas y verificables.
- No asumir que un archivo está libre de cambios del usuario.
- Revisar `git status` y el diff antes y después de trabajar.
- No sobrescribir trabajo existente sin autorización expresa.

## 3. Protección de funcionalidades y datos

- No eliminar funcionalidades existentes para simplificar código.
- No alterar cálculos nutricionales, fórmulas, resultados ni reportes
  sin autorización y validación explícitas.
- Preservar historiales, expedientes, registros y relaciones de pacientes.
- Preservar estadísticas, indicadores, métricas y datos históricos.
- No cambiar nombres de campos, tablas, columnas o estructuras
  sin analizar primero todas sus dependencias.
- No utilizar datos reales de pacientes en pruebas o ejemplos.
- No introducir información personal o sensible en logs.

## 4. Supabase y base de datos

- No ejecutar SQL ni migraciones sin autorización expresa.
- No modificar tablas, columnas, políticas RLS, permisos o relaciones
  sin presentar primero el plan y sus consecuencias.
- No borrar, truncar, reinicializar ni sobrescribir datos.
- No modificar credenciales, variables de entorno o configuraciones
  de producción sin autorización.
- Revisar las migraciones existentes antes de proponer cambios.
- Priorizar cambios compatibles con los datos actuales.

## 5. Seguridad

- Nunca exponer claves, tokens, contraseñas ni secretos.
- No colocar credenciales privadas en código del navegador.
- Verificar autenticación y autorización en el servidor.
- No confiar únicamente en validaciones del frontend.
- Validar y sanitizar entradas de usuario.
- Revisar permisos de acceso a la información de pacientes.
- No crear bypasses de autenticación ni accesos universales.

## 6. Diseño y experiencia de usuario

- Diseñar con enfoque mobile-first y responsive.
- Mantener una identidad visual coherente en toda la aplicación.
- Priorizar claridad, jerarquía visual y facilidad de navegación.
- Evitar interfaces genéricas, recargadas o con apariencia automática.
- Considerar accesibilidad, contraste, estados de carga y mensajes de error.
- No cambiar flujos de trabajo ni eliminar información visible
  como parte de un rediseño sin autorización.
- Mantener compatibilidad con los dispositivos habituales de los usuarios.

## 7. Uso de las habilidades instaladas

### Unslop

Consultar `.agents/skills/unslop/SKILL.md` cuando el trabajo
implique diseño visual, rediseño de páginas o mejora de UI/UX.

Antes de implementar un rediseño importante:
- Analizar la interfaz actual.
- Identificar problemas concretos.
- Proponer una dirección visual coherente.
- Preservar funcionalidades y contenido.
- No aplicar cambios grandes sin aprobación.

### Search First

Consultar `.agents/skills/search-first/SKILL.md` antes de programar cualquier nueva
característica, arquitectura o algoritmo.

Metodología obligatoria:
1. ANTES DE PROGRAMAR: verificar lo existente en el proyecto, buscar en GitHub/npm/docs.
2. COMPARA Y DECIDE: máximo 3 alternativas, recomendar 1 sola con justificación.
3. IMPLEMENTA: pasar a código real en módulos pequeños sin quedarse en teoría.
4. VERIFICA: ejecutar pruebas reales y comprobar navegador; no declarar éxito sin ejecución.
5. EVITA CICLOS INFINITOS: no repetir auditorías, resolver problemas concretos dentro del alcance.
6. ENTREGA: archivos modificados, funcionalidad terminada, pruebas y pendientes.

### Modern Web Guidance

Consultar `.agents/skills/modern-web-guidance/SKILL.md`
para tareas de frontend, HTML, CSS, JavaScript de cliente,
accesibilidad, rendimiento y componentes web.

Seguir el procedimiento de búsqueda y consulta de guías
indicado por la propia habilidad cuando corresponda.

No utilizarla para tareas de backend, SQL, infraestructura
o scripts que estén fuera de su alcance.

## 8. Tecnología y dependencias

Stack identificado:
- Next.js 14.1.0
- React 18
- Supabase JS 2
- Lucide React
- Web Push

- Respetar las versiones y arquitectura existentes.
- No migrar de framework ni introducir nuevas tecnologías
  sin autorización.
- No instalar dependencias por conveniencia sin justificar
  su necesidad y solicitar aprobación.
- Revisar `package.json` antes de proponer herramientas.

## 9. Calidad y validación

Después de cada modificación:
- Revisar el diff completo.
- Comprobar que no se hayan modificado archivos ajenos al alcance.
- Ejecutar las verificaciones pertinentes cuando sea seguro.
- Revisar errores de compilación y problemas de consola.
- Comprobar responsive y accesibilidad cuando aplique.
- Informar qué se modificó y qué pruebas se ejecutaron.
- Informar claramente cualquier prueba que no se pudo realizar.

No afirmar que una tarea está validada si no se ejecutaron
las comprobaciones correspondientes.

## 10. Git y archivos

- No ejecutar `git reset --hard`.
- No ejecutar `git clean`.
- No ejecutar `git checkout --` ni `git restore` sobre trabajo del usuario.
- No eliminar archivos sin autorización.
- No hacer commits, push ni despliegues sin autorización.
- No modificar archivos que no pertenezcan al alcance aprobado.
- Preservar los cambios previos del usuario.

## 11. Forma de trabajar

Trabajar por fases pequeñas y aprobadas.

Antes de cada fase:
1. Explicar qué se va a revisar o modificar.
2. Enumerar los archivos involucrados.
3. Identificar riesgos y dependencias.

Después de cada fase:
1. Presentar los cambios realizados.
2. Informar las verificaciones ejecutadas.
3. Indicar cualquier problema pendiente.
4. Esperar aprobación antes de ampliar el alcance.

Ante cualquier duda sobre datos, seguridad o comportamiento
existente, detenerse y consultar antes de modificar.
