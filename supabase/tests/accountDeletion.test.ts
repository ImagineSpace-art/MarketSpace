import { describe, expect, it } from 'vitest'
import {
  deleteAccountData,
  type AccountDeletionOperations,
} from '../functions/_shared/accountDeletion'

function createOperations(overrides: Partial<AccountDeletionOperations> = {}) {
  const calls: string[] = []
  const operations: AccountDeletionOperations = {
    prepareAccountDeletion: async (userId) => {
      calls.push(`prepare:${userId}`)
      return { error: null }
    },
    listPrivateFiles: async (path) => {
      calls.push(`list:${path}`)
      if (path === 'owner-id') {
        return {
          data: [
            { name: 'avatar.jpg', id: 'avatar-id' },
            { name: 'identity', id: null },
          ],
          error: null,
        }
      }
      return { data: [{ name: 'id.jpg', id: 'id-image' }], error: null }
    },
    removePrivateFiles: async (paths) => {
      calls.push(`remove:${paths.join(',')}`)
      return { error: null }
    },
    deleteAuthUser: async (userId) => {
      calls.push(`delete:${userId}`)
      return { error: null }
    },
    ...overrides,
  }
  return { calls, operations }
}

describe('account deletion workflow', () => {
  it('prepares data, removes nested private files, then deletes the authenticated account', async () => {
    const { calls, operations } = createOperations()

    await deleteAccountData('owner-id', operations)

    expect(calls).toEqual([
      'prepare:owner-id',
      'list:owner-id',
      'list:owner-id/identity',
      'remove:owner-id/avatar.jpg,owner-id/identity/id.jpg',
      'delete:owner-id',
    ])
  })

  it('stops after account preparation fails', async () => {
    const { calls, operations } = createOperations({
      prepareAccountDeletion: async () => ({ error: { message: 'Database error' } }),
    })

    await expect(deleteAccountData('owner-id', operations)).rejects.toThrow(
      'Account data could not be prepared for deletion.',
    )
    expect(calls).toEqual([])
  })

  it('does not delete the auth user if private files cannot be listed or removed', async () => {
    const listFailure = createOperations({
      listPrivateFiles: async () => ({ data: null, error: { message: 'Storage error' } }),
    })
    await expect(deleteAccountData('owner-id', listFailure.operations)).rejects.toThrow(
      'Private account files could not be listed.',
    )
    expect(listFailure.calls).not.toContain('delete:owner-id')

    const removeFailure = createOperations({
      removePrivateFiles: async () => ({ error: { message: 'Storage error' } }),
    })
    await expect(deleteAccountData('owner-id', removeFailure.operations)).rejects.toThrow(
      'Private account files could not be deleted.',
    )
    expect(removeFailure.calls).not.toContain('delete:owner-id')
  })
})
