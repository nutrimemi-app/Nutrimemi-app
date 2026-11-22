import { NextResponse } from 'next/server';

/**
 * Endpoint de pruebas de persistencia — SOLO desarrollo.
 *
 * Protección: devuelve 404 en cualquier entorno que no sea development.
 * No modifica autenticación ni Supabase; es una restricción de ruta en servidor.
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
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
