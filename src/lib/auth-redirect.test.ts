import test from 'node:test'
import assert from 'node:assert/strict'
// @ts-ignore Node's built-in TypeScript support runs this source file directly.
import { inviteCallbackPath } from './auth-redirect.ts'

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
