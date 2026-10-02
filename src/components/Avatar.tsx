import styles from './Avatar.module.css'
import { UserIcon } from './icons'

const PALETTE = [
  ['#ff885e', '#ff516a'],
  ['#ffcd6a', '#ffa85c'],
  ['#82b1ff', '#665fff'],
  ['#a0de7e', '#54cb68'],
  ['#53edd6', '#28c9b7'],
  ['#72d5fd', '#2a9ef1'],
  ['#e0a2f3', '#d669ed'],
]

function hash(value: string): number {
  let result = 0
  for (const char of value) result = (result * 31 + char.charCodeAt(0)) >>> 0

  return result
}

function initials(title: string): string | null {
  const words = title
    .replace(/^@/, '')
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w))
  if (words.length === 0) return null

  return words
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

interface AvatarProps {
  id: string
  title: string
  size?: number
}

export function Avatar({ id, title, size = 54 }: AvatarProps) {
  const [from, to] = PALETTE[hash(id) % PALETTE.length]

  return (
    <span
      className={styles.avatar}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `linear-gradient(180deg, ${from}, ${to})`,
      }}
      aria-hidden="true"
    >
      {initials(title) ?? <UserIcon size={size * 0.55} />}
    </span>
  )
}
