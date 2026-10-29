import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { getFunctionErrorMessage } from '../utils/functionError'
import { STORE_REPORT_REASONS } from '../../supabase/functions/_shared/storeReportValidation'

const REASON_LABELS: Record<(typeof STORE_REPORT_REASONS)[number], string> = {
  scam_or_fake_store: 'Scam or fake store',
  prohibited_items: 'Prohibited items',
  misleading_information: 'Misleading information',
  impersonation: 'Impersonation',
  other: 'Other',
}

type Props = {
  storeId: string
  currentUserId?: string
  onRequireSignIn: () => void
}

export function StoreReportControl({ storeId, currentUserId, onRequireSignIn }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState<(typeof STORE_REPORT_REASONS)[number]>('scam_or_fake_store')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const openDialog = () => {
    if (!currentUserId) {
      onRequireSignIn()
      return
    }
    setErrorMessage('')
    setSubmitted(false)
    setDetails('')
    setReason('scam_or_fake_store')
    setIsOpen(true)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)
    try {
      const { error } = await supabase.functions.invoke('store-report', {
        body: { storeId, reason, details },
      })
      if (error) throw new Error(await getFunctionErrorMessage(error))
      setSubmitted(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Your report could not be submitted.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button type="button" className="boutique-report-button" onClick={openDialog}>
        {currentUserId ? 'Report store' : 'Sign in to report'}
      </button>
      {isOpen && (
        <div className="store-report-backdrop" onMouseDown={event => {
          if (event.currentTarget === event.target && !isSubmitting) setIsOpen(false)
        }}>
          <section
            className="store-report-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-report-title"
          >
            <header>
              <div>
                <p className="eyebrow">MarketSpace safety</p>
                <h2 id="store-report-title">{submitted ? 'Report received' : 'Report this store'}</h2>
              </div>
              <button type="button" aria-label="Close report dialog" disabled={isSubmitting} onClick={() => setIsOpen(false)}>×</button>
            </header>
            {submitted ? (
              <div className="store-report-success" role="status">
                <span className="material-icons">task_alt</span>
                <p>Thank you. The report has been sent to our moderation team for review.</p>
                <button type="button" className="boutique-primary-button" onClick={() => setIsOpen(false)}>Done</button>
              </div>
            ) : (
              <form onSubmit={event => void submit(event)}>
                <label>
                  Reason
                  <select value={reason} onChange={event => setReason(event.target.value as (typeof STORE_REPORT_REASONS)[number])}>
                    {STORE_REPORT_REASONS.map(option => <option key={option} value={option}>{REASON_LABELS[option]}</option>)}
                  </select>
                </label>
                <label>
                  Additional details <span>(optional)</span>
                  <textarea
                    value={details}
                    onChange={event => setDetails(Array.from(event.target.value).slice(0, 500).join(''))}
                    rows={4}
                    placeholder="Share helpful context for the moderation team."
                  />
                  <small>{Array.from(details).length}/500</small>
                </label>
                {errorMessage && <p className="store-report-error" role="alert">{errorMessage}</p>}
                <button type="submit" className="boutique-primary-button" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting…' : 'Submit report'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </>
  )
}
