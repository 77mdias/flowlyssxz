#!/usr/bin/env node
// record_page.mjs — grava em vídeo uma página que você construiu (rolagem + hover),
// para analisar com analyze_video.py e comparar com a referência original.
//
// Instalação (uma vez, no projeto que você está construindo):
//   npm i -D playwright && npx playwright install chromium
//
// Uso:
//   node record_page.mjs http://localhost:5173 ./recordings
//   node record_page.mjs http://localhost:5173 ./recordings --mobile --step 120 --pause 60
//
// Depois:
//   python3 analyze_video.py recordings/<arquivo>.webm --out recordings/analysis

import { chromium, devices } from 'playwright'
import { mkdirSync, renameSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const url = args[0]
const outDir = args[1] && !args[1].startsWith('--') ? args[1] : 'recordings'
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i > -1 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d }
if (!url) { console.error('uso: node record_page.mjs URL [pasta] [--mobile] [--step 100] [--pause 50] [--hover "a,button"]'); process.exit(1) }

const mobile = !!flag('mobile', false)
const step = Number(flag('step', 100))     // px por "tick" de roda
const pause = Number(flag('pause', 50))    // ms entre ticks (≈ rolagem humana calma)
const hoverSel = flag('hover', 'a, button, [data-hover]')
mkdirSync(outDir, { recursive: true })

const base = mobile ? devices['iPhone 13'] : { viewport: { width: 1440, height: 900 } }
const browser = await chromium.launch()
const context = await browser.newContext({ ...base, recordVideo: { dir: outDir, size: base.viewport } })
const page = await context.newPage()
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)                       // intro / loader
const { width, height } = base.viewport
await page.mouse.move(width / 2, height / 2)

const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)
for (let y = 0; y < total + height; y += step) {
  await page.mouse.wheel(0, step)
  await page.waitForTimeout(pause)
}
await page.waitForTimeout(1200)                       // deixa o smooth scroll assentar

// passada de hover nos primeiros elementos interativos visíveis do topo
await page.mouse.wheel(0, -total - height)
await page.waitForTimeout(1500)
const targets = await page.locator(hoverSel).all()
for (const t of targets.slice(0, 6)) {
  try { await t.hover({ timeout: 800 }); await page.waitForTimeout(700) } catch {}
}
await page.mouse.move(width * 0.2, height * 0.3, { steps: 25 })
await page.mouse.move(width * 0.8, height * 0.7, { steps: 25 })
await page.waitForTimeout(800)

const video = page.video()
await context.close()
await browser.close()
const src = await video.path()
const dest = join(outDir, `record_${mobile ? 'mobile' : 'desktop'}_${Date.now()}.webm`)
renameSync(src, dest)
console.log(dest)
