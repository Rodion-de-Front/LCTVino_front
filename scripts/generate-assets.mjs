/**
 * Generates the artwork that is cheap to synthesise: user avatars and PWA
 * icons. Wine bottles are real CC0 photos in public/images/wines.
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
// Seeded users have photo avatars; this is the placeholder for fresh sign-ups.
write(out('images/avatars/guest.svg'), avatarSvg({ initials: 'V', hues: ['#722F37', '#C9A961'], seed: 1 }))

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

console.log('Generated avatars and PWA icons in /public.')
