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
    <div className="flex-col gap-4 legal-page-container">
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      <div className="page-header-row">
        <div className="page-header-icon">
          <FileText size={22} color="#fff" />
        </div>
        <div>
          <h1 className="page-header-title">Privacy Policy</h1>
          <p className="page-header-subtitle">Official Legal Notice</p>
        </div>
      </div>

      <div
        className="termly-raw-content legal-content-card"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    </div>
  )
}
