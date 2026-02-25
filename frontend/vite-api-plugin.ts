import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import { getTutors, getTutees, getMatches, addTutor, addTutee, dropMatch, clearMatches, setTutors, setTutees } from './lib/data/store'
import { runAutoMatch } from './lib/data/matching'
import { seedData } from './lib/data/seed'
import type { TutorApplication, TuteeApplication } from './lib/types'

async function readBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk.toString() })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

export function apiPlugin(): Plugin {
  return {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`)
        const path = url.pathname

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

        if (req.method === 'OPTIONS') {
          res.writeHead(200)
          res.end()
          return
        }

        try {
          // Handle /api/tutors
          if (path === '/tutors/lookup') {
            if (req.method === 'GET') {
              const pennId = url.searchParams.get('pennId') || ''
              const tutor = getTutors().find(t => t.pennId === pennId)
              if (tutor) {
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(tutor))
              } else {
                res.writeHead(404, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'Not found' }))
              }
              return
            }
          }

          if (path === '/tutors' || path === '/tutors/') {
            if (req.method === 'GET') {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(getTutors()))
              return
            }
            if (req.method === 'POST') {
              const data = await readBody(req)
              const tutor: TutorApplication = {
                ...data,
                id: `tutor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                createdAt: new Date().toISOString(),
              }
              addTutor(tutor)
              res.writeHead(201, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(tutor))
              return
            }
          }

          // Handle /api/tutees
          if (path === '/tutees' || path === '/tutees/') {
            if (req.method === 'GET') {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(getTutees()))
              return
            }
            if (req.method === 'POST') {
              const data = await readBody(req)
              const tutee: TuteeApplication = {
                ...data,
                id: `tutee-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                createdAt: new Date().toISOString(),
              }
              addTutee(tutee)
              res.writeHead(201, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(tutee))
              return
            }
          }

          // Handle /api/matches
          if (path === '/matches' || path === '/matches/') {
            if (req.method === 'GET') {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(getMatches()))
              return
            }
            if (req.method === 'POST') {
              const newMatches = runAutoMatch()
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ allMatches: getMatches(), newMatches }))
              return
            }
            if (req.method === 'DELETE') {
              const matchId = url.searchParams.get('id')
              if (matchId === 'all') {
                clearMatches()
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(getMatches()))
              } else if (matchId) {
                dropMatch(matchId)
                res.writeHead(200, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify(getMatches()))
              } else {
                res.writeHead(400)
                res.end(JSON.stringify({ error: 'Missing id parameter' }))
              }
              return
            }
          }

          // Handle /api/seed
          if (path === '/seed' || path === '/seed/') {
            if (req.method === 'POST') {
              seedData()
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: true }))
              return
            }
          }

          // Not found
          res.writeHead(404)
          res.end(JSON.stringify({ error: 'Not found' }))
        } catch (error: any) {
          res.writeHead(500)
          res.end(JSON.stringify({ error: error.message }))
        }
      })
    },
  }
}

