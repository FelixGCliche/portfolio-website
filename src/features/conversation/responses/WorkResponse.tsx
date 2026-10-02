import { getSession } from '@features/sessions'

import { Placeholder } from '../Placeholder'

const session = getSession('/work')

export const WorkResponse = () => <Placeholder session={session} />
