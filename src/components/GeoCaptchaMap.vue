<script setup lang="ts">
  import { onMounted, ref } from "vue"
  import { DsfrButton } from "@gouvminint/vue-dsfr"
  import { useBoxDrawMap } from "@/composables/useBoxDrawMap"
  import type { BBox } from "@/utils/geo/random"

  const emit = defineEmits<{
    (e: 'box-drawn', bbox: BBox): void
    (e: 'clear'): void
  }>();

  const mapEl = ref<HTMLElement | null>(null);

  const { init, clear } = useBoxDrawMap(mapEl, {
    onBoxDrawn: (bbox) => emit('box-drawn', bbox),
    onClear: () => emit('clear'),
  });

  onMounted(init)
  defineExpose({ clear })
</script>

<template>
  <div class="map-container">
    <div ref="mapEl" class="map" />
    <DsfrButton
      class="fr-mt-2w"
      label="Annuler la selection"
      secondary
      type="button"
      @click="clear"
    />
  </div>
</template>

<style scoped>
  .map {
    width: 100%;
    height: 300px;
    margin-top: 40px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
  .map:fullscreen, .map:-webkit-full-screen {
    height: 100vh;
    margin: 0;
  }
</style>