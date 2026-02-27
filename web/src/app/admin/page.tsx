import { Users, CheckCircle, HelpCircle, XCircle } from 'lucide-react';

const summaryCards = [
  {
    title: 'Total Invitados',
    value: '—',
    icon: Users,
    color: 'bg-ocean/10 text-ocean',
  },
  {
    title: 'Confirmados',
    value: '—',
    icon: CheckCircle,
    color: 'bg-sage/10 text-sage',
  },
  {
    title: 'Pendientes',
    value: '—',
    icon: HelpCircle,
    color: 'bg-sand/10 text-sand',
  },
  {
    title: 'No Asisten',
    value: '—',
    icon: XCircle,
    color: 'bg-coral/10 text-coral',
  },
];

export default function AdminOverviewPage() {
  return (
    <div>
      <h1 className="type-heading-4 text-charcoal mb-6">Resumen</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white rounded-lg border border-charcoal/10 p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-md ${card.color}`}>
                  <Icon size={20} />
                </div>
                <span className="text-sm text-charcoal/60">{card.title}</span>
              </div>
              <p className="text-2xl font-bold text-charcoal">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg border border-charcoal/10 p-6 text-center text-charcoal/50">
        <p className="type-body-base">
          Las estadísticas en tiempo real estarán disponibles cuando se conecten los datos de RSVP.
        </p>
      </div>
    </div>
  );
}
