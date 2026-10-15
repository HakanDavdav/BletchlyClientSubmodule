import MainLayout from './components/layout/MainLayout'
import useUIStore from './store/uiStore'
import useThemeStore from './store/themeStore'
import useAuthStore from './store/authStore'
import {
  applyCustomColorVars,
  clearCustomColorVars,
  resolveBaseColor,
} from './utils/themeColor'
import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import { Toaster, ToastBar, toast } from 'react-hot-toast'
import useIsMobile from './hooks/useIsMobile'
import InitProfileGuard from './components/auth/InitProfileGuard'
import { useTranslation } from 'react-i18next'
import ScrollToTop from './components/common/ScrollToTop'

// View (Page) Components placeholder importları
// Birazdan bunları oluşturacağız
import FeedPage from './pages/FeedPage'
import PostDetailPage from './pages/PostDetailPage'
import ProfilePage from './pages/ProfilePage'
import TribePage from './pages/TribePage'
import TribeSettingsPage from './pages/TribeSettingsPage'
import SearchPage from './pages/SearchPage'
import LeaderboardPage from './pages/LeaderboardPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import InitProfilePage from './pages/auth/InitProfilePage'
import AccountSettingsPage from './pages/AccountSettingsPage'
import ContentItemPage from './pages/ContentItemPage'
import CreateEditBotPage from './pages/bot/CreateEditBotPage'
import CreateTribePage from './pages/tribe/CreateTribePage'
import CreateEditPostPage from './pages/post/CreateEditPostPage'
import PersonalityCardPage from './pages/card/PersonalityCardPage'
import MarketplacePage from './pages/card/MarketplacePage'
import PersonalityCardHierarchyPage from './pages/card/PersonalityCardHierarchyPage'
import HierarchyPage from './pages/HierarchyPage'
import BasicConceptsPage from './pages/BasicConceptsPage'
import TribesPage from './pages/TribesPage'
import ActiveDebatesPage from './pages/ActiveDebatesPage'
import EnrichNewsPoolPage from './pages/news/EnrichNewsPoolPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage'
import TermsOfServicePage from './pages/legal/TermsOfServicePage'
import DebatePage from './pages/debate/DebatePage'
import DebateTranscriptPage from './pages/debate/DebateTranscriptPage'
import InvitationModal from './components/debate/InvitationModal'
import { useInvitationHub } from './hooks/useInvitationHub'

import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { initGA, trackPageView } from './utils/analytics'

const AdminApp = import.meta.env.VITE_IS_ADMIN_BUILD === 'true'
  ? lazy(() => import('./AdminApp'))
  : () => null

const MindPage = lazy(() => import('./pages/MindPage'))

// Mobilde toast'ı sağa/sola sürükleyip bırakınca kapatmayı sağlar.
function SwipeableToast({ toast: t, enabled, children }) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startXRef = useRef(null)

  const handlePointerDown = (event) => {
    if (!enabled) return
    startXRef.current = event.clientX
    setDragging(true)
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* yoksay */
    }
  }

  const handlePointerMove = (event) => {
    if (!enabled || startXRef.current == null) return
    setDragX(event.clientX - startXRef.current)
  }

  const handlePointerUp = () => {
    if (!enabled || startXRef.current == null) return
    const moved = dragX
    startXRef.current = null
    setDragging(false)
    if (Math.abs(moved) > 80) {
      toast.dismiss(t.id)
    } else {
      setDragX(0)
    }
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        display: 'flex',
        justifyContent: 'center',
        transform: dragX ? `translateX(${dragX}px)` : undefined,
        opacity: dragX ? Math.max(0.25, 1 - Math.abs(dragX) / 220) : 1,
        transition: dragging ? 'none' : 'transform 0.22s ease, opacity 0.22s ease',
        touchAction: enabled ? 'pan-y' : undefined,
      }}
    >
      {children}
    </div>
  )
}

