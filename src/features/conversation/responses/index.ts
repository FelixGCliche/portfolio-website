import type { Component } from 'solid-js'

import type { SessionKey } from '@features/sessions'

import { AboutResponse } from './AboutResponse'
import { ContactResponse } from './ContactResponse'
import { ResumeResponse } from './ResumeResponse'
import { SkillsResponse } from './SkillsResponse'
import { WorkResponse } from './WorkResponse'

export { AboutResponse, ContactResponse, ResumeResponse, SkillsResponse, WorkResponse }

export const responses: Record<SessionKey, Component> = {
  '/about': AboutResponse,
  '/work': WorkResponse,
  '/skills': SkillsResponse,
  '/resume': ResumeResponse,
  '/contact': ContactResponse,
}
