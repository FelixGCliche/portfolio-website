import { useI18n } from '@features/i18n'

export const NotFound = () => {
  const { t } = useI18n()

  return (
    <div class="flex flex-col gap-2">
      <h1 class="text-primary text-lg">404</h1>
      <p class="text-muted-foreground text-sm">{t('notFound.body')}</p>
    </div>
  )
}
