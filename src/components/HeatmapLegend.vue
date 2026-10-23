<script setup>
  import { computed, ref } from "vue";
  import { DsfrButton } from "@gouvminint/vue-dsfr";
  import { HEATMAP_GRADIENT } from "@/utils/geocaptcha/heatmap.ts";

  const expanded = ref(true);

  const gradientCss = computed(
    () => `linear-gradient(to right, ${HEATMAP_GRADIENT.slice(1).join(', ')})`,
  )
</script>

<template>
  <aside
      class="heatmap-legend"
      aria-label="Légende de la carte de chaleur"
  >
    <div class="heatmap-legend__header">
      <h3
          v-if="expanded"
          class="fr-text--sm fr-text--bold fr-mb-0"
      >
        Légende
      </h3>

      <DsfrButton
          type="button"
          :icon="expanded ? 'ri-close-line' : 'ri-arrow-up-s-line'"
          icon-only
          tertiary
          no-outline
          size="sm"
          :title="expanded ? 'Masquer la légende' : 'Afficher la légende'"
          :aria-label="expanded ? 'Masquer la légende' : 'Afficher la légende'"
          :aria-expanded="expanded"
          @click="expanded = !expanded"
      />
    </div>

    <template v-if="expanded">
      <p class="fr-text--xs fr-mb-1v">
        Présence de GéoCaptcha :
      </p>

      <div
          class="heatmap-legend__gradient"
          :style="{ background: gradientCss }"
          role="img"
          aria-label="Dégradé de couleurs, de faible à forte présence"
      />

      <div class="heatmap-legend__labels fr-text--xs">
        <span>Faible présence</span>
        <span>Forte présence</span>
      </div>
    </template>
  </aside>
</template>

<style scoped>
  .heatmap-legend {
    position: absolute;
    bottom: 20px;
    left: 20px;
    z-index: 30;
    width: fit-content;
    max-width: calc(100% - 40px);
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    color: var(--text-default-grey);
    background-color: var(--background-default-grey);
    background-color: color-mix(in srgb, var(--background-default-grey) 85%, transparent);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }

  .heatmap-legend:has(.heatmap-legend__labels) {
    width: 350px;
  }

  .heatmap-legend__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .heatmap-legend__gradient {
    height: 16px;
    border-radius: 4px;
  }

  .heatmap-legend__labels {
    display: flex;
    justify-content: space-between;
    margin-top: 4px;
  }
</style>