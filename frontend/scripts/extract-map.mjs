import fs from 'node:fs'

const source = fs.readFileSync('scripts/mapinfo.js', 'utf8')

const paths = {}
for (const m of source.matchAll(/(PL\d{2}):\s*"(M\d[^"]*)"/g)) {
    paths[m[1]] = m[2]
}

const count = Object.keys(paths).length
if (count !== 16) {
    throw new Error('Znaleziono ' + count + ' województw zamiast 16')
}

const output =
    `export const MAP_VIEWBOX = '0 0 1000 947'\n\n` +
    `export const MAP_PATHS: Record<string, string> = ${JSON.stringify(paths, null, 2)}\n`

fs.writeFileSync('src/polandMapPaths.ts', output)
console.log('Zapisano', count, 'województw')