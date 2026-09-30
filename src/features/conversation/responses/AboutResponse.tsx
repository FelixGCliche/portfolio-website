import { sessions } from '@features/sessions'

import { Placeholder } from '../Placeholder'

const session = sessions.find((s) => s.key === '/about')

export const AboutResponse = () => (
  <Placeholder title="/about" meta={session?.meta} desc={session?.desc ?? ''} />
)
