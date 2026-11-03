import type { Component } from 'solid-js'

import type { TopicKey } from '@features/topics'

import { AboutResponse } from './AboutResponse'
import { ContactResponse } from './ContactResponse'
import { ProjectsResponse } from './ProjectsResponse'
import { ResumeResponse } from './ResumeResponse'
import { SkillsResponse } from './SkillsResponse'
import { WorkResponse } from './WorkResponse'

/** Props every topic response receives; only `/projects` reads `projects` (the slugs to list). */
export type TopicResponseProps = { projects?: readonly string[] }

export const responses: Record<TopicKey, Component<TopicResponseProps>> = {
  '/about': AboutResponse,
  '/work': WorkResponse,
  '/projects': ProjectsResponse,
  '/skills': SkillsResponse,
  '/resume': ResumeResponse,
  '/contact': ContactResponse,
}
