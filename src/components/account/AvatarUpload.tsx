'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl: string | null
  defaultAvatarUrl: string | null
  displayName: string | null
}

export function AvatarUpload({
  currentAvatarUrl,
  defaultAvatarUrl,
  displayName,
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    currentAvatarUrl ?? defaultAvatarUrl
  )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = displayName
    ? displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setSuccess(false)

    const form = new FormData()
    form.append('avatar', file)

    const res = await fetch('/api/upload-avatar', { method: 'POST', body: form })
    const json = await res.json()

    setUploading(false)

    if (!res.ok) {
      setError(json.error ?? 'Upload failed')
    } else {
      setAvatarUrl(json.url)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }

    // reset so the same file can be re-selected if needed
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-label="Change profile picture"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="group relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-pink-100 focus-visible:outline-none focus-visible:ring-pink-300 disabled:opacity-60 cursor-pointer"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName ?? 'Profile picture'}
            fill
            sizes="96px"
            className="object-cover"
            unoptimized={avatarUrl.startsWith('blob:')}
          />
        ) : (
          <span
            aria-hidden
            className="flex items-center justify-center w-full h-full bg-pink-200 text-pink-700 text-2xl font-bold"
          >
            {initials}
          </span>
        )}

        {/* hover overlay */}
        <span
          aria-hidden
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {uploading ? (
            <svg
              className="w-6 h-6 text-white animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <>
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-white text-xs mt-1">Change</span>
            </>
          )}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileChange}
        className="sr-only"
        aria-hidden
        data-testid="avatar-file-input"
      />

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="text-sm text-green-600">
          ✓ Profile picture updated!
        </p>
      )}
    </div>
  )
}
