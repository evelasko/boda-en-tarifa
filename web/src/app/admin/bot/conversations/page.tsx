import { redirect } from 'next/navigation';

export default function LegacyConversationsRedirect() {
  redirect('/admin/bot/messages');
}
