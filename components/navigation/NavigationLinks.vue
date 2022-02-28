<template>
  <nav class="navlinks">
    <NuxtLink class="navlink" to="/">Home</NuxtLink>
    <NuxtLink class="navlink" to="/skills">Skills</NuxtLink>
    <NuxtLink class="navlink" to="/experiences">Experiences</NuxtLink>
    <NuxtLink class="navlink" to="/portfolio">Portfolio</NuxtLink>
    <NuxtLink class="navlink" to="/contact">Contact</NuxtLink>
  </nav>
</template>

<script lang="ts" setup>
</script>

<style lang="scss" scoped>
@use 'sass:map';

.navlinks {
  display: flex;
  flex-flow: row nowrap;
  gap: 24px;

  @include layout.media-query("small") {
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    gap: 32px;
  }
}
.navlink {
  @each $size in map.keys(layout.$breakpoints) {
    @include layout.media-query($size) {
      @if $size != "small" {
        @include theme.typography-label($size);
      } @else {
        @include theme.typography-headline($size);
      }
    }
  }
  color: theme.$primary;

  &:hover,
  &:active {
    @include theme.pressed(theme.$secondary);
  }
}
</style>