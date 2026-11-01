export function inviteCallbackPath(search: string): string | null {
  const params = new URLSearchParams(search)
  const code = params.get('code')
  if (!code || params.has('next')) return null

  const callbackParams = new URLSearchParams({
    code,
    next: '/auth/set-password',
  })
  return `/auth/callback?${callbackParams.toString()}`
}
