import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div>
      <h1 className="type-heading-4 text-charcoal mb-6">Notificaciones</h1>
      <div className="bg-white rounded-lg border border-charcoal/10 p-8 text-center">
        <Bell size={40} className="mx-auto text-charcoal/30 mb-3" />
        <p className="text-charcoal/60 type-body-base mb-1">
          Broadcasting de notificaciones push
        </p>
        <p className="text-charcoal/40 type-body-small">
          Enviar notificaciones y ver historial de envíos.
        </p>
      </div>
    </div>
  );
}
