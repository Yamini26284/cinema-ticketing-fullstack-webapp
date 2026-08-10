import { Hono } from 'hono'

import { sql } from '#/db'
import { redis } from '#/db/redis'

export const healthRoute = new Hono().get('/', async (c) => {
  const [dbResult, redisResult] = await Promise.allSettled([
    sql`select 1 as n`,
    redis.ping(),
  ])

  const dbOk =
    dbResult.status === 'fulfilled' && dbResult.value[0].n === 1
  const redisOk = redisResult.status === 'fulfilled'

  const status = dbOk && redisOk ? 200 : 503

  return c.json(
    {
      ok: dbOk && redisOk,
      db: dbOk,
      redis: redisOk,
    },
    status,
  )
})
