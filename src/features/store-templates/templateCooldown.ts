const TEMPLATE_CHANGE_COOLDOWN_MONTHS = 6

export function getTemplateChangeAvailableAt(lastChangedAt?: string | null): Date | null {
  if (!lastChangedAt) return null

  const changedAt = new Date(lastChangedAt)
  if (!Number.isFinite(changedAt.getTime())) return null

  const targetMonthIndex = changedAt.getUTCMonth() + TEMPLATE_CHANGE_COOLDOWN_MONTHS
  const targetYear = changedAt.getUTCFullYear() + Math.floor(targetMonthIndex / 12)
  const targetMonth = targetMonthIndex % 12
  const targetDay = Math.min(
    changedAt.getUTCDate(),
    new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate(),
  )
  changedAt.setUTCFullYear(targetYear, targetMonth, targetDay)
  return changedAt
}
