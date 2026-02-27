import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-sm mx-4">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="type-heading-4 text-charcoal mb-2">Acceso Denegado</h1>
        <p className="text-charcoal/60 type-body-small mb-6">
          No tienes permisos para acceder a esta sección.
        </p>
        <Link
          href="/"
          className="inline-block bg-ocean text-white px-6 py-2 rounded-md hover:bg-ocean/90 transition-colors type-button"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
