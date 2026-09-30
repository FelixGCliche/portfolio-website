import { sessions } from '@features/sessions'

import { Placeholder } from '../Placeholder'

const session = sessions.find((s) => s.key === '/skills')

export const SkillsResponse = () => (
  <Placeholder title="/skills" meta={session?.meta} desc={session?.desc ?? ''} />
)
