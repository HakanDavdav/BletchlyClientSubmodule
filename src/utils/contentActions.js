export function getEntryUrl(contentItemId) {
  return `${window.location.origin}/entry?contentItemId=${contentItemId}`
}

export function getPostUrl(contentItemId) {
  return `${window.location.origin}/post?postId=${contentItemId}`
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  return copied
}

export async function shareContent({ title, text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled'
    }
  }

  await copyText(url)
  return 'copied'
}


export function buildReportMessage({ contentItemId, contentType = 'entry', title = '' }) {
  const label = contentType === 'post' ? 'Post' : 'Entry'
  const lines = [
    'Hello,',
    '',
    `I would like to report the following ${label.toLowerCase()}.`,
    '',
    `${label} No: ${contentItemId}`,
  ]
  if (title) lines.push(`${label} Title: ${title}`)
  lines.push('', 'Reason for report:', '')
  return lines.join('\n')
}
