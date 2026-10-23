<script setup lang="ts">
  import { onMounted, ref, watch } from "vue";
  import { DsfrAlert } from "@gouvminint/vue-dsfr";
  import HeatmapLegend from "@/components/HeatmapLegend.vue";
  import { useHeatmapMap } from "@/composables/useHeatmapMap";
  import { useKingpinTiles } from "@/composables/useKingpinTiles";
  import { tileCenterToLonLat } from "@/utils/geo/tile";

  const props = defineProps<{
    apiKey?: string;
    appId?: string;
  }>();

  const mapEl = ref<HTMLElement | null>(null);

  const { init, setPoints } = useHeatmapMap(mapEl);
  const { tiles, loading, error, truncated, load } = useKingpinTiles(() => ({
    apiKey: props.apiKey ?? "",
    appId: props.appId ?? "",
  }));

  watch(tiles, (list) => setPoints(list.map(({ x, y }) => tileCenterToLonLat(x, y))));

  onMounted(() => {
    init(); // The base map shows right away, the heat appears once the data is loaded.
    load();
  });
</script>

<template>
  <div class="heatmap">
    <div class="heatmap__frame">
      <div ref="mapEl" class="heatmap__map" />

      <HeatmapLegend />

      <p v-if="loading" class="heatmap__status fr-text--sm fr-mb-0" role="status">
        Chargement des GéoCaptchas…
      </p>
    </div>

    <DsfrAlert v-if="error" type="error" title="Carte de chaleur indisponible">
      {{ error }}
    </DsfrAlert>

    <DsfrAlert v-else-if="truncated" type="warning" title="Données partielles">
      Tous les GéoCaptchas n'ont pas pu être chargés : la carte est incomplète.
    </DsfrAlert>
  </div>
</template>

<style scoped>
  .heatmap {
    margin-bottom: 50px;
  }

  .heatmap__frame {
    position: relative;
    width: 100%;
    height: 500px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }

  .heatmap__map {
    width: 100%;
    height: 100%;
  }

  .heatmap__status {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 30;
    padding: 0.25rem 0.75rem;
    border-radius: 05rem;
    color: var(--text-default-grey);
    background-color: var(--background-default-grey);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
</style>
