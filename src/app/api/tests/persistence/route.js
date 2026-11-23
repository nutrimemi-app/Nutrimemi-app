import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Endpoint de pruebas de persistencia — EXCLUSIVO de desarrollo local.
 *
 * Protección:
 * 1. En NODE_ENV !== 'development', responde 404 inmediatamente con cuerpo vacío (cero fuga de datos).
 * 2. Las importaciones dinámicas se ejecutan ÚNICAMENTE tras superar la guardia de desarrollo.
 * 3. En producción nunca se importan ni se ejecutan los módulos de prueba.
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return new Response(null, { status: 404 });
  }

  // Importaciones dinámicas para evitar que el bundle de producción incluya los tests
  const [
    { runJsonContractTests },
    { runIdentityTests },
    { runArrayOrderingTests },
    { runThreeWayMergeTests },
    { runConcurrencyIntegrationTests }
  ] = await Promise.all([
    import('@/lib/persistence/__tests__/jsonContract.test'),
    import('@/lib/persistence/__tests__/identity.test'),
    import('@/lib/persistence/__tests__/arrayOrdering.test'),
    import('@/lib/persistence/__tests__/threeWayMerge.test'),
    import('@/lib/persistence/__tests__/concurrencyIntegration.test')
  ]);

  const jsonContractReport            = runJsonContractTests();
  const identityReport                = runIdentityTests();
  const arrayOrderingReport           = runArrayOrderingTests();
  const threeWayMergeReport           = runThreeWayMergeTests();
  const concurrencyIntegrationReport  = runConcurrencyIntegrationTests();

  const all = [
    jsonContractReport,
    identityReport,
    arrayOrderingReport,
    threeWayMergeReport,
    concurrencyIntegrationReport
  ];

  const total  = all.reduce((acc, r) => acc + r.total,  0);
  const passed = all.reduce((acc, r) => acc + r.passed, 0);
  const failed = all.reduce((acc, r) => acc + r.failed, 0);

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    suite: 'Nutrimemi Persistence Test Suite',
    modules: all,
    summary: {
      total,
      passed,
      failed,
      success: failed === 0
    }
  });
}
