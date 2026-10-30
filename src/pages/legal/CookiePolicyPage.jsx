import { Cookie } from 'lucide-react'
import { Link } from 'react-router-dom'
import BackButton from '../../components/common/BackButton'
import LegalContactInfo from '../../components/common/LegalContactInfo'

export default function CookiePolicyPage() {
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
          <Cookie size={22} color="#fff" />
        </div>
        <div>
          <h1
            style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}
          >
            Cookie Policy
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            How we use cookies and similar technologies
          </p>
        </div>
      </div>

      <div
        className="cookie-policy-content"
        style={{
          backgroundColor: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl, 16px)',
          padding: '36px 44px',
          boxShadow: 'var(--shadow-sm)',
          overflowX: 'auto',
          zoom: 0.95,
        }}
      >
        <style>{`
          .cookie-policy-content { color: var(--color-text-secondary); }
          .cookie-policy-content h2 {
            margin: 28px 0 10px;
            font-size: 18px;
            font-weight: 700;
            color: var(--color-text);
            letter-spacing: -0.01em;
          }
          .cookie-policy-content h2:first-of-type { margin-top: 0; }
          .cookie-policy-content p,
          .cookie-policy-content li {
            margin: 0 0 10px;
            font-size: 14px;
            line-height: 1.7;
            color: var(--color-text-secondary);
          }
          .cookie-policy-content ul { margin: 0 0 14px; padding-left: 22px; }
          .cookie-policy-content li { margin-bottom: 6px; }
          .cookie-policy-content a { color: var(--color-primary); font-weight: 600; text-decoration: none; }
          .cookie-policy-content a:hover { text-decoration: underline; }
          .cookie-policy-content .cookie-updated {
            margin: 0 0 20px;
            font-size: 16px;
            font-weight: 500;
            line-height: 24px;
            color: var(--color-text-muted);
          }
          .cookie-policy-content table {
            width: 100%;
            margin: 12px 0 22px;
            border-collapse: collapse;
            font-size: 13px;
            line-height: 1.55;
          }
          .cookie-policy-content th,
          .cookie-policy-content td {
            padding: 9px 11px;
            border: 1px solid var(--color-border);
            text-align: left;
            vertical-align: top;
          }
          .cookie-policy-content th {
            background: var(--color-surface-2);
            color: var(--color-text);
            font-weight: 700;
          }
          .cookie-policy-content td { color: var(--color-text-secondary); }
          .cookie-policy-content code {
            padding: 1px 5px;
            border-radius: 5px;
            background: var(--color-surface-2);
            color: var(--color-text);
            font-size: 12px;
            white-space: nowrap;
          }
          @media (max-width: 640px) {
            .cookie-policy-content { padding: 24px 18px !important; }
            .cookie-policy-content table { font-size: 12px; }
            .cookie-policy-content th,
            .cookie-policy-content td { padding: 7px 8px; }
          }
        `}</style>

        <p className="cookie-updated">Last updated October 30, 2026</p>

        <p>
          This Cookie Policy explains how Bletchly uses cookies, local storage, session storage, and
          similar technologies when you use our website and services. It should be read together
          with our <Link to="/privacy">Privacy Policy</Link> and{' '}
          <Link to="/terms">Terms of Service</Link>.
        </p>

        <h2>1. What Are Cookies and Similar Technologies?</h2>
        <p>
          Cookies are small text files stored on your device by a website. We also use browser
          storage such as localStorage and sessionStorage. These technologies help the Service
          remember your choices, keep you signed in, protect your session, and understand how the
          Service is used. Some storage is essential to operate Bletchly; optional analytics storage
          is used only when you grant consent.
        </p>

        <h2>2. Your Cookie Choices</h2>
        <p>
          When you first visit Bletchly, a cookie banner asks you to accept or reject optional
          cookies. If you select <strong>Accept All</strong>, we may load Google Analytics 4 and use
          analytics cookies. If you select <strong>Reject</strong>, analytics scripts are not loaded
          and analytics storage remains disabled. Strictly necessary storage remains active because
          the Service cannot work without it. You can change your choice later by clearing Bletchly
          site data in your browser and reloading the page.
        </p>

        <h2>3. Strictly Necessary and Functional Storage</h2>
        <p>
          The following browser storage is used to provide the features you request. It is not used
          for advertising or cross-site tracking.
        </p>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Purpose</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ASP.NET Core authentication cookie (for example, <code>.AspNetCore.Identity.Application</code>)</td>
              <td>HTTP cookie (HttpOnly)</td>
              <td>Authenticates your session and keeps you signed in. The cookie is set by our backend and is not readable by client-side JavaScript.</td>
              <td>Session or until it expires; removed when you log out.</td>
            </tr>
            <tr>
              <td><code>bletchly-auth</code></td>
              <td>localStorage</td>
              <td>Stores frontend login and profile state, including profile completion and admin status. The actual authenticated session is maintained by the authentication cookie above.</td>
              <td>Until you log out or clear browser data.</td>
            </tr>
            <tr>
              <td><code>theme-storage</code></td>
              <td>localStorage</td>
              <td>Remembers dark mode, theme color, and appearance preferences.</td>
              <td>Until cleared.</td>
            </tr>
            <tr>
              <td><code>ui-store-storage</code></td>
              <td>sessionStorage</td>
              <td>Remembers temporary interface state such as open panels, drawers, and ambience toggles during a browser session.</td>
              <td>Until the tab or browser session ends.</td>
            </tr>
            <tr>
              <td><code>bletchly_recent_searches</code></td>
              <td>localStorage</td>
              <td>Stores your recent searches so you can return to them.</td>
              <td>Up to 30 days, or until cleared.</td>
            </tr>
            <tr>
              <td><code>memoryMapView.*</code></td>
              <td>localStorage</td>
              <td>Remembers Memory Map view settings such as label visibility, graph lock, spacing, and lazy rendering.</td>
              <td>Until cleared.</td>
            </tr>
            <tr>
              <td><code>bletchly_cookie_consent</code></td>
              <td>localStorage</td>
              <td>Records your cookie consent choice so the banner does not ask again.</td>
              <td>Until cleared.</td>
            </tr>
            <tr>
              <td><code>bletchly_bot_creator_ack</code></td>
              <td>localStorage</td>
              <td>Remembers that you acknowledged creator responsibility when creating a bot.</td>
              <td>Until cleared.</td>
            </tr>
          </tbody>
        </table>

        <h2>4. Analytics Cookies</h2>
        <p>
          If you accept optional cookies, we use Google Analytics 4, provided by Google LLC, to
          understand aggregate usage and improve the Service. Google Analytics may set cookies such
          as <code>_ga</code> and <code>_ga_&lt;container-id&gt;</code>. These cookies help
          distinguish users and sessions and may collect information such as pages viewed,
          approximate location derived from IP address, device and browser information, and
          interaction events such as page views, account actions, content creation, debate actions,
          and checkout initiation. Analytics cookies are not loaded when you reject optional
          cookies. Google's use of information is governed by Google's privacy policy.
          <code>_ga</code> cookies typically expire after up to two years, unless you clear them
          sooner; retention may be adjusted in our analytics settings.
        </p>

        <h2>5. Third-Party Sign-In and Payments</h2>
        <p>
          If you choose to sign in with Google or Microsoft, the provider opens its own
          authentication flow and may use cookies or similar storage on its domain. We receive
          authentication and profile information according to the permissions you grant.
        </p>
        <p>
          If you start a Premium checkout, you are redirected to Lemon Squeezy's hosted payment page.
          Lemon Squeezy may use its own cookies and similar technologies to process payments, prevent
          fraud, and comply with legal obligations. Those cookies are controlled by Lemon Squeezy and are
          subject to Lemon Squeezy's cookie and privacy policies.
        </p>

        <h2>6. Hosting, Security, and Infrastructure</h2>
        <p>
          Our hosting, content delivery, and security providers may process technical request
          information such as IP address, browser type, requested URL, and timestamps, and may set
          strictly necessary security cookies to deliver the Service and protect it from abuse.
          These providers act as service providers and are not used by us for advertising.
        </p>

        <h2>7. Advertising and Cross-Site Tracking</h2>
        <p>
          We do not currently deploy advertising pixels or third-party marketing cookies on
          Bletchly. If we introduce advertising or other optional tracking in the future, we will
          update this Cookie Policy and request consent where required.
        </p>

        <h2>8. Managing Cookies</h2>
        <p>
          You can control cookies and browser storage through your browser settings. You can delete
          existing cookies and site data, block cookies, or configure your browser to notify you
          when cookies are set. If you block strictly necessary storage, you may be unable to log in
          or use parts of the Service. To reset your Bletchly consent choice, clear this site's data
          and reload the page; the cookie banner will appear again.
        </p>

        <h2>9. Changes to This Cookie Policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes in our practices,
          technologies, or legal requirements. The "Last updated" date at the top shows when this
          policy was last revised. Material changes will be posted on this page.
        </p>

        <h2>10. Contact Us</h2>
        <p>
          If you have questions about this Cookie Policy or our use of cookies, please contact us
          at:
        </p>
        <LegalContactInfo />
        <p style={{ marginTop: 12 }}>
          You can also reach us through our <Link to="/contact">Contact page</Link>.
        </p>
      </div>
    </div>
  )
}
