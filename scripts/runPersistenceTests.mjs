/**
 * scripts/runPersistenceTests.mjs
 * Script CLI nativo para ejecutar la suite de pruebas de persistencia de Nutrimemi.
 * No requiere Jest, Vitest ni dependencias externas.
 */

import { runJsonContractTests } from '../src/lib/persistence/__tests__/jsonContract.test.js';
import { runIdentityTests } from '../src/lib/persistence/__tests__/identity.test.js';
import { runArrayOrderingTests } from '../src/lib/persistence/__tests__/arrayOrdering.test.js';
import { runThreeWayMergeTests } from '../src/lib/persistence/__tests__/threeWayMerge.test.js';
import { runConcurrencyIntegrationTests } from '../src/lib/persistence/__tests__/concurrencyIntegration.test.js';

console.log('='.repeat(70));
console.log('  NUTRIMEMI — SUITE COMPLETA DE PRUEBAS DE PERSISTENCIA Y CONCURRENCIA');
console.log('='.repeat(70));

const suites = [
  runJsonContractTests(),
  runIdentityTests(),
  runArrayOrderingTests(),
  runThreeWayMergeTests(),
  runConcurrencyIntegrationTests()
];

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;
const failureDetails = [];

for (const suite of suites) {
  console.log(`\n📦 Módulo: ${suite.module}`);
  console.log(`   Total: ${suite.total} | Aprobados: ${suite.passed} | Fallidos: ${suite.failed}`);

  totalTests += suite.total;
  totalPassed += suite.passed;
  totalFailed += suite.failed;

  // Si tiene sub-suites anidadas (ej. threeWayMerge)
  if (suite.suites) {
    for (const sub of suite.suites) {
      console.log(`     ↳ Sub-suite: ${sub.module} (${sub.passed}/${sub.total})`);
      for (const res of sub.results || []) {
        const isFailed = res.passed === false || res.status === 'FAILED' || Boolean(res.error);
        if (isFailed) {
          failureDetails.push({ module: `${suite.module} > ${sub.module}`, test: res.name, error: res.error || 'Fallo de aserción' });
        }
      }
    }
  } else {
    for (const res of suite.results || []) {
      const isFailed = res.passed === false || res.status === 'FAILED' || Boolean(res.error);
      if (isFailed) {
        failureDetails.push({ module: suite.module, test: res.name, error: res.error || 'Fallo de aserción' });
      }
    }
  }
}

console.log('\n' + '='.repeat(70));
console.log(`RESUMEN GLOBAL:`);
console.log(`  Total de pruebas ejecutadas: ${totalTests}`);
console.log(`  Aprobadas:                   ${totalPassed}`);
console.log(`  Fallidas:                    ${totalFailed}`);
console.log(`  Resultado final:             ${totalFailed === 0 ? '✅ TODAS LAS PRUEBAS PASARON EXITOSAMENTE' : '❌ HUBO FALLOS EN LA SUITE'}`);
console.log('='.repeat(70));

if (failureDetails.length > 0) {
  console.error('\nDETALLE DE FALLOS:');
  for (const f of failureDetails) {
    console.error(`  - [${f.module}] ${f.test}: ${f.error}`);
  }
  process.exit(1);
} else {
  process.exit(0);
}
