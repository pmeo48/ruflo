'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
          <div className="text-center space-y-4">
            <div className="text-4xl">demo</div>
            <h1 className="text-2xl font-bold text-white">Etsy AI Business Platform</h1>
            <div className="bg-amber-900/40 border border-amber-600 rounded-lg p-3 text-amber-300 text-sm">
              Running in demo mode — authentication disabled
            </div>
            <p className="text-gray-400 text-sm">
              Set <code className="text-indigo-400">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code className="text-indigo-400">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{' '}
              <code className="text-indigo-400">.env.local</code> to enable auth.
            </p>
            <Button
              className="w-full"
              onClick={() => router.push('/')}
            >
              Continue to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/')
        router.refresh()
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setError('Check your email to confirm your account, then sign in.')
        setMode('signin')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700 text-white">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Etsy AI Business Platform</h1>
            <p className="text-gray-400 text-sm mt-1">
              {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-900/40 border border-red-600 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={loading}
            >
              {mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-400">
            {mode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null) }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(null) }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
