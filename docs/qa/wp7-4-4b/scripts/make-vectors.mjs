// Fixture authoring from RFC/reference expected values, independent of Bugsys recipes.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sha, prefix } from './probe.mjs'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const rows = []
function add(id, input, expected, provenance) {
  const bytes = Buffer.from(expected, 'utf8')
  rows.push({ id, inputBase64: Buffer.from(input, 'utf8').toString('base64'), expectedHex: bytes.toString('hex'), expectedRawSha256: sha(bytes), expectedPrefixedSha256: sha(Buffer.concat([prefix, bytes])), provenance })
}
for (const name of ['arrays', 'french', 'structures', 'unicode', 'values', 'weird']) {
  const input = readFileSync(root + '/fixtures/reference/input/' + name + '.json'), expected = readFileSync(root + '/fixtures/reference/output/' + name + '.json')
  // Independently supplied outhex must identify the same bytes, not an authoring shortcut.
  const hex = readFileSync(root + '/fixtures/reference/outhex/' + name + '.txt', 'utf8').replaceAll(/\s/g, '').toLowerCase()
  if (hex !== expected.toString('hex')) throw Error('Upstream hex/text disagree: ' + name)
  add('upstream-' + name, input.toString('utf8'), expected.toString('utf8'), 'cyberphone/json-canonicalization@32a48195b9b20fe67b1795e39e4509f14d860b45:testdata/input,output,outhex/' + name)
}
// Expected property sequence/bytes authored directly from the RFC UTF-16 rule.
add('utf16-non-bmp', '{"\ue000":"bmp","\ud83d\ude00":"supplementary","a":{"z":0,"a":1}}', '{"a":{"a":1,"z":0},"😀":"supplementary","":"bmp"}', 'RFC8785 section3.2.3; explicit supplementary-before-U+E000 ordering, independently specified literal')
add('empty', '{"z":[],"a":{},"n":null}', '{"a":{},"n":null,"z":[]}', 'Independently specified empty-container literal')
add('tojson-data-member', '{"z":1,"toJSON":1,"a":2}', '{"a":2,"toJSON":1,"z":1}', 'RFC8785 object-member ordering applied to ordinary data key toJSON; independent expected literal')
add('nfc', '{"s":"\u00e9"}', '{"s":"é"}', 'RFC8785 section3.1 no Unicode normalization; explicit NFC bytes')
add('nfd', '{"s":"e\u0301"}', '{"s":"é"}', 'RFC8785 section3.1 no Unicode normalization; explicit decomposed bytes')
add('escapes', '{"s":"\\u0000\\b\\t\\n\\f\\r\\\"\\\\/\\ud83d\\ude00"}', Buffer.from('7b2273223a225c75303030305c625c745c6e5c665c725c225c5c2ff09f9880227d', 'hex').toString('utf8'), 'RFC8785 section3.2.2.2; independently specified canonical hex for controls/quote/backslash/slash/supplementary')
add('array-order', '{"b":[3,1,{"z":0,"a":2}],"a":[]}', '{"a":[],"b":[3,1,{"a":2,"z":0}]}', 'Independent literal; arrays retain input order')
// AppendixB values are mathematical expected data, not output of either implementation.
const samples = [
  ['0000000000000000','0'],['8000000000000000','0'],['0000000000000001','5e-324'],['8000000000000001','-5e-324'],
  ['7fefffffffffffff','1.7976931348623157e+308'],['ffefffffffffffff','-1.7976931348623157e+308'],
  ['4340000000000000','9007199254740992'],['c340000000000000','-9007199254740992'],['4430000000000000','295147905179352830000'],
  ['44b52d02c7e14af5','9.999999999999997e+22'],['44b52d02c7e14af6','1e+23'],['44b52d02c7e14af7','1.0000000000000001e+23'],
  ['444b1ae4d6e2ef4e','999999999999999700000'],['444b1ae4d6e2ef4f','999999999999999900000'],['444b1ae4d6e2ef50','1e+21'],
  ['3eb0c6f7a0b5ed8c','9.999999999999997e-7'],['3eb0c6f7a0b5ed8d','0.000001'],['41b3de4355555553','333333333.3333332'],
  ['41b3de4355555554','333333333.33333325'],['41b3de4355555555','333333333.3333333'],['41b3de4355555556','333333333.3333334'],
  ['41b3de4355555557','333333333.33333343'],['becbf647612f3696','-0.0000033333333333333333'],['43143ff3c1cb0959','1424953923781206.2'],
]
for (const [bits, expected] of samples) {
  add('rfc-number-' + bits, '{"n":' + expected + '}', '{"n":' + expected + '}', 'RFC8785 AppendixB literal IEEE754/expected table')
  rows.at(-1).bits = bits
}
writeFileSync(root + '/fixtures/vectors.json', JSON.stringify({ sourceRevision: 'RFC8785 June2020 + pinned upstream32a4819', expectedHashDerivation: 'SHA256 of independently specified expected bytes, raw and declared-prefix variants; independently checked in .NET', vectors: rows }, null, 2) + '\n')
console.log(`Prepared ${rows.length} independent expected canonical-byte vectors.`)
