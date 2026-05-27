import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AvatarUpload } from '../AvatarUpload'

const BASE_PROPS = {
  userId: 'user-123',
  currentAvatarUrl: null,
  defaultAvatarUrl: null,
  displayName: null,
}

// next/image renders a plain <img> in tests
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}))

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AvatarUpload', () => {
  it('renders initials fallback when no avatar url is provided', () => {
    render(<AvatarUpload {...BASE_PROPS} displayName="Jane Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders ? initials when no display name is provided', () => {
    render(<AvatarUpload {...BASE_PROPS} />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders avatar image when currentAvatarUrl is provided', () => {
    render(
      <AvatarUpload
        {...BASE_PROPS}
        currentAvatarUrl="https://example.com/avatar.jpg"
        displayName="Jane Doe"
      />
    )
    const img = screen.getByRole('img', { name: 'Jane Doe' })
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
  })

  it('falls back to defaultAvatarUrl (Google picture) when no currentAvatarUrl', () => {
    render(
      <AvatarUpload
        {...BASE_PROPS}
        defaultAvatarUrl="https://lh3.googleusercontent.com/photo.jpg"
        displayName="Jane"
      />
    )
    const img = screen.getByRole('img', { name: 'Jane' })
    expect(img).toHaveAttribute('src', 'https://lh3.googleusercontent.com/photo.jpg')
  })

  it('currentAvatarUrl takes precedence over defaultAvatarUrl', () => {
    render(
      <AvatarUpload
        {...BASE_PROPS}
        currentAvatarUrl="https://example.com/uploaded.jpg"
        defaultAvatarUrl="https://lh3.googleusercontent.com/google.jpg"
        displayName="Jane"
      />
    )
    const img = screen.getByRole('img', { name: 'Jane' })
    expect(img).toHaveAttribute('src', 'https://example.com/uploaded.jpg')
  })

  it('clicking the avatar button triggers file input', async () => {
    const user = userEvent.setup()
    render(<AvatarUpload {...BASE_PROPS} displayName="Jane" />)

    const input = screen.getByTestId('avatar-file-input') as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click')

    await user.click(screen.getByRole('button', { name: /change profile picture/i }))
    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('shows success message and updates avatar on successful upload', async () => {
    const user = userEvent.setup()
    const newUrl = 'https://example.com/new-avatar.jpg'
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ url: newUrl }), { status: 200 })
    )

    render(<AvatarUpload {...BASE_PROPS} displayName="Jane" />)

    const input = screen.getByTestId('avatar-file-input') as HTMLInputElement
    const file = new File(['pixels'], 'photo.jpg', { type: 'image/jpeg' })
    await user.upload(input, file)

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('✓ Profile picture updated!')
    )

    expect(screen.getByRole('img', { name: 'Jane' })).toHaveAttribute('src', newUrl)
  })

  it('shows error message when upload fails', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'File too large (max 5 MB)' }), { status: 400 })
    )

    render(<AvatarUpload {...BASE_PROPS} displayName="Jane" />)

    const input = screen.getByTestId('avatar-file-input') as HTMLInputElement
    const file = new File(['pixels'], 'photo.jpg', { type: 'image/jpeg' })
    await user.upload(input, file)

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('File too large (max 5 MB)')
    )
  })

  it('disables the button while uploading', async () => {
    const user = userEvent.setup()
    let resolve: (v: Response) => void = () => {}
    vi.mocked(fetch).mockReturnValueOnce(
      new Promise<Response>((r) => { resolve = r })
    )

    render(<AvatarUpload {...BASE_PROPS} displayName="Jane" />)

    const input = screen.getByTestId('avatar-file-input') as HTMLInputElement
    const file = new File(['pixels'], 'photo.jpg', { type: 'image/jpeg' })
    const uploadPromise = user.upload(input, file)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /change profile picture/i })).toBeDisabled()
    )

    resolve(new Response(JSON.stringify({ url: 'https://example.com/a.jpg' }), { status: 200 }))
    await uploadPromise
  })
})
