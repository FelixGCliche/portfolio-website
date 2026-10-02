import { createFileRoute, notFound, useNavigate } from '@tanstack/solid-router'
import { createEffect, untrack } from 'solid-js'

import { Thread, useConversation, useSessionUrl } from '@features/conversation'
import { isLocale } from '@features/i18n'
import { isSessionParam, keyToParam } from '@features/sessions'

const SessionThread = () => {
  const params = Route.useParams()
  const navigate = useNavigate()
  const conversation = useConversation()
  const { syncUrl } = useSessionUrl(() => params().session, navigate)

  let isFirstRun = true

  createEffect(
    () => conversation.state.active,
    (active, prev) => {
      if (isFirstRun) {
        isFirstRun = false
        return
      }
      if (active === prev) return
      const current = untrack(() => params().session)
      if ((active ? keyToParam(active) : undefined) === current) return
      syncUrl(active)
    },
    { name: 'sessionUrlSync' }
  )

  return <Thread />
}

export const Route = createFileRoute('/$locale/{-$session}')({
  beforeLoad: ({ params }) => {
    if (!isLocale(params.locale)) throw notFound()
    if (params.session !== undefined && !isSessionParam(params.session)) throw notFound()
  },
  component: SessionThread,
})
