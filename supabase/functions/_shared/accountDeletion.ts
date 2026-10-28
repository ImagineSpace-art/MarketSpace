export type AccountDeletionError = { message: string }
export type AccountDeletionEntry = { name: string; id?: string | null }
export type AccountDeletionPage = { data: AccountDeletionEntry[] | null; error: AccountDeletionError | null }

export type AccountDeletionOperations = {
  prepareAccountDeletion: (userId: string) => Promise<{ error: AccountDeletionError | null }>
  listPrivateFiles: (
    path: string,
    options: { limit: number; offset: number },
  ) => Promise<AccountDeletionPage>
  removePrivateFiles: (paths: string[]) => Promise<{ error: AccountDeletionError | null }>
  deleteAuthUser: (userId: string) => Promise<{ error: AccountDeletionError | null }>
}

const PAGE_SIZE = 100
const REMOVE_BATCH_SIZE = 100

async function listPrivateFilesRecursively(
  operations: AccountDeletionOperations,
  directory: string,
  files: string[],
) {
  let offset = 0
  while (true) {
    const { data, error } = await operations.listPrivateFiles(directory, { limit: PAGE_SIZE, offset })
    if (error || !data) throw new Error('Private account files could not be listed.')

    for (const entry of data) {
      if (!entry.name || entry.name === '.' || entry.name === '..' || /[\\/]/.test(entry.name)) {
        throw new Error('Private account storage contains an invalid file path.')
      }
      const path = `${directory}/${entry.name}`
      if (typeof entry.id === 'string') files.push(path)
      else await listPrivateFilesRecursively(operations, path, files)
    }

    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
}

export async function deleteAccountData(userId: string, operations: AccountDeletionOperations) {
  const { error: prepareError } = await operations.prepareAccountDeletion(userId)
  if (prepareError) throw new Error('Account data could not be prepared for deletion.')

  const files: string[] = []
  await listPrivateFilesRecursively(operations, userId, files)

  for (let start = 0; start < files.length; start += REMOVE_BATCH_SIZE) {
    const { error } = await operations.removePrivateFiles(files.slice(start, start + REMOVE_BATCH_SIZE))
    if (error) throw new Error('Private account files could not be deleted.')
  }

  const { error: deleteError } = await operations.deleteAuthUser(userId)
  if (deleteError) throw new Error('The authentication account could not be deleted.')
}
