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

export function inviteSessionFromHash(hash: string): { access_token: string; refresh_token: string } | null {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  if (params.get('type') !== 'invite' || !accessToken || !refreshToken) return null

  return { access_token: accessToken, refresh_token: refreshToken }
}
