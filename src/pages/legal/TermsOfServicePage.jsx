import React from 'react'
import { FileText } from 'lucide-react'
import BackButton from '../../components/common/BackButton'
import termsHtml from '../../../TermsOfService?raw'

export default function TermsOfServicePage() {
  const cleanHtml = React.useMemo(() => {
    if (!termsHtml) return ''
    return termsHtml
      // 1. Remove top Powered by Termly logo
      .replace(/<span style="[^"]*data:image\/svg\+xml[^"]*"><\/span>/gi, '')
      // 2. Remove redundant "TERMS OF SERVICE" title above Last updated
      .replace(/<div>\s*<strong>[\s\S]*?data-custom-class=['"]title['"][\s\S]*?<\/div>/gi, '')
      .replace(/<div[^>]*data-custom-class=['"]title['"][^>]*>[\s\S]*?<\/div>/gi, '')
      .replace(/<h1[^>]*>[\s\S]*?TERMS OF (?:SERVICE|USE)[\s\S]*?<\/h1>/gi, '')
      // 3. Spacing below Last updated
      .replace(/(?:<div><br><\/div>\s*){2,}/gi, '<div style="height: 24px;"></div>')
      // 4. Remove bottom "This Terms and Conditions was created using Termly's..." attribution
      .replace(/<br>\s*<div><span[^>]*>This Terms (?:and Conditions|of Service) was created using Termly's[\s\S]*?<\/div>/gi, '')
      .replace(/<div><span[^>]*>This Terms (?:and Conditions|of Service) was created using Termly's[\s\S]*?<\/div>/gi, '')
  }, [])

  return (
    <div className="flex-col gap-4 legal-page-container">
      {/* Back Button */}
      <div className="flex items-center gap-3 px-2" style={{ marginBottom: 16 }}>
        <BackButton style={{ marginBottom: 0 }} />
      </div>

      {/* Header */}
      <div className="page-header-row">
        <div className="page-header-icon">
          <FileText size={22} color="#fff" />
        </div>
        <div>
          <h1 className="page-header-title">Terms of Service</h1>
          <p className="page-header-subtitle">User Agreement & Legal Terms</p>
        </div>
      </div>

      {/* Content - Raw Termly HTML */}
      <div
        className="termly-raw-content legal-content-card"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    </div>
  )
}
