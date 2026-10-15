import { useState, useEffect } from 'react'

/**
 * ImageWithLoader
 * Renders an image with a centered, semi-transparent loading spinner while
 * the image is loading over the network. Once loaded, the image smoothly fades in.
 */
export default function ImageWithLoader({
  src,
  alt = '',
  className = '',
  style = {},
  wrapperClassName = '',
  wrapperStyle = {},
  spinnerSize = 'sm',
  spinnerOpacity = 0.42,
  spinnerStyle = {},
  showSpinner = true,
  onLoad,
  onError,
  ...rest
}) {
  const [isLoaded, setIsLoaded] = useState(() => {
    if (typeof window === 'undefined' || !src) return false
    const probe = new Image()
    probe.src = src
    return probe.complete && probe.naturalWidth > 0
  })
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!src) {
      setIsLoaded(false)
      setHasError(false)
      return
    }

    const probe = new Image()
    probe.src = src
    if (probe.complete && probe.naturalWidth > 0) {
      setIsLoaded(true)
      setHasError(false)
    } else {
      setIsLoaded(false)
      setHasError(false)
    }
  }, [src])

  const handleLoad = (e) => {
    setIsLoaded(true)
    if (onLoad) onLoad(e)
  }

  const handleError = (e) => {
    setHasError(true)
    setIsLoaded(false)
    if (onError) onError(e)
  }

  if (!src || hasError) return null

  return (
    <div
      className={`image-with-loader-wrap ${wrapperClassName}`.trim()}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        ...wrapperStyle,
      }}
    >
      {!isLoaded && showSpinner && (
        <div
          className="image-loader-spinner-wrap"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 2,
            opacity: spinnerOpacity,
            transition: 'opacity 0.25s ease',
            ...spinnerStyle,
          }}
        >
          <div className={`spinner spinner-${spinnerSize}`} />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        style={{
          ...style,
          opacity: isLoaded ? (style?.opacity ?? undefined) : 0,
          transition: style?.transition || 'opacity 0.28s ease',
        }}
        onLoad={handleLoad}
        onError={handleError}
        {...rest}
      />
    </div>
  )
}
