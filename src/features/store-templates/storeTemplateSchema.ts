import {
  STORE_TEMPLATE_SLOT_SCHEMAS,
  type StoreTemplateId,
} from '../../../supabase/functions/_shared/storeTemplateSchema'

export * from '../../../supabase/functions/_shared/storeTemplateSchema'

export function getStoreTemplateSlots(templateId: StoreTemplateId) {
  return Object.entries(STORE_TEMPLATE_SLOT_SCHEMAS[templateId]).map(([id, slot]) => ({
    id,
    ...slot,
  }))
}
