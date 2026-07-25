import { writeFile, mkdir, readFile } from 'fs/promises'
import { pathToFileURL, fileURLToPath } from 'url'
import { join, dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

console.log('Prerendering root page...')

let html

// Try multiple server output paths (TanStack Start varies by version/preset)
const candidates = [
  join(root, 'dist', 'server', 'server.js'),
  join(root, 'dist', 'server', 'index.mjs'),
  join(root, '.output', 'server', 'index.mjs'),
]

for (const candidate of candidates) {
  try {
    const mod = await import(pathToFileURL(candidate).href)
    const server = mod.default ?? mod
    const res = await server.fetch(new Request('http://localhost:3000/'))
    const text = await res.text()
    if (text.includes('<html')) {
      html = text
      console.log(`SSR success via ${candidate} (${html.length} bytes)`)
      break
    }
  } catch (err) {
    console.warn(`SSR candidate failed (${candidate}):`, err.message)
  }
}

// Fallback: build a shell HTML with the correct asset paths from Vite manifest
if (!html) {
  console.warn('All SSR candidates failed — building shell from Vite manifest')
  let scripts = ''
  let styles = ''

  try {
    const manifestPath = join(root, 'dist', 'client', '.vite', 'manifest.json')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'))

    for (const entry of Object.values(manifest)) {
      if (entry.isEntry) {
        scripts += `  <script type="module" crossorigin src="/${entry.file}"></script>\n`
        for (const css of (entry.css ?? [])) {
          styles += `  <link rel="stylesheet" crossorigin href="/${css}" />\n`
        }
      }
    }
    console.log('Manifest entries injected')
  } catch (e) {
    console.warn('Manifest read failed:', e.message)
    // Last resort: glob for any JS file in dist/client
    try {
      const { readdirSync } = await import('fs')
      const files = readdirSync(join(root, 'dist', 'client'), { recursive: true })
      for (const f of files) {
        const s = String(f).replace(/\\/g, '/')
        if (s.endsWith('.js') && !s.includes('server')) {
          scripts += `  <script type="module" crossorigin src="/${s}"></script>\n`
        }
        if (s.endsWith('.css')) {
          styles += `  <link rel="stylesheet" crossorigin href="/${s}" />\n`
        }
      }
      console.log('Glob fallback injected', files.length, 'files')
    } catch {}
  }

  html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ForensicVision — Image Forgery Detection</title>
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
${styles}  </head>
  <body>
    <div id="root"></div>
${scripts}  </body>
</html>`
}

await mkdir(join(root, 'dist', 'client'), { recursive: true })
await writeFile(join(root, 'dist', 'client', 'index.html'), html, 'utf-8')
console.log('dist/client/index.html written')
