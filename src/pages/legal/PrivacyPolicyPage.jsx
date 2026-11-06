import React from 'react'
import { FileText } from 'lucide-react'
import BackButton from '../../components/common/BackButton'
import privacyHtml from '../../../PrivacyPolicy?raw'

export default function PrivacyPolicyPage() {
  const cleanHtml = React.useMemo(() => {
    if (!privacyHtml) return ''
    return privacyHtml
      .replace(/<span style="[^"]*data:image\/svg\+xml[^"]*"><\/span>/gi, '')
      .replace(/<div>\s*<strong>[\s\S]*?data-custom-class=['"]title['"][\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*data-custom-class=['"]title['"][^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<h1[^>]*>[\s\S]*?PRIVACY POLICY[\s\S]*?<\/h1>/gi, '')
      .replace(/(?:<div><br><\/div>\s*){2,}/gi, '<div style="height: 24px;"></div>')
      .replace(/<br>\s*<div><span[^>]*>This Privacy Policy was created using Termly's[\s\S]*?<\/div>/gi, '')
      .replace(/<div><span[^>]*>This Privacy Policy was created using Termly's[\s\S]*?<\/div>/gi, '')
  }, [])

  return (
    <div
      className="flex-col gap-4"
      style={{ paddingBottom: 60, maxWidth: 980, margin: '0 auto', width: '100%' }}
    >
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 16,
          paddingBottom: 24,
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="page-header-icon">
          <FileText size={22} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            Privacy Policy
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Official Legal Notice
          </p>
        </div>
      </div>

      <style>{`
        .termly-raw-content [data-custom-class='title'],
        .termly-raw-content [data-custom-class="title"] {
          display: none !important;
        }

        .termly-raw-content,
        .termly-raw-content [data-custom-class='body'],
        .termly-raw-content [data-custom-class='body'] * {
          color: var(--color-text) !important;
        }

        .termly-raw-content [data-custom-class='body_text'],
        .termly-raw-content [data-custom-class='body_text'] * {
          color: var(--color-text-secondary) !important;
        }

        .termly-raw-content [data-custom-class='subtitle'],
        .termly-raw-content [data-custom-class='subtitle'] * {
          color: var(--color-text-muted) !important;
          font-size: 16px !important;
          font-weight: 500 !important;
        }

        .termly-raw-content [data-custom-class='heading_1'],
        .termly-raw-content [data-custom-class='heading_2'],
        .termly-raw-content h1,
        .termly-raw-content h2,
        .termly-raw-content h3 {
          color: var(--color-text) !important;
        }

        .termly-raw-content a,
        .termly-raw-content [data-custom-class='link'],
        .termly-raw-content [data-custom-class='link'] * {
          color: var(--color-primary) !important;
        }

        .termly-raw-content table,
        .termly-raw-content th,
        .termly-raw-content td {
          border-color: var(--color-border) !important;
        }

        .termly-raw-content th {
          background-color: var(--color-surface-2) !important;
          color: var(--color-text) !important;
        }

        .termly-raw-content h1 { margin: 0.67em 0 !important; font-weight: bold !important; }
        .termly-raw-content h2 { margin: 0.83em 0 !important; font-weight: bold !important; }
        .termly-raw-content h3 { margin: 1em 0 !important; font-weight: bold !important; }
        .termly-raw-content ul { margin: 1em 0 !important; padding-left: 40px !important; list-style-type: disc !important; }
        .termly-raw-content p { margin: 1em 0 !important; }
        .termly-raw-content li { margin-bottom: 0.5em !important; }
      `}</style>

      <div
        className="termly-raw-content"
        style={{
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl, 16px)',
          padding: '36px 44px',
          boxShadow: 'var(--shadow-sm)',
          overflowX: 'auto',
          zoom: 0.95,
        }}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    </div>
  )
}
