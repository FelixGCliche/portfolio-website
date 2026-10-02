import { sessions } from '@features/sessions'

import { Placeholder } from '../Placeholder'

const session = sessions.find((s) => s.key === '/contact')

export const ContactResponse = () => (
  <Placeholder title="/contact" meta={session?.meta} desc={session?.desc ?? ''} />
)
