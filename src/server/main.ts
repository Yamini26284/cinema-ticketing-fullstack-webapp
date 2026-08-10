import './env.ts'

import { serve } from '@hono/node-server'

import app from './index.ts'

const port = Number(process.env.PORT ?? 3001)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`api listening on http://localhost:${info.port}`)
})
