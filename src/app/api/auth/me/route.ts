import { toPublicUser } from '@/lib/db/models/User'
import { withRoute } from '@/lib/http/route'
import { fail } from '@/lib/http/response'
import { withEtag } from '@/lib/http/cache'
import { RULES } from '@/lib/http/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/me — who is signed in.
 *
 * The client hits this on every console page load, so it is the endpoint
 * most worth making cheap: the user document is memoised in-process for a
 * few seconds, and an unchanged body comes back as a 304 with no payload.
 */
export const GET = withRoute(
  {
    auth: 'optional',
    rateLimit: { rule: RULES.read, scope: 'me', by: 'both' },
  },
  async ({ req, user, authState }) => {
    // Signals the client to try /api/auth/refresh instead of showing the
    // login screen — the session is still valid, just the access token aged out.
    if (authState === 'expired') {
      return fail('TOKEN_EXPIRED', 'Your session expired.')
    }

    return withEtag(req, { user: user ? toPublicUser(user) : null })
  },
)
