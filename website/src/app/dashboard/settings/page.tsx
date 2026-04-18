import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import SettingsForm from './SettingsForm';

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch settings safely
  const { data: settingsData } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const settings = settingsData || {
    theme: 'dark',
    bg_image_url: '',
    bg_blur: 0,
    bg_opacity: 50,
  };

  return (
    <div className="w-full max-w-2xl">
      <header className="mb-10">
        <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight mb-2">Settings</h1>
        <p className="text-[var(--text-secondary)] text-lg">Customize your UI and tracking experience.</p>
      </header>

      <section className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl p-8">
        <SettingsForm initialSettings={settings} />
      </section>
    </div>
  );
}
