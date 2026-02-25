import type { Plugin } from 'vite'
import type { IncomingMessage } from 'http'

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000'

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

export function apiPlugin(): Plugin {
  return {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`)

        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
          res.writeHead(200)
          res.end()
          return
        }

        try {
          const backendPath = `${BACKEND_URL}/api${url.pathname}${url.search}`
          const body = ['POST', 'PUT', 'PATCH'].includes(req.method || '')
            ? await readBody(req)
            : undefined

          const backendRes = await fetch(backendPath, {
            method: req.method || 'GET',
            headers: { 'Content-Type': 'application/json' },
            body,
          })

          const data = await backendRes.text()
          res.writeHead(backendRes.status, { 'Content-Type': 'application/json' })
          res.end(data)
        } catch (error: any) {
          console.error('[api-plugin] Backend proxy error:', error.message)
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: `Backend unreachable at ${BACKEND_URL}` }))
        }
      })
    },
  }
}
