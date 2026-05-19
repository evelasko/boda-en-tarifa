import type { Metadata } from 'next';
import StaffServicePrintButton from '@/components/staff/StaffServicePrintButton';
import StaffServiceReportView from '@/components/staff/StaffServiceReport';
import { buildStaffServiceReport } from '@/lib/staff-service-report';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Hoja de servicio — Boda Enrique & Manuel',
  description: 'Resumen de platos y asignación por mesa para el equipo de servicio.',
  robots: { index: false, follow: false },
};

export default async function StaffDataPage() {
  const report = await buildStaffServiceReport();

  if (!report) {
    return (
      <main className="staff-service-page min-h-screen bg-cream text-charcoal flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="type-heading-5">Hoja de servicio no disponible</h1>
          <p className="text-charcoal/70 text-sm">
            La configuración del plano aún no se ha inicializado. Contacta con los
            organizadores.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="staff-service-page min-h-screen bg-cream text-charcoal p-4 sm:p-8">
      <div className="staff-service-actions">
        <StaffServicePrintButton />
      </div>
      <StaffServiceReportView report={report} />
    </main>
  );
}
