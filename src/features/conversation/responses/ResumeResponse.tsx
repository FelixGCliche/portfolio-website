import { sessions } from '@features/sessions'

import { Placeholder } from '../Placeholder'

const session = sessions.find((s) => s.key === '/resume')

export const ResumeResponse = () => (
  <Placeholder title="/resume" meta={session?.meta} desc={session?.desc ?? ''} />
)
