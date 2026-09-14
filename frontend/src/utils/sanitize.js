// Centralized HTML sanitization using DOMPurify
// Always use this before passing HTML to `dangerouslySetInnerHTML`.
import DOMPurify from 'dompurify';

// Configure a conservative default: forbid unknown protocols, keep basic formatting and images.
const defaultConfig = {
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|data:image\/(?:png|jpeg|jpg|gif|webp);base64,)/i,
};

export function sanitize(html, config = {}) {
  if (!html) return '';
  try {
    return DOMPurify.sanitize(String(html), { ...defaultConfig, ...config });
  } catch {
    return '';
  }
}

export function sanitizeInline(html) {
  // Inline contexts (e.g., inside <p>): allow marks but no iframes/scripts.
  return sanitize(html);
}

export function sanitizeArticle(html) {
  // Article content may include headings, lists, images, basic tables.
  return sanitize(html);
}

export default sanitize;
