// Local development server: mounts the /api Vercel-style serverless
// handlers (each exporting a default (req, res) function) onto Express
// so `npm run dev` works without the Vercel CLI. In production these
// same files are deployed as Vercel serverless functions directly.
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const apiDir = path.join(__dirname, 'api')

const app = express()
app.use(cors())
app.use(express.json())

function toExpressRoute(relativeSegments) {
  return (
    '/' +
    relativeSegments
      .map((segment) => (segment.startsWith('[') ? `:${segment.slice(1, -1)}` : segment))
      .join('/')
  )
}

async function mountRoutes(dir, segments = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      await mountRoutes(path.join(dir, entry.name), [...segments, entry.name])
      continue
    }

    if (!entry.name.endsWith('.js')) continue

    const isIndex = entry.name === 'index.js'
    const baseName = entry.name.replace(/\.js$/, '')
    const routeSegments = isIndex ? segments : [...segments, baseName]
    const routePath = '/api' + (routeSegments.length ? toExpressRoute(routeSegments) : '')

    const filePath = path.join(dir, entry.name)
    const mod = await import(pathToFileURL(filePath).href)
    const handler = mod.default

    app.all(routePath, (req, res) => {
      req.query = { ...req.query, ...req.params }
      handler(req, res).catch((err) => {
        console.error(err)
        if (!res.headersSent) res.status(500).json({ message: 'Internal server error' })
      })
    })

    console.log(`Mounted ${routePath}`)
  }
}

const PORT = process.env.PORT || 5000

mountRoutes(apiDir).then(() => {
  app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`))
})
