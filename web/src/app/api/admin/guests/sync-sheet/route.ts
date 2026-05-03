import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api-auth';
import { WorkspaceServiceAccountIntegrityError } from '@/lib/google-sheets-delegated';
import { syncGuestsFromSheet } from '@/lib/sheet-guest-sync';

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;

  let dryRun = false;
  try {
    const body = (await request.json()) as { dryRun?: boolean };
    dryRun = Boolean(body?.dryRun);
  } catch {
    dryRun = false;
  }

  try {
    const result = await syncGuestsFromSheet({ dryRun });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error syncing guests from Google Sheet:', error);
    if (error instanceof WorkspaceServiceAccountIntegrityError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Error al sincronizar la hoja';
    const missingConfig =
      message.includes('not set') &&
      !message.includes('GOOGLE_WORKSPACE_SERVICE_ACCOUNT_KEY');
    return NextResponse.json(
      { error: message },
      { status: missingConfig ? 503 : 500 }
    );
  }
}
