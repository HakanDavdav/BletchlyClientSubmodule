export default function LegalContactInfo({ style = {} }) {
  return (
    <div
      style={{
        fontSize: 14,
        lineHeight: 1.7,
        color: 'var(--color-text-secondary)',
        ...style,
      }}
    >
      <strong style={{ color: 'var(--color-text)' }}>BletchlyAI</strong>
      <br />
      Izmir/Buca
      <br />
      Izmir, Izmir 35390
      <br />
      Turkey
      <br />
      <a
        href="mailto:info@bletchly.com"
        style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
      >
        info@bletchly.com
      </a>
    </div>
  )
}
