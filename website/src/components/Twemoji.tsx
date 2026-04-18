'use client';

import twemoji from 'twemoji';
import { useMemo } from 'react';

export default function Twemoji({ emoji, className = "w-[1em] h-[1em]" }: { emoji: string; className?: string }) {
  const html = useMemo(() => {
    return {
      __html: twemoji.parse(emoji, {
        folder: 'svg',
        ext: '.svg',
        base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'
      }),
    };
  }, [emoji]);

  return (
    <span
      className={`inline-flex items-center justify-center twemoji-container ${className}`}
      dangerouslySetInnerHTML={html}
    />
  );
}
