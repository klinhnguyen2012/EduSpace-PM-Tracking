import type { ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'

const URL_REGEX = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g

function formatDisplayUrl(url: string, maxLen = 34): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    
    // Tên nhãn thân thiện cho các dịch vụ phổ biến nếu muốn ngắn gọn
    if (host.includes('docs.google.com')) {
      if (parsed.pathname.includes('/document/')) return 'docs.google.com/document/…'
      if (parsed.pathname.includes('/spreadsheets/')) return 'docs.google.com/sheets/…'
      return 'docs.google.com/…'
    }

    const path = parsed.pathname === '/' ? '' : parsed.pathname
    const display = `${host}${path}`
    if (display.length > maxLen) {
      return `${display.slice(0, maxLen)}…`
    }
    return display
  } catch {
    return url.length > maxLen ? `${url.slice(0, maxLen)}…` : url
  }
}

/**
 * Tự động chuyển đổi các đường dẫn http/https trong văn bản thành hyperlink bấm được.
 */
export function renderWithLinks(content: string, compact = false): ReactNode {
  if (!content) return null

  // Tách văn bản theo các URL
  const parts = content.split(URL_REGEX)
  if (parts.length === 1) return content

  return parts.map((part, index) => {
    // Kiểm tra xem part có phải là URL không
    if (/^https?:\/\//i.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-hyperlink"
          title={`Mở: ${part}`}
          onClick={(event) => event.stopPropagation()}
        >
          <span>{compact ? formatDisplayUrl(part) : part}</span>
          <ExternalLink size={11} className="inline-link-icon" aria-hidden="true" />
        </a>
      )
    }
    return part
  })
}

