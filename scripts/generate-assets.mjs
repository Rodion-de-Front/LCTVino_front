/**
 * Generates the offline-friendly artwork used across the app:
 * stylised bottle "photos", user avatars and PWA icons.
 *
 *   node scripts/generate-assets.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = (p) => resolve(root, 'public', p)

const ensure = (file) => mkdirSync(dirname(file), { recursive: true })
const write = (file, contents) => {
  ensure(file)
  writeFileSync(file, contents)
}

const PALETTES = {
  red: { glass: ['#5C262C', '#8B3A3A'], liquid: '#722F37', back: ['#F7E9E4', '#E7CFCB'] },
  white: { glass: ['#8E8A46', '#C2BE72'], liquid: '#E8DFA8', back: ['#FBF6E6', '#EDE7CF'] },
  rose: { glass: ['#C4737D', '#E2A0A6'], liquid: '#EFB4B8', back: ['#FDEEF0', '#F4D8DC'] },
  sparkling: { glass: ['#4E5A3C', '#7C8A60'], liquid: '#F0E2B0', back: ['#F6F2E4', '#E6E2CE'] },
}

/** A tall bottle silhouette rendered as an SVG "product shot". */
function bottleSvg({ type, label, year, seed }) {
  const p = PALETTES[type] ?? PALETTES.red
  const tilt = ((seed % 7) - 3) * 1.1
  const id = `b${seed}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" width="600" height="800">
  <defs>
    <linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${p.back[0]}"/><stop offset="1" stop-color="${p.back[1]}"/>
    </linearGradient>
    <radialGradient id="${id}glow" cx="50%" cy="22%" r="62%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${id}glass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${p.glass[0]}"/>
      <stop offset="0.42" stop-color="${p.glass[1]}"/>
      <stop offset="0.68" stop-color="${p.glass[0]}"/>
      <stop offset="1" stop-color="#2B1214"/>
    </linearGradient>
    <linearGradient id="${id}liq" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.liquid}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="${p.liquid}" stop-opacity="0.45"/>
    </linearGradient>
    <linearGradient id="${id}label" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FBF7F1"/><stop offset="1" stop-color="#EADFD2"/>
    </linearGradient>
    <filter id="${id}soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>

  <rect width="600" height="800" fill="url(#${id}bg)"/>
  <rect width="600" height="800" fill="url(#${id}glow)"/>
  <circle cx="${120 + (seed % 5) * 60}" cy="${640 - (seed % 3) * 40}" r="150" fill="#ffffff" opacity="0.28" filter="url(#${id}soft)"/>

  <g transform="translate(300 400) rotate(${tilt}) translate(-300 -400)">
    <ellipse cx="300" cy="712" rx="128" ry="26" fill="#5C262C" opacity="0.22" filter="url(#${id}soft)"/>
    <path d="M262 96 h76 v138 c0 34 62 72 62 154 v256 c0 34-24 56-58 56 h-84 c-34 0-58-22-58-56 V388 c0-82 62-120 62-154 z"
          fill="url(#${id}glass)"/>
    <path d="M262 96 h76 v40 h-76 z" fill="#2B1214" opacity="0.85"/>
    <path d="M254 132 h92 v56 h-92 z" fill="${p.glass[0]}" opacity="0.9"/>
    <path d="M232 470 h136 v168 c0 24-16 38-40 38 h-56 c-24 0-40-14-40-38 z" fill="url(#${id}liq)" opacity="0.55"/>
    <rect x="216" y="418" width="168" height="196" rx="10" fill="url(#${id}label)"/>
    <rect x="216" y="418" width="168" height="196" rx="10" fill="none" stroke="#C9A961" stroke-width="2.5" opacity="0.8"/>
    <text x="300" y="486" text-anchor="middle" font-family="Georgia, serif" font-size="46" fill="#722F37">${label}</text>
    <path d="M250 508 h100" stroke="#C9A961" stroke-width="2"/>
    <text x="300" y="548" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#6F615C" letter-spacing="3">${year}</text>
    <text x="300" y="586" text-anchor="middle" font-family="Georgia, serif" font-size="14" fill="#9A8C86" letter-spacing="4">VINORA</text>
    <path d="M276 150 c-14 60-26 96-26 150 v340" stroke="#ffffff" stroke-opacity="0.34" stroke-width="12" fill="none" stroke-linecap="round"/>
  </g>
</svg>`
}

