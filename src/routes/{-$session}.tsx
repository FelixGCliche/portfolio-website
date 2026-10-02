import { createFileRoute, notFound, useNavigate } from '@tanstack/solid-router'
import { createEffect, untrack } from 'solid-js'

import { Thread, useConversation, useSessionUrl } from '@features/conversation'
import { isSessionParam, keyToParam } from '@features/sessions'

const SessionThread = () => {
  const params = Route.useParams()
  const navigate = useNavigate()
  const conversation = useConversation()
  // URL -> conversation: replays deep links and follows back/forward; conversation -> URL is the effect below
  const { syncUrl } = useSessionUrl(() => params().session, navigate)

  // The first run sees the provider's initial `active`, which must not overwrite a deep-linked URL
  let isFirstRun = true

  createEffect(
    () => conversation.state.active,
    (active, prev) => {
      if (isFirstRun) {
        isFirstRun = false
        return
      }
      // Skip no-op transitions so URL writes never echo back into commands
      if (active === prev) return
      const current = untrack(() => params().session)
      if ((active ? keyToParam(active) : undefined) === current) return
      syncUrl(active)
    },
    { name: 'sessionUrlSync' }
  )

  return <Thread />
}

export const Route = createFileRoute('/{-$session}')({
  beforeLoad: ({ params }) => {
    if (params.session !== undefined && !isSessionParam(params.session)) throw notFound()
  },
  component: SessionThread,
})
