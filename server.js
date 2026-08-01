// Local development server: mounts the /api Vercel-style serverless
// handlers (each exporting a default (req, res) function) onto Express
// so `npm run dev` works without the Vercel CLI. In production these
// same files are deployed as Vercel serverless functions directly, with
// vercel.json rewrites forwarding nested paths to each resource's
// index.js (req.url is preserved either way, so handlers parse their own
// slug from it — see lib/parseSlug.js).
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

async function mountRoutes(dir, segments = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.isDirectory()) {
      await mountRoutes(path.join(dir, entry.name), [...segments, entry.name])
      continue
    }

    if (entry.name !== 'index.js') continue

    const basePath = '/api' + (segments.length ? '/' + segments.join('/') : '')

    const filePath = path.join(dir, entry.name)
    const mod = await import(pathToFileURL(filePath).href)
    const handler = mod.default

    const run = (req, res) => {
      handler(req, res).catch((err) => {
        console.error(err)
        if (!res.headersSent) res.status(500).json({ message: 'Internal server error' })
      })
    }

    // Matches the resource root and any nested path beneath it — each
    // handler derives its own slug from req.url via lib/parseSlug.js.
    app.all(basePath, run)
    app.all(`${basePath}/*`, run)

    console.log(`Mounted ${basePath}`)
  }
}

const PORT = process.env.PORT || 5000

mountRoutes(apiDir).then(() => {
  app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`))
})
