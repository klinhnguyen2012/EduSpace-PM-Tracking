import test from 'node:test'
import assert from 'node:assert/strict'
// @ts-ignore Node's built-in TypeScript support runs this source file directly.
import { inviteCallbackPath, inviteSessionFromHash } from './auth-redirect.ts'

test('routes a dashboard invite code through the password setup callback', () => {
  assert.equal(
    inviteCallbackPath('?code=invite-code'),
    '/auth/callback?code=invite-code&next=%2Fauth%2Fset-password',
  )
})

test('does not redirect when there is no auth code', () => {
  assert.equal(inviteCallbackPath(''), null)
})

test('leaves callback URLs with an explicit next path alone', () => {
  assert.equal(inviteCallbackPath('?code=reset-code&next=%2Fauth%2Fset-password'), null)
})

test('extracts session tokens from a Supabase invite link fragment', () => {
  assert.deepEqual(
    inviteSessionFromHash('#access_token=invite-access&refresh_token=invite-refresh&type=invite'),
    { access_token: 'invite-access', refresh_token: 'invite-refresh' },
  )
})

test('ignores non-invite session fragments', () => {
  assert.equal(
    inviteSessionFromHash('#access_token=access&refresh_token=refresh&type=recovery'),
    null,
  )
})
