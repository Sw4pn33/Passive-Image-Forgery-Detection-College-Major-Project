import { writeFile, mkdir } from 'fs/promises'
import { pathToFileURL, fileURLToPath } from 'url'
import { join, dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

console.log('Prerendering root page...')

let html
try {
  const { default: server } = await import(
    pathToFileURL(join(root, 'dist', 'server', 'server.js')).href
  )
  const res = await server.fetch(new Request('http://localhost:3000/'))
  html = await res.text()
  if (!html.includes('<html')) throw new Error('Response is not HTML')
  console.log(`SSR success (${html.length} bytes)`)
} catch (err) {
  console.warn('SSR fallback (shell only):', err.message)
  html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ForensicVision — Image Forgery Detection</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`
}

await mkdir(join(root, 'dist', 'client'), { recursive: true })
await writeFile(join(root, 'dist', 'client', 'index.html'), html, 'utf-8')
console.log('dist/client/index.html created')
