/** TEST-ONLY lexical/resource probe, not a format6 model/reader or acceptance API.
 * No project state, repository writes or domain validation exists here.
 */
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import canonicalize from '../reference/node/canonicalize-5.1.mjs'
const require = createRequire(import.meta.url)
export const sampleCanonicalize = require('../reference/node/canonicalize.cjs')
export const referenceCanonicalize = canonicalize
export const prefix = Buffer.from('bugsys-gantt/snapshot-history/2\n', 'utf8')
export const sha = bytes => createHash('sha256').update(bytes).digest('hex')
export const digest = snapshot => sha(Buffer.concat([prefix, Buffer.from(referenceCanonicalize(snapshot), 'utf8')]))

export function unicodeValid(value) {
  for (let i = 0; i < value.length; i++) {
    const c = value.charCodeAt(i)
    if (c >= 0xd800 && c <= 0xdbff) { const next = value.charCodeAt(++i); if (!(next >= 0xdc00 && next <= 0xdfff)) return false }
    else if (c >= 0xdc00 && c <= 0xdfff) return false
  }
  return true
}
/** Scan raw bytes BEFORE JSON.parse can erase duplicates, UTF-8 errors or BOM.
 * Deliberately schema-free. Instrumentation counts containers/array items/IDs
 * separately from maximum container depth. Large arrays are not deep nesting.
 */
export function lexicalProbe(bytes, { maxBytes = Infinity, maxDepth = Infinity } = {}) {
  if (bytes.length > maxBytes) throw Error('FileTooLarge')
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) throw Error('BOM')
  let text
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes) } catch { throw Error('InvalidUTF8') }
  let i = 0, deepest = 0, containers = 0, arrayItems = 0, stringCount = 0, maxStringUnits = 0, numericTokens = 0
  const whitespace = () => { while (i < text.length && /[\x20\t\r\n]/.test(text[i])) i++ }
  function string() {
    const start = i++
    while (i < text.length) {
      const c = text[i++]
      if (c === '"') {
        const value = JSON.parse(text.slice(start, i))
        if (!unicodeValid(value)) throw Error('UnpairedSurrogate')
        stringCount++; maxStringUnits = Math.max(maxStringUnits, value.length)
        return value
      }
      if (c === '\\') { if (text[i] === 'u') i += 5; else i++ }
      else if (c.charCodeAt(0) < 32) throw Error('InvalidJSON')
    }
    throw Error('InvalidJSON')
  }
  function value(parentDepth) {
    whitespace()
    const c = text[i]
    if (c === '{' || c === '[') {
      const depth = parentDepth + 1
      if (depth > maxDepth) throw Error('NestingTooDeep')
      deepest = Math.max(deepest, depth); containers++; i++; whitespace()
      const close = c === '{' ? '}' : ']', names = new Set()
      if (text[i] === close) { i++; return }
      while (i < text.length) {
        if (c === '{') {
          if (text[i] !== '"') throw Error('InvalidJSON')
          const key = string(); if (names.has(key)) throw Error('DuplicateMember')
          names.add(key); whitespace(); if (text[i++] !== ':') throw Error('InvalidJSON')
        } else arrayItems++
        value(depth); whitespace()
        if (text[i] === close) { i++; return }
        if (text[i++] !== ',') throw Error('InvalidJSON')
        whitespace()
      }
      throw Error('InvalidJSON')
    }
    if (c === '"') { string(); return }
    for (const literal of ['true', 'false', 'null']) if (text.startsWith(literal, i)) { i += literal.length; return }
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i))
    if (!match) throw Error('InvalidJSON')
    numericTokens++; if (!Number.isFinite(Number(match[0]))) throw Error('NonFinite')
    i += match[0].length
  }
  value(0); whitespace(); if (i !== text.length) throw Error('InvalidJSON')
  return { bytes: bytes.length, maxDepth: deepest, containers, arrayItems, stringCount, maxStringUnits, numericTokens }
}

export function selectedIntegerPolicy(value) { return Number.isFinite(value) && (!Number.isInteger(value) || Number.isSafeInteger(value)) }
/** Negative qualification of envelope/scope only. NOT full schema acceptance. */
export function envelopeProbe(file) {
  if (file.format !== 'react-gantt-chart' || file.schemaVersion !== 6 || file.profile !== 'snapshot-history/2' || file.integrity?.profile !== 'bugsys-jcs-sha256/1') throw Error('UnsupportedProfile')
  if (digest(file.snapshot) !== file.integrity.snapshotSha256) throw Error('DigestMismatch')
  return 'EnvelopeOnlyNotSchemaAccepted'
}
