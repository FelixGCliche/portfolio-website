import { createFileRoute } from '@tanstack/solid-router'

import { ContactResponse } from '@features/conversation'

const Contact = () => (
  <section class="flex flex-col gap-4">
    <ContactResponse />
  </section>
)

export const Route = createFileRoute('/contact')({
  component: Contact,
})
