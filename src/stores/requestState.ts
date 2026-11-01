interface StoreRequestState {
  revision: number
  promise: Promise<void> | null
}

// Request bookkeeping belongs to each Pinia instance and is never persisted.
const requests = new WeakMap<object, StoreRequestState>()

export function storeRequestState(store: object): StoreRequestState {
  let request = requests.get(store)
  if (!request) {
    request = { revision: 0, promise: null }
    requests.set(store, request)
  }
  return request
}

export function invalidateStoreRequests(store: object): number {
  const request = storeRequestState(store)
  request.promise = null
  return ++request.revision
}
