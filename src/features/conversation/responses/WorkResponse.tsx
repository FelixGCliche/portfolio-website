import { sessions } from '@features/sessions'

import { Placeholder } from '../Placeholder'

const session = sessions.find((s) => s.key === '/work')

export const WorkResponse = () => (
  <Placeholder title="/work" meta={session?.meta} desc={session?.desc ?? ''} />
)
