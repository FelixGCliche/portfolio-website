import type { Component } from 'solid-js'

import type { TopicKey } from '@features/topics'

import { AboutResponse } from './AboutResponse'
import { ContactResponse } from './ContactResponse'
import { ResumeResponse } from './ResumeResponse'
import { SkillsResponse } from './SkillsResponse'
import { WorkResponse } from './WorkResponse'

export const responses: Record<TopicKey, Component> = {
  '/about': AboutResponse,
  '/work': WorkResponse,
  '/skills': SkillsResponse,
  '/resume': ResumeResponse,
  '/contact': ContactResponse,
}
