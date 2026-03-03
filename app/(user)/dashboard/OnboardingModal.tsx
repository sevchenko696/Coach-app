'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { X, ChevronRight, ChevronLeft, Sparkles, BookOpen, Shield, Eye, EyeOff } from 'lucide-react'

interface Props {
  userName: string
  userId: string
  onClose: () => void
}

export default function OnboardingModal({ userName, userId, onClose }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSetPassword() {
    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (password && password.length < 4) {
      toast.error('Password must be at least 4 characters')
      return
    }

    if (password) {
      setSaving(true)
      try {
        const res = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        if (!res.ok) { toast.error('Failed to set password'); return }
        toast.success('Password set successfully!')
      } finally {
        setSaving(false)
      }
    }
    handleComplete()
  }

  function handleComplete() {
    localStorage.setItem('healeasy_onboarded', 'true')
    onClose()
    router.refresh()
  }

  function handleSkip() {
    handleComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleSkip} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-5">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? 'w-6 bg-green-600' : s < step ? 'w-6 bg-green-200' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="p-6 pt-4">
          {step === 1 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Welcome, {userName.split(' ')[0]}!
              </h2>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                You&apos;re about to begin the <span className="font-medium text-gray-700">L1 10+2 Day Detox Program</span> — a guided journey to cleanse, reset, and rejuvenate your body over 12 days.
              </p>
              <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                Each day unlocks new content, recordings, and diet guidance curated just for you.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BookOpen size={28} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">How It Works</h2>
              <div className="mt-4 space-y-3 text-left">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Daily Live Session</p>
                    <p className="text-xs text-gray-500">Join Zoom at 8:30 AM every morning</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Unlock Content Daily</p>
                    <p className="text-xs text-gray-500">Notes and recordings unlock each day</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Track Your Progress</p>
                    <p className="text-xs text-gray-500">Check in daily, share reviews, earn your certificate</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield size={28} className="text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Secure Your Account</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Set a custom password instead of using your date of birth.
                </p>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="New password (min 4 chars)"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {password && (
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                )}
                {password && password.length > 0 && password.length < 4 && (
                  <p className="text-xs text-red-500">Password must be at least 4 characters</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-6 pb-6 flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <div className="flex-1" />
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              Next <ChevronRight size={16} />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-400 hover:text-gray-600 px-3 py-2.5 font-medium"
              >
                Skip
              </button>
              <button
                onClick={handleSetPassword}
                disabled={saving}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
              >
                {saving ? 'Saving...' : password ? 'Set Password & Start' : 'Get Started'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
