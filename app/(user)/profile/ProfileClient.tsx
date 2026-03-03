'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, User, Phone, Calendar, Shield, Eye, EyeOff } from 'lucide-react'

interface UserData {
  id: string
  name: string
  phone: string
  dob: string
  password: string | null
  batch_id: string | null
  created_at: string
  batches?: { name: string; start_date: string } | null
}

export default function ProfileClient({ user }: { user: UserData }) {
  const router = useRouter()
  const [name, setName] = useState(user.name)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  const hasCustomPassword = !!user.password

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword && newPassword.length < 4) {
      toast.error('Password must be at least 4 characters')
      return
    }

    setSaving(true)
    try {
      const body: Record<string, string> = {}
      if (name !== user.name) body.name = name
      if (newPassword) body.password = newPassword

      if (Object.keys(body).length === 0) {
        toast('No changes to save')
        return
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to save'); return }
      toast.success('Profile updated!')
      setNewPassword('')
      setConfirmPassword('')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-900">My Profile</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* First login prompt */}
        {!hasCustomPassword && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm font-medium text-amber-800">Set up your password</p>
            <p className="text-xs text-amber-600 mt-0.5">You&apos;re currently using your date of birth as your password. Set a custom password below for better security.</p>
          </div>
        )}

        {/* Avatar + Info Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-green-700 text-2xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
          <p className="text-sm text-gray-500">{user.batches?.name || 'No batch assigned'}</p>
          {user.batches?.start_date && (
            <p className="text-xs text-gray-400 mt-1">
              Batch started {new Date(user.batches.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Account Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Account Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Phone size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Phone Number</p>
                <p className="text-sm font-medium text-gray-900">{user.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Shield size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Password</p>
                <p className="text-sm font-medium text-gray-900">
                  {hasCustomPassword ? 'Custom password set' : 'Using date of birth (default)'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Calendar size={16} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Member Since</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Edit Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><User size={13} /> Display Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Shield size={13} />
                  {hasCustomPassword ? 'Change Password' : 'Set Password'}
                </span>
              </label>
              <p className="text-xs text-gray-400 mb-2">
                {hasCustomPassword
                  ? 'Enter a new password to change it. Leave blank to keep current.'
                  : 'Create a password to replace your date of birth login. Minimum 4 characters.'}
              </p>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPassword && (
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                )}
                {newPassword && newPassword.length > 0 && newPassword.length < 4 && (
                  <p className="text-xs text-red-500">Password must be at least 4 characters</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
