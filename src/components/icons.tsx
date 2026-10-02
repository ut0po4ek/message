import { useId, type SVGProps } from 'react'

export type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  )
}

export function SendIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.4 20.4 20.85 12.9a1 1 0 0 0 0-1.84L3.4 3.6a1 1 0 0 0-1.39 1.17L3.9 11 13 12 3.9 13l-1.89 6.23a1 1 0 0 0 1.39 1.17Z" />
    </Icon>
  )
}

export function UserIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 10.5c4.4 0 8 2.24 8 5v1a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5v-1c0-2.76 3.6-5 8-5Z" />
    </Icon>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 4a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5a1 1 0 0 1 1-1Z" />
    </Icon>
  )
}

export function LogoutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 3a1 1 0 0 1 0 2H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4a1 1 0 1 1 0 2H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h4Zm6.3 4.3a1 1 0 0 1 1.4 0l4 4a1 1 0 0 1 0 1.4l-4 4a1 1 0 0 1-1.4-1.4l2.29-2.3H9a1 1 0 1 1 0-2h9.59l-2.3-2.3a1 1 0 0 1 0-1.4Z" />
    </Icon>
  )
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0-8a1 1 0 0 1 1 1v1.5a1 1 0 1 1-2 0V2a1 1 0 0 1 1-1Zm0 18.5a1 1 0 0 1 1 1V22a1 1 0 1 1-2 0v-1.5a1 1 0 0 1 1-1ZM23 12a1 1 0 0 1-1 1h-1.5a1 1 0 1 1 0-2H22a1 1 0 0 1 1 1ZM4.5 12a1 1 0 0 1-1 1H2a1 1 0 1 1 0-2h1.5a1 1 0 0 1 1 1Zm14.9-7.4a1 1 0 0 1 0 1.4l-1.06 1.06a1 1 0 1 1-1.41-1.41L18 4.6a1 1 0 0 1 1.4 0ZM6.47 17.53a1 1 0 0 1 0 1.41L5.4 20a1 1 0 0 1-1.4-1.4l1.06-1.07a1 1 0 0 1 1.41 0ZM19.4 19.4a1 1 0 0 1-1.4 0l-1.07-1.06a1 1 0 0 1 1.41-1.41L19.4 18a1 1 0 0 1 0 1.4ZM6.47 6.47a1 1 0 0 1-1.41 0L4 5.4A1 1 0 0 1 5.4 4l1.07 1.06a1 1 0 0 1 0 1.41Z" />
    </Icon>
  )
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.2 2.6a1 1 0 0 1 .2 1.1 7.5 7.5 0 0 0 9.9 9.9 1 1 0 0 1 1.3 1.3A9.5 9.5 0 1 1 9.1 2.4a1 1 0 0 1 1.1.2ZM7.9 5.2a7.5 7.5 0 1 0 10.9 10.9A9.5 9.5 0 0 1 7.9 5.2Z" />
    </Icon>
  )
}

export function BackIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M14.7 5.3a1 1 0 0 1 0 1.4L9.41 12l5.3 5.3a1 1 0 0 1-1.42 1.4l-6-6a1 1 0 0 1 0-1.4l6-6a1 1 0 0 1 1.42 0Z" />
    </Icon>
  )
}

export function EyeIcon({ crossed, ...props }: IconProps & { crossed?: boolean }) {
  return (
    <Icon {...props}>
      <path d="M12 5c4.6 0 8.3 3.1 9.8 6.6a1 1 0 0 1 0 .8C20.3 15.9 16.6 19 12 19s-8.3-3.1-9.8-6.6a1 1 0 0 1 0-.8C3.7 8.1 7.4 5 12 5Zm0 2c-3.4 0-6.3 2.2-7.8 5 1.5 2.8 4.4 5 7.8 5s6.3-2.2 7.8-5c-1.5-2.8-4.4-5-7.8-5Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
      {crossed && (
        <path d="M4.3 3.3a1 1 0 0 1 1.4 0l15 15a1 1 0 0 1-1.4 1.4l-15-15a1 1 0 0 1 0-1.4Z" />
      )}
    </Icon>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 16 11" {...props}>
      <path d="M14.7.3a1 1 0 0 1 0 1.4l-8.5 8.5a1 1 0 0 1-1.4 0L1.3 6.7a1 1 0 0 1 1.4-1.4l2.8 2.79L13.3.3a1 1 0 0 1 1.4 0Z" />
    </Icon>
  )
}

