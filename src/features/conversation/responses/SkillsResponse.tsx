import { getSession } from '@features/sessions'

import { Placeholder } from '../Placeholder'

const session = getSession('/skills')

export const SkillsResponse = () => <Placeholder session={session} />
