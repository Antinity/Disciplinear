import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Disciplinear - Premium Habit Tracker",
  description: "Track habits, build consistency, record progress.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  let theme = "dark";
  let bgImage = "";
  let bgBlur = 0;
  let bgOpacity = 50;

  if (user) {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settings) {
      if (settings.theme) theme = settings.theme;
      if (settings.bg_image_url) bgImage = settings.bg_image_url;
      if (settings.bg_blur !== undefined) bgBlur = settings.bg_blur;
      if (settings.bg_opacity !== undefined) bgOpacity = settings.bg_opacity;
    }
  }

  return (
    <html lang="en" className={cn("h-full", theme === 'dark' ? 'dark' : '', "font-sans", geist.variable)}>
      <body className={`${inter.className} h-full antialiased`}>
        {bgImage && (
          <div 
            className="app-bg" 
            style={{ 
              backgroundImage: `url(${bgImage})`,
              filter: `blur(${bgBlur}px)`
            }} 
          />
        )}
        <div 
          className="app-bg-overlay"
          style={{
            opacity: bgImage ? bgOpacity / 100 : 1
          }}
        />
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
