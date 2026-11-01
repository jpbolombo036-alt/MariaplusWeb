/** Metadata is optional to support both PageResponse and older API responses. */
export interface CollectionPage<T> {
  content: T[]
  currentPage?: unknown
  totalPages?: unknown
  totalElements?: unknown
}

function nonNegativeInteger(value: unknown): number | undefined {
  if (value == null || value === '') return undefined
  const number = Number(value)
  return Number.isSafeInteger(number) && number >= 0 ? number : undefined
}

/** Read the entire collection without assuming the server honors the requested size. */
export async function collectAllPages<T>(
  loadPage: (page: number) => Promise<CollectionPage<T>>,
  keyOf: (item: T) => number | string,
): Promise<T[]> {
  const items: T[] = []
  const seen = new Set<number | string>()

  for (let requestedPage = 0; ; requestedPage++) {
    const page = await loadPage(requestedPage)
    const currentPage = nonNegativeInteger(page.currentPage) ?? requestedPage
    const totalPages = nonNegativeInteger(page.totalPages)
    const totalElements = nonNegativeInteger(page.totalElements)

    if (currentPage !== requestedPage) {
      throw new Error('Le serveur a renvoyé une page inattendue. Veuillez recharger la liste.')
    }

    const previousCount = items.length
    for (const item of page.content) {
      const key = keyOf(item)
      if (!seen.has(key)) {
        seen.add(key)
        items.push(item)
      }
    }

    if (!page.content.length) {
      if ((totalElements !== undefined && items.length < totalElements)
        || (totalPages !== undefined && currentPage + 1 < totalPages)) {
        throw new Error('La liste reçue du serveur est incomplète. Veuillez la recharger.')
      }
      return items
    }

    // A server that ignores `page` must fail instead of looping indefinitely.
    if (items.length === previousCount) {
      throw new Error('Le serveur a renvoyé une page déjà chargée. Veuillez recharger la liste.')
    }

    if (totalPages !== undefined) {
      if (currentPage + 1 >= totalPages) {
        if (totalElements !== undefined && items.length < totalElements) {
          throw new Error('La liste reçue du serveur est incomplète. Veuillez la recharger.')
        }
        return items
      }
    } else if (totalElements !== undefined && items.length >= totalElements) {
      return items
    }
    // Without metadata, only an empty next page proves the collection is complete.
  }
}
