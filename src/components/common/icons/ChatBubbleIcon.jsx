export default function ChatBubbleIcon({ size = 24, color = 'currentColor', className = '', style = {}, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0, ...style }}
      {...props}
    >
      <path
        d="M5.5 4.75h13A2.75 2.75 0 0 1 21.25 7.5v7A2.75 2.75 0 0 1 18.5 17.25h-6.36l-4.2 3.05a.9.9 0 0 1-1.44-.72v-2.33H5.5a2.75 2.75 0 0 1-2.75-2.75v-7A2.75 2.75 0 0 1 5.5 4.75Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M7.5 9.25h9M7.5 12.75h5.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
