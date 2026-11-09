// Two representative synthetic snapshots only; no large canonical buffers committed.
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),workspace=resolve(root,'../../../..')
const out=resolve(process.argv[2]??workspace+'/output/wp7-4-4b-verification'),data=resolve(process.argv[3]??workspace+'/output/wp7-4-4b-capacity')
const report=JSON.parse(readFileSync(root+'/evidence/capacity-results.json','utf8'))
const names=['class30','class40'], requests=names.map(id=>({id,inputBase64:Buffer.from(JSON.stringify(JSON.parse(readFileSync(data+'/'+id+'.pretty.json','utf8')).snapshot)).toString('base64')}))
writeFileSync(out+'/cross-capacity-requests.json',JSON.stringify(requests))
execFileSync('dotnet',[out+'/dotnet/bin/Release/net10.0/CrossCheck.dll',out+'/cross-capacity-requests.json',out+'/cross-capacity-results.json'],{stdio:'pipe'})
const result=JSON.parse(readFileSync(out+'/cross-capacity-results.json','utf8'))
report.crossRuntimeCapacityHashes=result.results.map(item=>{const expected=report.rows.find(r=>r.options.name===item.id).snapshotSha256;if(item.prefixedSha256!==expected)throw Error('Cross-runtime synthetic hash disagreement');return {name:item.id,nodeExpected:expected,dotnetActual:item.prefixedSha256,canonicalSnapshotBytes:item.canonicalHex.length/2,match:true}})
writeFileSync(root+'/evidence/capacity-results.json',JSON.stringify(report,null,2)+'\n')
console.log('PASS: representative30/40-task synthetic snapshot digests match in Node and .NET.')
