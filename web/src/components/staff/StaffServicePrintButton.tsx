'use client';

export default function StaffServicePrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md border border-charcoal/20 bg-white px-4 py-2 text-sm font-medium text-charcoal shadow-sm hover:bg-charcoal/5"
    >
      Imprimir hoja de servicio
    </button>
  );
}
