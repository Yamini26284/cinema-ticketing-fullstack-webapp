import { Hono } from 'hono'

import { sessionMiddleware } from '#/features/auth/server/middleware'

import { authRoute } from './routes/auth.ts'
import { filmsRoute } from './routes/films.ts'
import { healthRoute } from './routes/health.ts'
import { holdsRoute } from './routes/holds.ts'
import { showingsRoute } from './routes/showings.ts'

export const app = new Hono().basePath('/api')

app.use('*', sessionMiddleware)

app.route('/health', healthRoute)
app.route('/auth', authRoute)
app.route('/films', filmsRoute)
app.route('/showings', showingsRoute)
app.route('/holds', holdsRoute)

export type AppType = typeof app

export default app
