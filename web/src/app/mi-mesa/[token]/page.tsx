import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

/**
 * Redirect shim for the WhatsApp `seating_unlock` (T4) URL button.
 *
 * The Meta-approved template's URL is locked at submission time:
 *
 *   https://bodaentarifa.com/mi-mesa/%7B%7B3%7D%7D{{1}}
 *
 * `%7B%7B3%7D%7D` decodes to the literal four-character string `{{3}}`
 * — Meta's URL-button format only supports one dynamic placeholder
 * (`{{1}}`), so the encoded `{{3}}` is treated as fixed text in the
 * URL path, NOT as a second variable. After WhatsApp substitutes
 * `{{1}}` with our `seatingToken` (we send `String(tableNumber)`),
 * guests tap a link that lands here with a `token` param shaped like:
 *
 *   "3"          (table 3, if Meta strips the literal {{3}} — unlikely)
 *   "{{3}}3"     (most likely — browser decodes %7B%7B3%7D%7D to {{3}})
 *   "{{3}}10"    (two-digit table)
 *
 * We extract the trailing digits and redirect to the real diagram at
 * `/mesas/N`. If the token has no trailing digits, 404 — that means a
 * guest somehow opened a malformed URL we can't recover from.
 *
 * Why a redirect instead of changing the Meta template: re-submitting
 * the template requires Meta re-approval (hours to days) and would
 * have missed the 19:30 reveal window. The redirect is the
 * launch-day-safe fix.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mesa — Boda Enrique & Manuel',
  description: 'Plano de tu mesa.',
  robots: { index: false, follow: false },
};

function extractTableNumber(token: string): number | null {
  const match = token.match(/(\d+)$/);
  if (!match) return null;
  const n = Number.parseInt(match[1], 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export default async function MiMesaRedirect({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const tableNumber = extractTableNumber(token);
  if (tableNumber === null) {
    notFound();
  }
  redirect(`/mesas/${tableNumber}`);
}
