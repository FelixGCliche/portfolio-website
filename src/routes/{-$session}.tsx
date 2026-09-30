import { createFileRoute, notFound, useNavigate } from '@tanstack/solid-router'
import { createEffect, untrack } from 'solid-js'

import { Thread, useConversation, useSessionUrl } from '@features/conversation'
import { SESSION_KEYS } from '@features/sessions'

const isSessionParam = (value: string) => SESSION_KEYS.some((key) => key.slice(1) === value)

const SessionThread = () => {
  const params = Route.useParams()
  const navigate = useNavigate()
  const conversation = useConversation()
  // The param is only read once (untracked) to replay the deep link; afterwards the conversation drives the URL
  const { syncUrl } = useSessionUrl(() => params().session, navigate)

  createEffect(
    () => conversation.state.active,
    (active, prev) => {
      // Skip the initial value and no-op transitions so URL writes never echo back into commands
      if (prev === undefined || active === prev) return
      const current = untrack(() => params().session)
      if ((active ? active.slice(1) : undefined) === current) return
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
