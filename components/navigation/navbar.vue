<template>
  <nav class="navbar-container">
    <div class="navbar-header">
      <IconButton v-if="device == 'small'" dir="rtl" label="menu" @click="open">
        <MenuIcon :size="24" />
      </IconButton>
      <NavigationLinks v-else />
    </div>
    <Transition name="slide-in">
      <div class="navbar-content" v-if="opened" @click.prevent="close">
        <div class="navbar-header">
          <IconButton dir="rtl" label="menu" @click.prevent="close">
            <ClearIcon :size="24" />
          </IconButton>
        </div>
        <NavigationLinks />
      </div>
    </Transition>
  </nav>
</template>

<script lang="ts" setup>
const emit = defineEmits(["click"]);

const opened = ref(false);
const device = ref("large");

const close = (event: Event) => {
  opened.value = false;
  emit("click", event);
  console.log("closed:", event);
};

const open = (event: Event) => {
  opened.value = true;
  emit("click", event);
  console.log("opened:", event);
};

const handleResize = () => {
  device.value = getComputedStyle(document.documentElement).getPropertyValue(
    "--device-size"
  );
};

onBeforeMount(() => {
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.addEventListener("resize", handleResize);
});
</script>

<style lang="scss" scoped>
@use "sass:map";

.navbar-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 16px;

  @include layout.media-query("large") {
    padding: 16px 156px;
  }
}
.navbar-content {
  display: grid;
  grid-template-rows: auto 1fr;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: theme.$surface;
}

.slide-in-enter-active,
.slide-in-leave-active {
  transition: opacity 100ms ease-out, transform 200ms ease-out;
}
.slide-in-enter,
.slide-in-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
