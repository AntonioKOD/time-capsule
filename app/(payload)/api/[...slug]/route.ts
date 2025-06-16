/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import { REST_DELETE, REST_GET, REST_PATCH, REST_POST } from '@payloadcms/next/routes'
import { unstable_noStore } from 'next/cache'
import config from '@payload-config'

export const GET = (req: Request, context: any) => {
  unstable_noStore()
  return REST_GET(config)(req, context)
}

export const POST = (req: Request, context: any) => {
  unstable_noStore()
  return REST_POST(config)(req, context)
}

export const DELETE = (req: Request, context: any) => {
  unstable_noStore()
  return REST_DELETE(config)(req, context)
}

export const PATCH = (req: Request, context: any) => {
  unstable_noStore()
  return REST_PATCH(config)(req, context)
}
