'use client';

import { useState, useTransition } from 'react';
import { saveSettings } from '@/app/dashboard/actions';
import { useRouter } from 'next/navigation';

export default function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [theme, setTheme] = useState(initialSettings.theme || 'dark');
  const [bgImage, setBgImage] = useState(initialSettings.bg_image_url || '');
  const [bgBlur, setBgBlur] = useState(initialSettings.bg_blur || 0);
  const [bgOpacity, setBgOpacity] = useState(initialSettings.bg_opacity || 50);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await saveSettings({
        theme,
        bg_image_url: bgImage,
        bg_blur: Number(bgBlur),
        bg_opacity: Number(bgOpacity),
      });
      // apply theme manually to bypass refresh flash if needed
      document.documentElement.setAttribute('data-theme', theme);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 glass-panel p-6 sm:p-10 rounded-[24px]">
      {/* Theme */}
      <div>
        <h3 className="text-[17px] font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">Theme Mode</h3>
        <div className="flex glass-input rounded-[12px] p-1">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex-1 py-2 text-[15px] font-semibold rounded-[10px] transition-all shadow-sm ${
              theme === 'dark' ? 'bg-[#1c1c1e] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-none'
            }`}
          >
            Dark Mode
          </button>
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex-1 py-2 text-[15px] font-semibold rounded-[10px] transition-all shadow-sm ${
              theme === 'light' ? 'bg-white text-black' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-none'
            }`}
          >
            Light Mode
          </button>
        </div>
      </div>

      {/* Background Image Setup */}
      <div>
        <h3 className="text-[17px] font-bold text-[var(--text-primary)] mb-1.5">Custom Background URL</h3>
        <p className="text-[13px] text-[var(--text-muted)] mb-3">Paste an image URL to be your dashboard backdrop.</p>
        <input
          type="url"
          value={bgImage}
          onChange={(e) => setBgImage(e.target.value)}
          placeholder="https://images.unsplash.com/photo-..."
          className="w-full glass-input border border-[var(--border-subtle)] rounded-[14px] px-4 py-3.5 text-[16px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)] transition-colors"
        />
      </div>

      {/* Visual Sliders */}
      <div className="grid sm:grid-cols-2 gap-8">
        <div>
          <label className="flex justify-between text-[14px] font-bold text-[var(--text-secondary)] mb-3">
            Background Blur <span className="text-[var(--accent-color)]">{bgBlur}px</span>
          </label>
          <input
            type="range" min="0" max="64"
            value={bgBlur}
            onChange={(e) => setBgBlur(e.target.value)}
            className="w-full accent-[var(--accent-color)]"
          />
        </div>
        <div>
          <label className="flex justify-between text-[14px] font-bold text-[var(--text-secondary)] mb-3">
            Overlay Opacity <span className="text-[var(--accent-color)]">{bgOpacity}%</span>
          </label>
          <input
            type="range" min="0" max="100"
            value={bgOpacity}
            onChange={(e) => setBgOpacity(e.target.value)}
            className="w-full accent-[var(--accent-color)]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[var(--accent-color)] hover:opacity-90 text-white font-bold text-[17px] py-3.5 rounded-[14px] transition-all shadow-md active:scale-[0.98] disabled:opacity-50 mt-6"
      >
        {isPending ? 'Saving Preferences...' : 'Save Settings'}
      </button>
    </form>
  );
}
