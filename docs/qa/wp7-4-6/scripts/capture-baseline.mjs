/** Independent characterization capture: existing consumers, never the new shim. */
import { readFileSync,writeFileSync,existsSync } from 'node:fs'
import { dirname,resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { createServer } from 'vite'
const pkg=resolve(dirname(fileURLToPath(import.meta.url)),'..'),repo=resolve(pkg,'../../..'),out=pkg+'/evidence/legacy-goldens.json'
if(existsSync(out)&&!process.argv.includes('--refresh'))throw Error('Goldens already captured; review independent source changes before explicit --refresh')
const server=await createServer({root:repo,configFile:false,server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',cacheDir:resolve(repo,'../output/wp7-4-6-verification/vite-cache')})
try {
  const {legacyCases}=await server.ssrLoadModule('/docs/qa/wp7-4-6/tests/legacyFixtures.ts')
  const {observeLegacy}=await server.ssrLoadModule('/docs/qa/wp7-4-6/tests/observeLegacy.ts')
  const {decodeForecastSettings}=await server.ssrLoadModule('/src/forecast/settings.ts')
  const {decodeProgress}=await server.ssrLoadModule('/src/progress/taskProgress.ts')
  const rows=legacyCases().map(c=>{
    if(!decodeForecastSettings(c.settings).ok)throw Error('Invalid forecast fixture: '+c.id)
    if(decodeProgress(c.progress,c.tasks.map(t=>t.taskId)).ok!==c.acceptedLegacyProgress)throw Error('Unexpected legacy validity: '+c.id)
    return {id:c.id,acceptedLegacyProgress:c.acceptedLegacyProgress,taskCount:c.tasks.length,edgeCount:c.tasks.reduce((n,t)=>n+t.predecessorTaskIds.length,0),output:observeLegacy(c)}
  })
  writeFileSync(out,JSON.stringify(rows)+'\n')
  const files=['tests/legacyFixtures.ts','tests/observeLegacy.ts','scripts/capture-baseline.mjs'],sources=['src/domain/scheduler.ts','src/domain/criticalPath.ts','src/forecast/forecast.ts','src/progress/healthPresentation.ts','src/progress/taskProgress.ts','src/projection/progressImpact.ts','src/workTracking/workTracking.ts','src/timeline/overlays.ts','src/timeline/historyPresentation.ts','src/network/layout.ts']
  const sha=b=>createHash('sha256').update(b).digest('hex')
  writeFileSync(pkg+'/evidence/golden-provenance.json',JSON.stringify({clientDate:'2026-11-10',recordedAtUTC:new Date().toISOString(),independentExistingConsumerCapture:true,projectedAdapterExistedAtCapture:existsSync(pkg+'/tests/projectedReadModel.ts'),goldenSha256:sha(readFileSync(out)),goldenBytes:readFileSync(out).length,fixtures:rows.map(r=>({id:r.id,taskCount:r.taskCount,edgeCount:r.edgeCount,acceptedLegacyProgress:r.acceptedLegacyProgress})),producerHashes:Object.fromEntries(files.map(f=>[f,sha(readFileSync(pkg+'/'+f))])),existingSourceHashes:Object.fromEntries(sources.map(f=>[f,sha(readFileSync(repo+'/'+f))]))},null,2)+'\n')
  console.log(`Captured ${rows.length} legacy cases before projected adaptation; ${readFileSync(out).length} UTF-8 bytes.`)
} finally {await server.close()}
