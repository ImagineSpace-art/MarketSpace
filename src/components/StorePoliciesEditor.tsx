import type { StorePolicy } from '../utils/storePolicies'
import { validateStorePolicies } from '../utils/storePolicies'

type StorePoliciesEditorProps = {
  policies: StorePolicy[]
  onChange: (policies: StorePolicy[]) => void
}

export function StorePoliciesEditor({ policies, onChange }: StorePoliciesEditorProps) {
  const error = validateStorePolicies(policies)
  const fieldStyle = {
    width: '100%',
    boxSizing: 'border-box' as const,
    minHeight: 42,
    padding: '10px 12px',
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'var(--surface)',
    color: 'var(--text)',
    font: 'inherit',
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '.84rem' }}>
        Add any policies that fit your store. Name each one yourself; customers will see them on your storefront.
      </p>
      {policies.map((policy, index) => (
        <fieldset key={policy.id} style={{ display: 'grid', gap: 8, padding: 12, border: '1px solid var(--border)', borderRadius: 10 }}>
          <legend>Policy {index + 1}</legend>
          <label style={{ display: 'grid', gap: 5 }}>
            <span>Policy name</span>
            <input
              value={policy.title}
              maxLength={80}
              placeholder="Name this policy"
              style={fieldStyle}
              onChange={event => onChange(policies.map(item => item.id === policy.id ? { ...item, title: event.target.value } : item))}
            />
          </label>
          <label style={{ display: 'grid', gap: 5 }}>
            <span>Policy details</span>
            <textarea
              value={policy.content}
              maxLength={2000}
              rows={3}
              placeholder="Explain the policy for your customers"
              style={{ ...fieldStyle, resize: 'vertical' }}
              onChange={event => onChange(policies.map(item => item.id === policy.id ? { ...item, content: event.target.value } : item))}
            />
          </label>
          <button type="button" className="secondary-btn" onClick={() => onChange(policies.filter(item => item.id !== policy.id))}>
            Remove policy
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        className="secondary-btn"
        disabled={policies.length >= 20}
        onClick={() => onChange([...policies, { id: crypto.randomUUID(), title: '', content: '' }])}
      >
        Add policy
      </button>
      {error && policies.length > 0 && <p role="alert" style={{ margin: 0, color: 'var(--danger)' }}>{error}</p>}
    </div>
  )
}
