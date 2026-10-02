import { getSession } from '@features/sessions'

import { Placeholder } from '../Placeholder'

const session = getSession('/about')

export const AboutResponse = () => <Placeholder session={session} />