function avatarSvg({ initials, hues, seed }) {
  const id = `a${seed}`
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${hues[0]}"/><stop offset="1" stop-color="${hues[1]}"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="100" fill="url(#${id})"/>
  <circle cx="${60 + (seed % 4) * 24}" cy="58" r="46" fill="#ffffff" opacity="0.18"/>
  <text x="100" y="126" text-anchor="middle" font-family="-apple-system, Inter, sans-serif"
        font-size="76" font-weight="600" fill="#ffffff" opacity="0.95">${initials}</text>
</svg>`
}

// ---------------------------------------------------------------- PNG icons
const crc32Table = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = crc32Table[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

/** Minimal RGBA PNG encoder — enough for flat, generated icons. */
function encodePng(size, painter) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = painter(x, y)
      const i = rowStart + 1 + x * 4
      raw[i] = r
      raw[i + 1] = g
      raw[i + 2] = b
      raw[i + 3] = a
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))

function iconPainter(size, maskable) {
  const cx = size / 2
  const pad = maskable ? size * 0.14 : 0
  const radius = size / 2 - pad
  return (x, y) => {
    const nx = x / size
    const ny = y / size
    const bg = mix([114, 47, 55], [43, 18, 20], (nx + ny) / 2)
    const dist = Math.hypot(x - cx, y - cx)
    if (!maskable && dist > radius * 1.02) return [...bg, 0]

    let color = mix(bg, [201, 169, 97], Math.max(0, 0.42 - Math.hypot(nx - 0.3, ny - 0.22)) * 1.1)

    // Glass bowl + stem, drawn analytically.
    const gx = x - cx
    const bowlY = size * 0.4
    const bowlR = size * 0.2
    const inBowl = Math.hypot(gx, y - bowlY) < bowlR && y > size * 0.24
    const inStem = Math.abs(gx) < size * 0.022 && y > bowlY + bowlR * 0.55 && y < size * 0.74
    const inFoot = Math.abs(gx) < size * 0.12 && y > size * 0.72 && y < size * 0.76
    if (inBowl || inStem || inFoot) {
      const fill = inBowl && y > bowlY - bowlR * 0.1 ? [230, 120, 130] : [255, 244, 238]
      color = mix(color, fill, inBowl && y > bowlY - bowlR * 0.1 ? 0.86 : 0.92)
    }
    return [...color, 255]
  }
}

// ---------------------------------------------------------------- run
const bottles = [
  ['cabernet', 'red', 'CS', 2019],
  ['saperavi', 'red', 'SP', 2020],
  ['pinot-noir', 'red', 'PN', 2021],
  ['merlot', 'red', 'ML', 2018],
  ['chardonnay', 'white', 'CH', 2022],
  ['riesling', 'white', 'RS', 2021],
  ['sauvignon', 'white', 'SB', 2022],
  ['rkatsiteli', 'white', 'RK', 2020],
  ['rose-provence', 'rose', 'RP', 2023],
  ['rose-crimea', 'rose', 'RC', 2022],
  ['prosecco', 'sparkling', 'PR', 2022],
  ['champagne', 'sparkling', 'CM', 2017],
]

bottles.forEach(([slug, type, label, year], i) =>
  write(out(`images/wines/${slug}.svg`), bottleSvg({ type, label, year, seed: i + 1 })),
)

const avatars = [
  ['anna', 'АК', ['#722F37', '#C9A961']],
  ['dmitry', 'ДС', ['#8B3A3A', '#D4A574']],
  ['elena', 'ЕМ', ['#5C262C', '#B0666C']],
  ['igor', 'ИВ', ['#42272B', '#8E6A4E']],
  ['maria', 'МЛ', ['#8B3A3A', '#E0C88C']],
  ['pavel', 'ПГ', ['#2B1214', '#722F37']],
  ['sofia', 'СР', ['#A14A55', '#D4A574']],
  ['guest', 'V', ['#722F37', '#C9A961']],
]

avatars.forEach(([slug, initials, hues], i) =>
  write(out(`images/avatars/${slug}.svg`), avatarSvg({ initials, hues, seed: i + 1 })),
)

write(out('icons/icon-192.png'), encodePng(192, iconPainter(192, false)))
write(out('icons/icon-512.png'), encodePng(512, iconPainter(512, false)))
write(out('icons/icon-maskable-512.png'), encodePng(512, iconPainter(512, true)))
write(out('apple-touch-icon.png'), encodePng(180, iconPainter(180, true)))

write(
  out('favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#722F37"/><stop offset="1" stop-color="#2B1214"/>
  </linearGradient></defs>
  <rect width="64" height="64" rx="16" fill="url(#g)"/>
  <path d="M22 16h20c0 12-4 17-8 19v12h6v3H24v-3h6V35c-4-2-8-7-8-19z" fill="#F5F0EB"/>
  <path d="M23.4 24h17.2c-1.6 6-4.6 9-8.6 10.2C28 33 25 30 23.4 24z" fill="#C9A961"/>
</svg>`,
)

console.log('Generated wine bottles, avatars and PWA icons in /public.')
