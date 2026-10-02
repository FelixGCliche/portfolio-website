import { getSession } from '@features/sessions'

import { Placeholder } from '../Placeholder'

const session = getSession('/contact')

export const ContactResponse = () => <Placeholder session={session} />