export default function App() {
  const { t: translate } = useTranslation()
  const isMobile = useIsMobile()
  const { isDarkMode, isGreenMode, customColor } = useThemeStore()
  const { incomingInvitation, isInvitationModalOpen, openInvitationModal, closeInvitation } =
    useInvitationHub()
  const location = useLocation()
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn)
  const prevLoggedInRef = useRef(isLoggedIn)

  useEffect(() => {
    initGA()
  }, [])

  // Logout → varsayılan mavi; login → tarayıcıdaki tercih edilen renk.
  useEffect(() => {
    if (prevLoggedInRef.current === isLoggedIn) return
    prevLoggedInRef.current = isLoggedIn
    if (isLoggedIn) {
      useThemeStore.getState().restorePreferredColor()
    } else {
      useThemeStore.getState().resetToDefaultBlue()
    }
  }, [isLoggedIn])

  // Sayfa açılışında oturum varsa tercih edilen renk uygulanır (güvenlik).
  useEffect(() => {
    if (useAuthStore.getState().isLoggedIn) {
      useThemeStore.getState().restorePreferredColor()
    }
  }, [])

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    if (customColor) {
      applyCustomColorVars(customColor, isDarkMode)
    } else {
      clearCustomColorVars(isGreenMode)
    }

    const mainColor = resolveBaseColor(isGreenMode, customColor)
    const svgString = `<svg width="928" height="982" viewBox="110 20 710 880" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M488.218 24.5C500.92 24.5002 511.219 34.7975 511.219 47.5V47.5127L510.023 95.0996C539.002 97.0401 563.673 99.2554 581.126 100.989C586.146 101.488 590.569 101.947 594.326 102.348L595.792 102.505L594.999 102.987L595 102.988L598.48 103.525C615.633 106.245 629.093 109.512 642.314 114.866C656.324 120.539 670.065 128.556 687.647 140.745L687.797 140.591L688.122 140.252L688.48 140.555L688.481 140.556L688.516 140.584L688.514 140.588C688.52 140.592 688.525 140.595 688.527 140.597L688.536 140.603C688.532 140.6 688.522 140.594 688.514 140.588L688.517 140.585C688.525 140.592 688.536 140.601 688.546 140.609L688.554 140.616C688.555 140.617 688.556 140.618 688.557 140.618C688.559 140.62 688.561 140.622 688.562 140.623L688.273 140.967L688.564 140.625L688.565 140.626C688.565 140.626 688.567 140.628 688.568 140.629C688.569 140.629 688.57 140.629 688.571 140.63L688.572 140.632C699.1 149.611 708.622 159.454 716.867 170.457L717.661 171.525L717.671 171.538L717.679 171.551C729.872 190.482 739.158 213.706 747.234 242.486L796.974 241.489L797.188 241.484L797.34 241.638C809.466 253.944 813.967 263.868 817.528 278.5L817.87 279.932L817.883 279.982L817.884 280.035L818.002 285.891L818.003 285.959L817.986 286.024C816.042 293.628 813.858 299.439 810.797 304.804C807.435 310.695 803.038 316.007 796.826 322.537L796.683 322.688L796.474 322.692L752.5 323.573V356.927L752.42 357.05L752.335 357.183C752.267 357.288 752.199 357.392 752.134 357.495C752.124 359.315 752.049 361.114 751.754 362.786L751.753 362.791C750.242 370.893 748.433 378.642 746.348 386.051L746.345 386.062L746.341 386.073C746.029 387.008 745.714 387.945 745.394 388.881C739.422 408.081 731.249 423.671 720.014 438.919C718.338 441.528 716.566 444.089 714.698 446.599L714.666 446.647L714.458 446.959C714.326 447.157 714.195 447.355 714.064 447.553C713.338 448.654 712.5 449.664 711.581 450.648C708.183 454.943 704.621 459.08 700.898 463.062L701.062 463.134L700.068 463.946C699.78 464.251 699.49 464.555 699.199 464.857L699.105 466.524L698.013 466.081C693.81 470.39 689.411 474.51 684.811 478.437C684.703 478.543 684.555 478.693 684.435 478.812C684.401 478.866 684.367 478.922 684.332 478.978C684.29 479.045 684.248 479.112 684.205 479.18C684.164 479.244 684.124 479.309 684.082 479.374C684.062 479.406 684.04 479.438 684.02 479.47L683.78 479.836L683.628 479.764L683.595 479.795L683.385 479.989C682.881 480.455 682.377 480.93 681.87 481.411C681.284 481.968 680.696 482.533 680.103 483.103C677.65 485.458 675.12 487.89 672.424 490.043C671.209 491.013 669.978 491.959 668.74 492.888L668.741 492.889C661.528 498.761 654.189 503.947 646.726 508.528L646.707 508.539L646.688 508.549C599.302 532.387 541.627 540.49 483.839 542.003C470.066 542.782 456.293 543.562 442.52 544.341C428.746 545.12 414.972 545.9 401.199 546.679C384.297 547.626 368.04 551.362 352.423 557.88L352.424 557.881C350.934 558.506 349.443 559.127 347.95 559.749C347.079 560.112 346.206 560.476 345.333 560.841C334.469 565.379 325.316 572.2 317.868 581.325L317.867 581.326C310.398 590.456 304.919 600.65 301.408 611.918L300.748 614.047C296.793 626.749 294.811 639.751 294.811 653.05C294.806 671.46 294.803 689.869 294.801 708.279C294.798 726.689 294.795 745.1 294.79 763.51C294.79 768 295.841 771.728 297.912 774.723C299.983 777.718 303.102 780.02 307.308 781.612L308.102 781.905C316.318 784.862 324.764 785.625 333.417 784.196L343.789 782.476C359.744 779.832 375.82 778.44 391.995 778.29C431.805 777.91 471.616 777.54 511.426 777.17C532.994 776.97 554.034 773.528 574.545 766.864L577.901 765.771C579.382 765.289 580.86 764.808 582.334 764.324H582.336C597.619 759.362 610.522 750.803 621.032 738.652C631.552 726.512 638.143 712.516 640.808 696.677L641.857 690.437C644.807 672.876 644.569 655.366 641.141 637.896C637.715 620.451 630.615 604.651 619.852 590.492C619.753 590.363 619.655 590.233 619.557 590.104L618.978 589.346C618.819 589.138 618.661 588.93 618.503 588.723C618.053 588.133 617.603 587.542 617.153 586.952C616.314 585.848 615.549 584.761 614.858 583.692L614.516 583.161L614.999 582.988L614.986 582.973C614.98 582.964 614.972 582.956 614.968 582.95C614.96 582.941 614.955 582.933 614.947 582.924L614.909 582.877C614.878 582.839 614.838 582.79 614.79 582.73C614.651 582.557 614.444 582.296 614.169 581.949C613.847 581.542 613.433 581.015 612.93 580.366L612.9 580.329L612.88 580.287C612.672 579.883 612.476 579.481 612.291 579.081C612.056 578.919 611.825 578.76 611.6 578.601L611.537 578.557L611.49 578.495C609.414 575.775 606.446 571.801 602.666 566.523L602.281 565.986L602.902 565.762C612.936 562.128 625.149 556.389 635.367 551.153C640.582 548.481 645.279 545.941 648.902 543.881C652.384 541.901 654.88 540.36 655.891 539.573L655.98 539.503L656.092 539.479C656.136 539.47 656.174 539.458 656.206 539.447C656.302 539.413 656.423 539.36 656.566 539.29C656.855 539.148 657.242 538.932 657.715 538.65C658.661 538.087 659.956 537.258 661.517 536.222C664.639 534.149 668.831 531.246 673.442 527.97C682.538 521.508 693.273 513.591 700.688 507.733L700.998 507.488L701.309 507.733C708.143 513.136 717.638 524.995 725.572 535.975C729.599 541.546 733.224 546.89 735.896 551.046C737.231 553.124 738.329 554.905 739.119 556.269C739.514 556.95 739.832 557.529 740.065 557.987C740.298 558.445 740.444 558.784 740.498 558.988L740.82 558.469L741.209 559.315C748.487 575.159 754.11 592.196 758.026 609.808L758.4 611.514L758.401 611.521L758.403 611.528C758.676 613.011 758.941 614.503 759.208 616.004C759.424 617.22 759.642 618.442 759.865 619.67L759.919 619.964L759.937 620.062L759.915 620.159L759.852 620.452C759.85 620.457 759.849 620.462 759.848 620.467C759.96 621.118 760.077 621.771 760.197 622.426C760.258 622.758 760.319 623.09 760.382 623.423C760.634 624.767 760.896 626.12 761.161 627.481C761.302 628.207 761.444 628.936 761.585 629.666L762.001 631.861L762.004 631.872L762.005 631.884C765.329 655.791 765.607 680.265 762.728 703.84L762.727 703.846C762.187 707.847 761.588 711.834 760.981 715.798L760.98 715.807C757.794 734.498 752.551 752.453 745.188 768.904C739.259 782.895 732.451 795.317 724.876 806.344L724.866 806.357C720.695 812.005 716.173 817.39 711.29 822.47L711.283 822.478C692.527 841.226 673.967 855.303 654.973 865.768L654.96 865.774L654.946 865.781C614.286 885.113 566.553 890.739 517.641 892.202L517.642 892.203C506.348 892.807 495.033 893.122 483.701 893.149L376.813 893.396C366.153 893.943 355.733 894.762 345.631 895.977C337.92 896.905 308.084 897.411 275.69 897.164C243.308 896.918 208.292 895.919 190.149 893.83L186.222 893.84C183.967 893.84 181.926 893.256 180.104 892.087C179.088 891.78 178.281 891.439 177.799 891.032L177.794 891.028C177.675 890.926 177.609 890.793 177.571 890.704C177.529 890.603 177.494 890.487 177.464 890.366C177.41 890.152 177.364 889.881 177.32 889.562C176.08 887.936 175.481 886.03 175.521 883.86L176.817 818.055C177.248 796.211 177.679 774.368 178.109 752.524L178.101 748.146C178.096 745.949 178.091 743.752 178.086 741.556L178.013 736.901C177.928 732.266 177.809 727.691 177.651 723.203V723.18C178.496 652.363 186.093 598.484 201.668 557.435L201.675 557.417L201.684 557.399L201.798 557.155C202.068 556.58 202.337 556.008 202.601 555.437C204.591 551.125 206.722 546.845 209.142 542.664C210.598 539.853 212.134 537.073 213.746 534.325C214.942 531.884 216.237 529.475 217.729 527.181C220.158 523.449 222.826 519.851 225.45 516.312C226.412 515.015 227.367 513.725 228.305 512.438C230.299 509.702 232.411 506.9 235.172 504.174C236.379 502.754 237.607 501.348 238.854 499.958C239.028 499.728 239.23 499.504 239.461 499.285C239.689 499.033 239.918 498.779 240.148 498.527C240.902 497.462 241.882 496.429 243.114 495.345C243.278 495.172 243.443 495 243.608 494.827C243.697 494.734 243.786 494.641 243.875 494.548C244.678 493.3 245.726 492.055 246.994 490.83L247.305 490.53L247.448 490.641L247.55 490.516L247.675 490.361L247.756 490.35C247.911 490.169 248.085 489.998 248.266 489.839L249.937 488.368L250.056 488.262C251.586 486.594 253.343 484.937 255.384 483.221C255.414 483.151 255.447 483.081 255.483 483.014L255.58 482.849C255.813 482.475 256.106 482.182 256.333 481.975L256.989 481.374L257.209 481.174L257.223 481.178C257.641 480.704 258.171 480.315 258.779 480.04C258.976 479.864 259.17 479.742 259.311 479.668C259.546 479.545 259.785 479.467 259.995 479.415C263.544 476.152 267.221 473.088 271.007 470.208L271.026 470.193L271.047 470.181C291.108 457.782 314.693 448.808 342.071 442.25L344.732 441.623C349.503 440.483 354.31 439.462 359.149 438.561C367.356 436.966 375.874 435.55 384.708 434.289C409.766 430.398 434.959 427.671 460.29 426.121C468.4 425.622 476.509 425.123 484.619 424.625C494.982 423.988 505.345 423.352 515.708 422.716L515.9 422.704C533.285 421.637 550.672 420.57 568.061 419.501C579.975 418.776 590.974 415.212 601.062 408.827L602.002 408.222C611.641 401.903 619.22 393.668 624.741 383.511C624.767 383.463 624.793 383.415 624.819 383.367C625.244 382.584 625.666 381.814 626.079 381.035L626.081 381.03C632.69 368.867 636.781 355.919 638.344 342.163L639.063 335.793L639.209 334.455C640.637 320.634 639.822 306.927 636.763 293.35L636.762 293.349C636.662 292.9 636.563 292.46 636.463 292.021C633.504 278.881 628.623 266.486 621.839 254.851C621.514 254.291 621.188 253.734 620.863 253.177C620.538 252.619 620.213 252.061 619.888 251.501C614.41 242.107 607.372 234.074 598.764 227.404C590.181 220.757 580.519 216.601 569.784 214.954L547.374 211.504C521.631 207.538 495.747 205.66 469.704 205.85C457.596 205.94 445.489 206.027 433.383 206.115C423.35 206.188 413.318 206.262 403.284 206.336L403.283 206.335C401.24 206.433 399.707 206.506 398.773 206.535L398.04 206.55L396.852 206.548C396.834 206.548 396.816 206.548 396.798 206.548C396.024 206.547 395.25 206.545 394.476 206.544L393.275 206.542C392.488 206.541 391.7 206.539 390.913 206.538C362.77 207.729 341.24 215.423 326.25 229.557C311.265 243.686 302.75 264.315 300.764 291.514C300.93 294.057 301.13 296.655 301.354 299.299L301.355 299.309V299.318C302.786 330.946 304.059 364.095 303.29 387.137L303.288 387.178L303.28 387.219C300.076 403.149 293.237 417.054 280.06 426.616C277.483 428.943 274.741 431.107 271.834 433.102C269.386 434.783 269.39 436.464 264.492 438.146L264.493 438.146L264.369 438.231C262.621 439.434 260.871 440.636 259.122 441.838C259.083 441.865 259.042 441.891 259.003 441.918L259.004 441.919C258.304 442.4 257.604 442.881 256.903 443.362C239.133 455.552 222.767 469.409 207.802 484.913L207.803 484.914C207.411 485.326 207.007 485.737 206.609 486.146L206.61 486.146C204.578 488.254 202.666 490.041 200.883 491.511C199.697 493.055 198.527 494.629 197.377 496.231C197.088 496.633 196.568 497.554 195.868 498.798C195.461 499.521 194.999 500.342 194.499 501.206L194.485 501.23L194.468 501.254C192.459 503.962 190.41 506.797 188.313 509.769L188.278 509.819L188.231 509.859C187.467 510.516 186.659 511 185.85 511.092C184.987 511.189 184.216 510.833 183.602 510.021L183.5 509.888V323.11L137.528 324.033L137.313 324.037L137.162 323.884C124.645 311.181 120.253 301.016 116.632 285.591L116.619 285.539L116.618 285.486L116.5 279.631L116.499 279.562L116.516 279.497C118.46 271.894 120.644 266.082 123.705 260.718C127.067 254.826 131.464 249.515 137.676 242.985L137.819 242.834L138.028 242.83L183.272 241.922C183.091 238.05 183.072 234.191 183.223 230.348C183.199 230.16 183.176 229.972 183.154 229.785L183.151 229.753V229.721C183.152 229.65 183.153 229.58 183.154 229.51C183.154 229.502 183.154 229.495 183.154 229.487C183.156 229.378 183.158 229.269 183.159 229.16L183.266 221.854L183.745 222.693C184.047 219.592 184.457 216.5 184.977 213.418C184.978 213.389 184.981 213.361 184.982 213.333C184.985 213.295 184.987 213.259 184.989 213.223L184.991 213.194L184.996 213.166C185.44 210.659 185.919 208.202 186.429 205.796L186.43 205.792C187.524 200.837 188.728 196.088 190.038 191.537C190.132 191.163 190.222 190.809 190.315 190.438L190.605 189.308C193.645 177.661 198.267 166.68 204.462 156.342L205.067 155.346C211.367 145.092 219.102 136.052 228.276 128.229L228.277 128.229C229.13 127.506 229.982 126.78 230.837 126.052C231.565 125.432 232.296 124.81 233.027 124.188C234.262 123.136 235.514 122.111 236.779 121.115C245.775 113.464 255.708 107.486 266.278 102.53L266.295 102.522L266.312 102.516C278.373 97.9083 291.398 94.7959 305.198 92.7227L306.186 92.5742L305.998 92.9219H306C359.354 89.4513 416.419 90.2808 466.47 92.6182L465.245 70.5H380.065C367.363 70.5 357.065 60.2025 357.065 47.5C357.065 34.7975 367.363 24.5 380.065 24.5H488.218Z" fill="${mainColor}" />
  <path d="M388.625 262C402.813 262 414.249 274.438 414.249 289.695V339.218C414.249 354.475 402.813 366.913 388.625 366.913C374.437 366.913 363 354.475 363 339.218V289.695C363 274.438 374.437 262 388.625 262Z" fill="${mainColor}" />
  <path d="M539.371 262C553.559 262 564.995 274.438 564.995 289.695V339.218C564.995 354.475 553.559 366.913 539.371 366.913C525.183 366.913 513.747 354.475 513.747 339.218V289.695C513.747 274.438 525.183 262 539.371 262Z" fill="${mainColor}" />
</svg>`
    const encodedSvg = encodeURIComponent(svgString)
    let link = document.querySelector("link[rel*='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = `data:image/svg+xml,${encodedSvg}`
  }, [isGreenMode, customColor, isDarkMode])

  return (
    <>
      <ScrollToTop />
      <Toaster
        position={isMobile ? 'top-center' : 'top-right'}
        toastOptions={{ duration: 10000 }}
        containerStyle={
          isMobile ? { top: 'calc(env(safe-area-inset-top, 0px) + 12px)' } : undefined
        }
      >
        {(t) => {
          const bar = (
          <ToastBar
            toast={t}
            style={{
              ...t.style,
              display: 'flex',
              alignItems: t.traceId ? 'flex-start' : 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '10px',
              maxWidth: isMobile ? 'calc(100vw - 32px)' : '420px',
            }}
          >
            {({ icon }) => (
              <>
                {icon && (
                  <div style={{ marginTop: t.traceId ? '2px' : '0', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {icon}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 500, lineHeight: 1.4, wordBreak: 'break-word', color: 'inherit' }}>
                    {typeof t.message === 'function' ? t.message(t) : t.message}
                  </div>
                  {t.traceId && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        color: 'inherit',
                        opacity: 0.75,
                        background: 'rgba(128, 128, 128, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        userSelect: 'all',
                        width: 'fit-content',
                        maxWidth: '100%',
                        transition: 'opacity 0.15s ease',
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(t.traceId)
                        }
                      }}
                    >
                      <span style={{ fontWeight: 600, opacity: 0.85 }}>Trace:</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.traceId}</span>
                    </div>
                  )}
                </div>
                {t.type !== 'loading' && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'inherit',
                      cursor: 'pointer',
                      opacity: 0.5,
                      fontSize: '18px',
                      marginLeft: '4px',
                      padding: '0 4px',
                      lineHeight: 1,
                      marginTop: t.traceId ? '2px' : '0',
                      flexShrink: 0,
                    }}
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </ToastBar>
          )
          return isMobile ? (
            <SwipeableToast toast={t} enabled>
              {bar}
            </SwipeableToast>
          ) : (
            bar
          )
        }}
      </Toaster>
      <MainLayout pendingInvitation={incomingInvitation} onOpenInvitation={openInvitationModal}>
        <InitProfileGuard>
          <Routes>
            {import.meta.env.VITE_IS_ADMIN_BUILD === 'true' && (
              <>
                <Route path="/" element={<Navigate to="/admin/panel" replace />} />
                <Route
                  path="/admin/*"
                  element={
                    <Suspense fallback={null}>
                      <AdminApp />
                    </Suspense>
                  }
                />
              </>
            )}
            <Route path="/" element={<FeedPage />} />
            <Route path="/post" element={<PostDetailPage />} />
            <Route path="/entry" element={<ContentItemPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/tribe" element={<TribePage />} />
            <Route path="/tribe/settings" element={<TribeSettingsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/create-bot" element={<CreateEditBotPage />} />
            <Route path="/edit-bot" element={<CreateEditBotPage />} />
            <Route path="/create-tribe" element={<CreateTribePage />} />
            <Route path="/create-post" element={<CreateEditPostPage />} />
            <Route path="/edit-post" element={<CreateEditPostPage />} />
            <Route path="/init-profile" element={<InitProfilePage />} />
            <Route path="/account-settings" element={<AccountSettingsPage />} />
            <Route path="/hierarchy" element={<HierarchyPage />} />
            <Route path="/card-hierarchy" element={<PersonalityCardHierarchyPage />} />
            <Route path="/basic-concepts" element={<BasicConceptsPage />} />
            <Route
              path="/mind"
              element={
                <Suspense fallback={null}>
                  <MindPage />
                </Suspense>
              }
            />
            <Route path="/cards" element={<PersonalityCardPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/enrich-news" element={<EnrichNewsPoolPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/debate" element={<DebatePage />} />
            <Route path="/debate-transcript" element={<DebateTranscriptPage />} />
            <Route path="/tribes" element={<TribesPage />} />
            <Route path="/active-debates" element={<ActiveDebatesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </InitProfileGuard>
      </MainLayout>
      <InvitationModal
        invitation={isInvitationModalOpen ? incomingInvitation : null}
        onClose={closeInvitation}
      />
    </>
  )
}
