import { randomUUID } from 'node:crypto'

// Route local CLI requests to exactly one registered browser without enabling production endpoints.
export function spatialBridge () {
  return {
    name: 'vite-plugin-spatial-bridge',
    apply: 'serve',
    configureServer (server) {
      const clients = new Map()
      const pending = new Map()
      const rejectClient = client => {
        clients.delete(client)
        for (const [id, job] of pending) {
          if (job.client === client) {
            clearTimeout(job.timer)
            pending.delete(id)
            job.reply(503, { error: 'Browser disconnected' })
          }
        }
      }
      server.ws.on('spatial:ready', (_, client) => {
        if (!clients.has(client)) client.socket.once('close', () => rejectClient(client))
        clients.set(client, true)
      })
      server.ws.on('spatial:leave', (_, client) => rejectClient(client))
      server.ws.on('spatial:result', (message, client) => {
        const job = pending.get(message?.id)
        if (!job || job.client !== client) return
        clearTimeout(job.timer)
        pending.delete(message.id)
        job.reply(message.error ? 400 : 200, message.error ? { error: message.error } : { result: message.result })
      })
      server.middlewares.use('/__spatial', async (req, res) => {
        const reply = (status, payload) => {
          if (res.writableEnded || res.destroyed) return
          res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' })
          res.end(JSON.stringify(payload))
        }
        const address = req.socket.remoteAddress
        if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)) return reply(403, { error: 'Local connections only' })
        if (req.headers.origin || req.headers['sec-fetch-site']) return reply(403, { error: 'Use the local CLI, not browser fetch' })
        if (req.method !== 'POST') return reply(405, { error: 'Use POST' })
        if (!req.headers['content-type']?.startsWith('application/json')) return reply(415, { error: 'Expected application/json' })
        if (clients.size !== 1) return reply(503, { error: `Open exactly one scene tab; registered browsers: ${clients.size}` })
        try {
          let body = ''
          for await (const chunk of req) {
            body += chunk
            if (Buffer.byteLength(body) > 65536) return reply(413, { error: 'Request too large' })
          }
          const request = JSON.parse(body)
          const id = randomUUID()
          const client = clients.keys().next().value
          const timer = setTimeout(() => {
            pending.delete(id)
            reply(504, { error: 'Browser did not respond within 8 seconds' })
          }, 8000)
          pending.set(id, { client, reply, timer })
          client.send('spatial:request', { id, request })
        } catch (error) {
          reply(400, { error: error.message })
        }
      })
      server.httpServer?.once('close', () => {
        for (const job of pending.values()) clearTimeout(job.timer)
        pending.clear()
        clients.clear()
      })
    }
  }
}
