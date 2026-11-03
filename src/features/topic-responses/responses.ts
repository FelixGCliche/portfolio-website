import type { Component } from 'solid-js'

import type { TopicKey } from '@features/topics'

import { AboutResponse } from './AboutResponse'
import { ContactResponse } from './ContactResponse'
import { ProjectsResponse } from './ProjectsResponse'
import { ResumeResponse } from './ResumeResponse'
import { SkillsResponse } from './SkillsResponse'
import { WorkResponse } from './WorkResponse'

export const responses: Record<TopicKey, Component> = {
  '/about': AboutResponse,
  '/work': WorkResponse,
  '/projects': ProjectsResponse,
  '/skills': SkillsResponse,
  '/resume': ResumeResponse,
  '/contact': ContactResponse,
}
