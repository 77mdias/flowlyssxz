// Site hostil local tenta gravar fora da captura com "..%2F" e plantar um json.py ao lado do serve.py.
// Uso: node tests/test_capture_paths.mjs   (precisa do Chromium do Playwright, ~20 s)
import assert from 'node:assert/strict'
import { execFile, execFileSync } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const PLANT = 'print("PLANTADO")\nraise SystemExit(7)\n'

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.setHeader('content-type', 'text/html; charset=utf-8')
    return res.end('<!doctype html><title>hostil</title><h1>oi</h1><img src="/a/..%2F..%2F..%2Fjson.py"><script src="/b/..%2F..%2F..%2F..%2Fpwn.js"></script>')
  }
  res.setHeader('content-type', 'text/plain')
  res.end(PLANT)
})
await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
const url = `http://127.0.0.1:${server.address().port}/`
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fd-paths-'))
const out = path.join(tmp, 'cap')

try {
  try {
    // assíncrono: o servidor hostil roda neste mesmo processo e precisa responder durante a captura
    await promisify(execFile)('node', [path.join(ROOT, 'skills/flowlyssxz/scripts/capture_site.mjs'), url, '--out', out, '--no-mobile', '--no-verify'], { cwd: ROOT, encoding: 'utf8', timeout: 120000 })
  } catch (e) {
    throw new Error(`a captura falhou:\n${e.stdout}\n${e.stderr}`)
  }

  // nada fora de site/: nem na raiz da captura, nem acima dela
  const extra = fs.readdirSync(out).filter((f) => !['site', 'serve.py', 'abrir.sh', 'abrir.bat', 'index.html', 'Como rodar.md'].includes(f))
  assert.deepEqual(extra, [], `arquivos fora do lugar na captura: ${extra}`)
  assert.deepEqual(fs.readdirSync(tmp), ['cap'], 'a captura gravou fora da própria pasta')
  const index = JSON.parse(fs.readFileSync(path.join(out, 'site/_fd/site-index.json'), 'utf8'))
  for (const e of index.entries) if (e.file) assert.ok(e.file.startsWith('site/') && !e.file.split('/').includes('..'), `caminho inseguro no índice: ${e.file}`)
  assert.ok(index.entries.some((e) => /json\.py$/.test(e.file || '')), 'o recurso hostil devia ter sido gravado dentro de site/')

  // defesa extra: um json.py plantado na raiz não roda com -I (e rodaria sem)
  fs.writeFileSync(path.join(out, 'json.py'), PLANT)
  const run = (args) => { try { return execFileSync('python3', args, { cwd: out, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) } catch (e) { return String(e.stdout) } }
  assert.ok(run(['serve.py', '--help']).includes('PLANTADO'), 'sem -I o teste devia ter executado o json.py plantado')
  assert.ok(!run(['-I', 'serve.py', '--help']).includes('PLANTADO'), 'com -I o json.py plantado foi executado')
  console.log('ok: captura não grava fora de site/ e o player ignora módulos plantados')
} finally {
  server.close()
  fs.rmSync(tmp, { recursive: true, force: true })
}
