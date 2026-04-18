import { login, signup } from './actions'

export const metadata = {
  title: 'Login - Disciplinear',
}

export default async function LoginPage(props: { searchParams: Promise<{ message: string }> }) {
  const searchParams = await props.searchParams;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black -z-10" />
      
      <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <div className="w-4 h-4 bg-white rounded-sm" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-zinc-400 mt-2 text-sm">Enter your details to track your habits</p>
        </div>

        <form className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="email">Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5" htmlFor="password">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          {searchParams?.message && (
            <p className="mt-2 text-sm text-red-400 text-center bg-red-400/10 py-2.5 rounded-lg border border-red-500/20">
              {searchParams.message}
            </p>
          )}

          <div className="flex flex-col gap-3 mt-4">
            <button 
              formAction={login}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
            >
              Sign In
            </button>
            <button 
              formAction={signup}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98]"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
