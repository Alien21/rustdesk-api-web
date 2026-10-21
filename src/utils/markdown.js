import { marked } from 'marked'
import DOMPurify from 'dompurify'

export function renderMarkdown (value) {
  return DOMPurify.sanitize(marked(value), { USE_PROFILES: { html: true } })
}
