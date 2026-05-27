import { redirect } from 'next/navigation';

export default async function LegacyConversationThreadRedirect({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = await params;
  redirect(`/admin/bot/messages/${encodeURIComponent(phone)}`);
}
