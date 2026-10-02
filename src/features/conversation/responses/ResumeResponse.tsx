import { getSession } from '@features/sessions'

import { Placeholder } from '../Placeholder'

const session = getSession('/resume')

export const ResumeResponse = () => <Placeholder session={session} />
