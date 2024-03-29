<template>
  <header
    class="header"
    :class="{ 'header-sticky': isSticky }"
    ref="headerRef"
  >
    <div
      class="navbar"
      :class="{ 'navbar-open': toggled }"
    >
      <div
        class="navbar-button"
        :class="{ 'navbar-button-open': toggled }"
      >
        <ButtonIcon
          label="menu"
          dir="rtl"
          @button-click.prevent="toggle"
        >
          <IconMenu
            icon-name="menu"
            :size="24"
          />
        </ButtonIcon>
      </div>
      <div
        class="navbar-menu"
        :class="[toggled ? 'navbar-menu-open' : 'navbar-menu-closed']"
        @click.prevent="onNavbarClicked"
      >
        <NavigationTree />
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
const { toggled, toggle, toggleOff } = useToggle()
const { isSticky, onStick } = useSticky()
const headerRef = ref<HTMLElement | null>(null)

onMounted(() => {
  onStick(headerRef?.value!)
})

const onNavbarClicked = () => {
  if (toggled) {
    toggleOff()
  }
}
</script>

<style lang="scss" scoped>
@use 'sass:map';

.header {
  @include layout.layout-grid {
    padding-top: 2rem;
    padding-bottom: 2rem;
  }
  position: sticky;
  top: -1px;
  z-index: 24;
  background-color: theme.$background;

  &-sticky {
    @include layout.layout-grid {
      padding-top: 2rem;
      padding-bottom: 0;
    }
    box-shadow: 0 2rem 1rem 0.25rem theme.$background;
  }

  @include layout.media-query('xsmall') {
    @include layout.layout-grid {
      padding-top: 1rem;
      padding-bottom: 1rem;
    }
    position: sticky;
    top: -1px;
    z-index: 24;
    background-color: theme.$background;

    &-sticky {
      @include layout.layout-grid;

      padding-top: 1rem;
      padding-bottom: 0;
      box-shadow: 0 1rem 1rem 0.25rem theme.$background;
    }
  }
}

.navbar {
  @include layout.layout-grid-cell-full;
  align-self: center;
  backdrop-filter: blur(0rem);

  &-open {
    @include layout.layout-grid-cell-full($margins: false);
    position: fixed;
    top: 0;
    width: 100%;
    height: 100%;
    padding: 1rem map.get(layout.$default-margin, 'xsmall');
    backdrop-filter: blur(1rem);
    background-color: rgba(theme.$background, 0.67);
    transition: backdrop-filter 0.66s cubic-bezier(0.6, 0, 0.07, 1);
  }

  &-button {
    display: none;

    @include layout.media-query('xsmall') {
      @include layout.layout-grid-cell-full;
      display: flex;
      justify-content: flex-end;
    }
  }

  &-menu {
    opacity: 1;

    @include layout.media-query('xsmall') {
      width: 0;
      height: 0;
      opacity: 0;
      pointer-events: all;
      transform: translateX(100%);
    }

    &-open {
      display: flex;
      width: 100%;
      height: 100%;
      justify-content: flex-end;
      opacity: 1;
      transform: translateX(0%);
      transition: transform 1s cubic-bezier(0.6, 0, 0, 1);
    }

    &-closed {
      @include layout.media-query('xsmall') {
        pointer-events: none;
      }
    }
  }
}
</style>
