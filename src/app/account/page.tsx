import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/account/ProfileForm'
import { AvatarUpload } from '@/components/account/AvatarUpload'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import type { Profile } from '@/types'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/account')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/auth/login')

  const googleAvatar = (user.user_metadata?.avatar_url as string | null) ?? null

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-800">My Account</h1>
        <p className="text-gray-500 text-sm mt-1">{user.email}</p>
      </div>

      <div className="flex gap-4 mb-8 border-b border-pink-100 pb-4">
        <Link
          href="/account"
          className="text-sm font-medium text-gray-800 border-b-2 border-pink-200 pb-3"
        >
          Profile
        </Link>
        <Link
          href="/account/orders"
          className="text-sm font-medium text-gray-500 hover:text-gray-800 pb-3 transition-colors"
        >
          Orders
        </Link>
      </div>

      <Card>
        <div className="flex flex-col items-center mb-6">
          <AvatarUpload
            userId={user.id}
            currentAvatarUrl={(profile as Profile).avatar_url}
            defaultAvatarUrl={googleAvatar}
            displayName={(profile as Profile).full_name}
          />
          <p className="text-xs text-gray-400 mt-2">Click your photo to change it</p>
        </div>

        <h2 className="font-semibold text-gray-800 mb-5">Personal Information</h2>
        <ProfileForm profile={profile as Profile} />
      </Card>
    </div>
  )
}
