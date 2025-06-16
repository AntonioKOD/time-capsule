/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import { getPayload } from 'payload'
import config from '../payload.config'

let cached = global as any

if (!cached.payload) {
  cached.payload = null
}

/**
 * Get initialized Payload instance
 * This ensures Payload is properly initialized before use
 */
export const getPayloadClient = async () => {
  if (!cached.payload) {
    cached.payload = await getPayload({
      config,
    })
  }
  return cached.payload
}

export default getPayloadClient 