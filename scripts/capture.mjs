import { createRequire } from 'node:module'
import { readFileSync, mkdirSync, statSync, openSync, readSync, closeSync } from 'node:fs'
import { join } from 'node:path'

const url = process.env.CAPTURE_URL
const output = process.env.CAPTURE_DIR

if (!url || !output) {
  console.error('Set CAPTURE_URL and CAPTURE_DIR.')
  process.exit(1)
}

const runtime = join(process.env.HOME, '.local/share/omgithub-playwright')
const require = createRequire(join(runtime, 'package.json'))
const { chromium } = require('playwright')
const config = JSON.parse(readFileSync(join(runtime, process.platform === 'darwin' ? 'metal.json' : 'linux.json'), 'utf8'))

if (process.platform === 'linux') {
  process.env.DISPLAY ||= ':' + readFileSync(join(runtime, 'display'), 'utf8').trim()
}

const transient = (error) => Object.assign(error, { exitCode: 75 })
const timed = async (label, run) => {
  const started = Date.now()
  try {
    return await run()
  } finally {
    console.log(`[timing] ${label.padEnd(34)} ${String(Date.now() - started).padStart(8)} ms`)
  }
}

const views = [
  ['desktop', 1440, 900],
  ['mobile', 390, 844]
]

const verifyScreenshot = (path) => {
  const size = statSync(path).size
  const fd = openSync(path, 'r')
  const signature = Buffer.alloc(8)
  try { readSync(fd, signature, 0, 8, 0) } finally { closeSync(fd) }
  if (size < 2000 || !signature.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    throw Object.assign(new Error(`Invalid or empty screenshot: ${path}`), { exitCode: 1 })
  }
}

mkdirSync(output, { recursive: true })
let browser
try {
  browser = await timed('launch browser', () =>
    chromium.launch({ ...config.browser.launchOptions, timeout: 30000 }).catch(transient)
  )

  for (const [name, width, height] of views) {
    const page = await timed(`open ${name} page`, () =>
      browser.newPage({ viewport: { width, height } }).catch(transient)
    )
    page.setDefaultTimeout(30000)
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(error.message))

    const response = await timed(`navigate ${name}`, () =>
      page.goto(url, { waitUntil: 'load', timeout: 45000 }).catch(transient)
    )
    if (!response?.ok()) {
      const status = response?.status()
      throw Object.assign(new Error(`HTTP ${status ?? 'unknown'} loading ${url}`), {
        exitCode: !response || [408, 429, 500, 502, 503, 504].includes(status) ? 75 : 1
      })
    }

    await timed(`wait for render ${name}`, async () => {
      try {
        await page.waitForFunction(() => window.__gen1Ready === true, null, { timeout: 30000 })
        await page.waitForFunction(() => {
          const gen = window.__gen1
          return Boolean(gen && gen.renderer && gen.renderer.info.render.calls > 0)
        }, null, { timeout: 30000 })
      } catch (error) {
        const suffix = pageErrors.length ? ` Page errors: ${pageErrors.join(' | ')}` : ''
        throw Object.assign(new Error(`Rendering did not complete for ${name}.${suffix}`), { exitCode: 1 })
      }
      await page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 15000 })
    })

    await page.waitForTimeout(1000)
    const path = join(output, `final-${name}.png`)
    await timed(`screenshot ${name}`, () =>
      page.screenshot({ path, timeout: 30000 }).catch((error) => {
        if (error.name === 'TimeoutError' || !browser.isConnected()) transient(error)
        throw error
      })
    )
    await timed(`verify ${name} screenshot`, async () => verifyScreenshot(path))
    await timed(`close ${name} page`, () => page.close())
  }
} catch (error) {
  console.error(error)
  process.exitCode = error.exitCode || 1
} finally {
  await browser?.close().catch((error) => {
    console.error(error)
    process.exitCode ||= 75
  })
}
