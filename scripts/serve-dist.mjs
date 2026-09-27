import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer, request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { extname, join, normalize, resolve } from 'node:path'
import { URL } from 'node:url'

const root = resolve('dist')
const port = Number(process.env.PORT || 80)
const backend = new URL(process.env.BACKEND_URL || 'http://backend:3000')

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
}

function sendFile(res, file) {
  const ext = extname(file)
  res.setHeader('Content-Type', types[ext] || 'application/octet-stream')
  if (file.endsWith('/sw.js') || file.endsWith('/manifest.webmanifest')) {
    res.setHeader('Cache-Control', 'no-cache')
  }
  createReadStream(file).pipe(res)
}

function staticFile(urlPath) {
  const safePath = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '')
  const candidate = resolve(root, `.${safePath}`)
  if (!candidate.startsWith(root)) return null
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  return join(root, 'index.html')
}

function proxyApi(req, res) {
  const target = new URL(req.url || '/', backend)
  const proxy = (target.protocol === 'https:' ? httpsRequest : httpRequest)(
    target,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: backend.host,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers)
      proxyRes.pipe(res)
    },
  )

  proxy.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ message: 'Backend is unavailable' }))
  })

  req.pipe(proxy)
}

createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost')
  if (url.pathname.startsWith('/api/')) {
    proxyApi(req, res)
    return
  }

  sendFile(res, staticFile(url.pathname))
}).listen(port, '0.0.0.0', () => {
  console.log(`Serving PWA on http://0.0.0.0:${port}`)
})
