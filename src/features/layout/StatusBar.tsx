export const StatusBar = () => (
  <footer class="bg-card border-border flex flex-none items-stretch overflow-hidden border-t text-[10.5px] tabular-nums sm:text-[11px]">
    <span class="bg-primary text-primary-foreground px-2.5 py-1 font-bold tracking-[0.06em] whitespace-nowrap sm:px-3">
      FELIX
    </span>
    <span class="text-foreground min-w-0 flex-1 truncate px-2.5 py-1 sm:px-3">~/portfolio</span>
    <div class="ml-auto flex flex-none items-stretch">
      <span class="border-border text-success hidden border-l px-2.5 py-1 whitespace-nowrap sm:block">
        <span aria-hidden="true">●</span> available
      </span>
      <span class="border-border hidden border-l px-2.5 py-1 whitespace-nowrap md:block">en</span>
      <span class="border-border hidden border-l px-2.5 py-1 whitespace-nowrap md:block">
        utf-8
      </span>
      <span class="border-border hidden border-l px-2.5 py-1 whitespace-nowrap xl:block">100%</span>
      <span class="bg-primary text-primary-foreground px-2.5 py-1 font-bold whitespace-nowrap sm:px-3">
        --:--
      </span>
    </div>
  </footer>
)
