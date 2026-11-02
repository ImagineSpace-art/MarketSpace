import { useState } from 'react'

type DestructiveActionDialogProps = {
  title: string
  description: string
  confirmLabel: string
  confirmationText?: string
  onCancel: () => void
  onConfirm: () => Promise<void>
}

export function DestructiveActionDialog({
  title,
  description,
  confirmLabel,
  confirmationText,
  onCancel,
  onConfirm,
}: DestructiveActionDialogProps) {
  const [typedConfirmation, setTypedConfirmation] = useState('')
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState('')
  const isConfirmationValid = !confirmationText
    || typedConfirmation.trim().toLowerCase() === confirmationText.trim().toLowerCase()

  const confirm = async () => {
    if (!isConfirmationValid || isWorking) return
    setIsWorking(true)
    setError('')
    try {
      await onConfirm()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'The action could not be completed.')
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className="store-lifecycle-backdrop" onMouseDown={() => !isWorking && onCancel()}>
      <section
        className="store-lifecycle-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="destructive-action-title"
        aria-describedby="destructive-action-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="material-icons store-lifecycle-dialog-icon" aria-hidden="true">warning</span>
        <h2 id="destructive-action-title">{title}</h2>
        <p id="destructive-action-description">{description}</p>
        {confirmationText && (
          <label className="store-lifecycle-delete-confirm" htmlFor="destructive-action-confirmation">
            Type <strong>{confirmationText}</strong> to confirm
            <input
              id="destructive-action-confirmation"
              value={typedConfirmation}
              onChange={(event) => setTypedConfirmation(event.target.value)}
              autoComplete="off"
              autoFocus
            />
          </label>
        )}
        {error && <p className="destructive-action-error" role="alert">{error}</p>}
        <div className="store-lifecycle-dialog-actions">
          <button type="button" className="secondary-btn" disabled={isWorking} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="danger-btn"
            disabled={isWorking || !isConfirmationValid}
            onClick={() => void confirm()}
            autoFocus={!confirmationText}
          >
            {isWorking ? 'Working…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
