import { createContext, useContext } from 'solid-js'
import type { ParentProps } from 'solid-js'

import type { TopicKey } from '@features/topic-keys'

export type BlockActions = {
  // Runs a topic in the conversation, as if the visitor had typed it
  runTopic: (key: TopicKey) => void
  // The topic's URL, so links stay real (open in a new tab, copy link address)
  topicHref: (key: TopicKey) => string
}

// A null default lets useBlockActions() report a missing provider with a clear message
const BlockActionsContext = createContext<BlockActions | null>(null)

export const useBlockActions = (): BlockActions => {
  const actions = useContext(BlockActionsContext)
  if (!actions) throw new Error('useBlockActions() must be called inside a <BlockActionsProvider>')
  return actions
}

export const BlockActionsProvider = (props: ParentProps<BlockActions>) => {
  const value: BlockActions = {
    runTopic: (key) => props.runTopic(key),
    topicHref: (key) => props.topicHref(key),
  }

  return <BlockActionsContext value={value}>{props.children}</BlockActionsContext>
}
