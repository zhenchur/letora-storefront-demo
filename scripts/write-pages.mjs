import { copyFile, mkdir, writeFile } from 'node:fs/promises'

const dist = new URL('../dist/', import.meta.url)
const product = new URL('product/barelyef/', dist)

// Pages serves real route documents, including direct visits and refreshes.
await mkdir(product, { recursive: true })
await copyFile(new URL('index.html', dist), new URL('index.html', product))
await writeFile(new URL('.nojekyll', dist), '')