export function DoubleCheckIcon(props: IconProps) {
  return (
    <Icon viewBox="0 0 20 11" {...props}>
      <path d="M14.7.3a1 1 0 0 1 0 1.4l-8.5 8.5a1 1 0 0 1-1.4 0L1.3 6.7a1 1 0 0 1 1.4-1.4l2.8 2.79L13.3.3a1 1 0 0 1 1.4 0Z" />
      <path d="M19.2.3a1 1 0 0 1 0 1.4l-8.5 8.5a1 1 0 0 1-1.4 0l-.6-.6 1.4-1.42 L10 8.09 17.8.3a1 1 0 0 1 1.4 0Z" />
    </Icon>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 2a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm0 2a1 1 0 0 1 1 1v3.59l2.2 2.2a1 1 0 0 1-1.4 1.42l-2.5-2.5A1 1 0 0 1 11 12V8a1 1 0 0 1 1-1Z" />
    </Icon>
  )
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 13.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5ZM12 6a1 1 0 0 0-1 1v6a1 1 0 1 0 2 0V7a1 1 0 0 0-1-1Z" />
    </Icon>
  )
}

export function TelegramLogo(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="12" fill="#2aabee" />
      <path
        fill="#fff"
        d="M5.4 11.8c3.5-1.5 5.8-2.5 7-3 3.3-1.4 4-1.6 4.5-1.6.1 0 .3 0 .5.2.1.1.2.3.2.4v.5c-.2 2-1 6.8-1.4 9-.2.9-.5 1.2-.9 1.3-.8.1-1.4-.5-2.2-1l-3-2c-1.3-.9-.5-1.4.3-2.2.2-.2 3.6-3.3 3.7-3.6 0 0 0-.2-.1-.2h-.3c-.1 0-2 1.3-5.6 3.7-.5.4-1 .5-1.4.5-.5 0-1.4-.3-2.1-.5-.8-.3-1.5-.4-1.4-.9 0-.3.4-.5 1-.7Z"
      />
    </Icon>
  )
}

export function MaxLogo(props: IconProps) {
  const gradientId = useId()

  return (
    <Icon {...props}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3fb6ff" />
          <stop offset="0.55" stopColor="#5a5cf5" />
          <stop offset="1" stopColor="#9b3df0" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="12" fill={`url(#${gradientId})`} />
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M12 5.5a6.5 6.5 0 0 0-5.7 9.63l-.78 2.86a.4.4 0 0 0 .5.49l2.86-.79A6.5 6.5 0 1 0 12 5.5Zm0 2.8a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4Z"
      />
    </Icon>
  )
}

export function WhatsAppLogo(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="12" fill="#25d366" />
      <path
        fill="#fff"
        d="M12 5.2a6.8 6.8 0 0 0-5.84 10.3L5.2 18.8l3.4-.9A6.8 6.8 0 1 0 12 5.2Zm0 12.4a5.6 5.6 0 0 1-2.9-.8l-.2-.12-2 .53.53-1.97-.13-.2A5.6 5.6 0 1 1 12 17.6Zm3.1-4.2c-.17-.08-1-.5-1.15-.55-.15-.06-.27-.08-.38.08l-.53.66c-.1.12-.2.13-.37.04a4.6 4.6 0 0 1-2.3-2c-.17-.3.17-.28.5-.93.05-.12.03-.21-.02-.3l-.52-1.24c-.13-.33-.27-.28-.38-.29h-.32a.62.62 0 0 0-.45.21 1.9 1.9 0 0 0-.59 1.41 3.3 3.3 0 0 0 .69 1.75 7.5 7.5 0 0 0 2.9 2.55c1.07.46 1.5.5 2.03.42.33-.05 1-.41 1.14-.8.14-.4.14-.73.1-.8-.05-.08-.16-.12-.33-.2Z"
      />
    </Icon>
  )
}
