import { copyFile, mkdir, writeFile } from 'node:fs/promises'

const dist = new URL('../dist/', import.meta.url)

// Pages serves real route documents, including direct visits and refreshes.
for (const route of ['product/barelyef/', 'product/barelyef-new/', 'product/barelyef-v3/']) {
  const product = new URL(route, dist)
  await mkdir(product, { recursive: true })
  await copyFile(new URL('index.html', dist), new URL('index.html', product))
}
await writeFile(new URL('.nojekyll', dist), '')
