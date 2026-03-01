import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from './admin-auth';

/**
 * Extract the Bearer token from Authorization header or the firebase-auth-token cookie,
 * verify it belongs to an admin, and return the admin info.
 * Returns a NextResponse with the appropriate error if auth fails.
 */
export async function requireAdmin(request: NextRequest): Promise<
  | { ok: true; uid: string; email: string }
  | { ok: false; response: NextResponse }
> {
  const authHeader = request.headers.get('authorization');
  let idToken: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    idToken = authHeader.slice(7);
  } else {
    idToken = request.cookies.get('firebase-auth-token')?.value ?? null;
  }

  if (!idToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'No se proporcionó token de autenticación' },
        { status: 401 }
      ),
    };
  }

  try {
    const admin = await verifyAdmin(idToken);

    if (!admin.isAdmin) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'No tienes permisos de administrador' },
          { status: 403 }
        ),
      };
    }

    return { ok: true, uid: admin.uid, email: admin.email };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Token de autenticación inválido' },
        { status: 401 }
      ),
    };
  }
}
