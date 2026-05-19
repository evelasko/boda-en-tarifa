import {
  type ServiceDishCounts,
  type StaffServiceReport,
} from '@/lib/staff-service-report';
import {
  CAPTAIN_BADGE,
  CAPTAIN_BADGE_CAPTION,
  GIFT_BADGE,
  GIFT_BADGE_CAPTION,
} from '@/types/seating-layout';

interface StaffServiceReportProps {
  report: StaffServiceReport;
}

function formatCounts(counts: ServiceDishCounts): string {
  return [
    `C ${counts.meat}`,
    `P ${counts.fish}`,
    `V ${counts.vegetarian}`,
    `Niños ${counts.children}`,
    counts.captains > 0 ? `Cap. ${counts.captains}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

function formatGeneratedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const STAT_ITEMS: Array<{ key: keyof ServiceDishCounts; label: string }> = [
  { key: 'meat', label: 'Carne' },
  { key: 'fish', label: 'Pescado' },
  { key: 'vegetarian', label: 'Vegetariano' },
  { key: 'children', label: 'Menú infantil' },
  { key: 'captains', label: 'Capitanes' },
];

export default function StaffServiceReportView({ report }: StaffServiceReportProps) {
  return (
    <article className="staff-service-report">
      <ReportBanner generatedAt={report.generatedAt} />

      <section aria-labelledby="service-stats-heading">
        <h2 id="service-stats-heading" className="sr-only">
          Resumen de platos
        </h2>
        <StatsGrid counts={report.counts} />
      </section>

      <section aria-labelledby="tables-heading">
        <h2 id="tables-heading" className="type-heading-6 mb-4">
          Por mesa
        </h2>
        {report.tables.map((table) => (
          <TableSection key={table.tableNumber} table={table} />
        ))}
      </section>

      {report.unassigned.length > 0 ? (
        <section className="staff-service-unassigned" aria-labelledby="unassigned-heading">
          <h2 id="unassigned-heading">Sin asiento en el plano ({report.unassigned.length})</h2>
          <ul>
            {report.unassigned.map((guest) => (
              <li key={guest.uid}>
                {guest.fullName}
                <span className="text-charcoal/60"> — {guest.reason.replaceAll('_', ' ')}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function ReportBanner({ generatedAt }: { generatedAt: string }) {
  return (
    <div className="staff-service-report__banner" role="doc-title">
      <h1 className="staff-service-report__title type-heading-4">
        Hoja de servicio — banquete
      </h1>
      <p className="staff-service-report__meta mt-1">
        Boda Enrique &amp; Manuel · Generado {formatGeneratedAt(generatedAt)}
      </p>
      <p className="staff-service-report__meta mt-2 text-xs">
        {CAPTAIN_BADGE} {CAPTAIN_BADGE_CAPTION} · {GIFT_BADGE} {GIFT_BADGE_CAPTION}
      </p>
    </div>
  );
}

function StatsGrid({ counts }: { counts: ServiceDishCounts }) {
  return (
    <div className="staff-service-report__stats">
      {STAT_ITEMS.map(({ key, label }) => (
        <div key={key} className="staff-service-stat">
          <div className="staff-service-stat__value">{counts[key]}</div>
          <div className="staff-service-stat__label">{label}</div>
        </div>
      ))}
    </div>
  );
}

function TableSection({ table }: { table: StaffServiceReport['tables'][number] }) {
  return (
    <section className="staff-service-table" aria-labelledby={`table-${table.tableNumber}`}>
      <TableHeader table={table} />
      <GuestTable table={table} />
    </section>
  );
}

function TableHeader({ table }: { table: StaffServiceReport['tables'][number] }) {
  return (
    <div className="staff-service-table__heading">
      <h3 id={`table-${table.tableNumber}`} className="staff-service-table__name">
        Mesa {table.tableNumber}
        {table.tableName ? (
          <span className="font-normal text-charcoal/70"> — {table.tableName}</span>
        ) : null}
      </h3>
      <p className="staff-service-table__counts">{formatCounts(table.counts)}</p>
    </div>
  );
}

function GuestTable({ table }: { table: StaffServiceReport['tables'][number] }) {
  return (
    <table className="staff-service-guest-table">
      <thead>
        <tr>
          <th scope="col" className="col-seat">
            Asiento
          </th>
          <th scope="col">Invitado</th>
          <th scope="col" className="col-course">
            Plato
          </th>
          <th scope="col">Restricciones</th>
          <th scope="col" className="col-flags">
            Notas
          </th>
        </tr>
      </thead>
      <tbody>
        {table.guests.map((guest) => (
          <tr key={`${table.tableNumber}-${guest.seatNumber}-${guest.fullName}`}>
            <td className="col-seat">{guest.seatNumber}</td>
            <td>{guest.fullName}</td>
            <td className="col-course">{guest.mainCourse}</td>
            <td>
              {guest.dietaryRestrictions ? (
                <span className="staff-service-dietary">{guest.dietaryRestrictions}</span>
              ) : (
                <span className="text-charcoal/35">—</span>
              )}
            </td>
            <td className="col-flags">
              {guest.isCaptain ? (
                <span className="staff-service-flag" title="Capitán de mesa">
                  {CAPTAIN_BADGE}
                </span>
              ) : null}
              {guest.isChild ? (
                <span className="staff-service-flag" title="Menú infantil / regalo">
                  {GIFT_BADGE}
                </span>
              ) : null}
              {!guest.isCaptain && !guest.isChild ? (
                <span className="text-charcoal/35">—</span>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
