<script setup lang="ts">
  import { computed } from 'vue';
  import {
    GAUGE_ARC_LENGTH,
    GAUGE_RADIUS,
    gaugeColor,
    gaugeRatio,
  } from "@/utils/gauge";

  const props = withDefaults(
    defineProps<{
      /** Value to display */
      value: number;
      min?: number;
      max?: number;
      /** Caption shown under the gauge, also used as its accessible name. */
      label?: string;
    }>(),
    { min: 0, max: 100, label: '' },
  );

  const CENTER = 100;
  const arcPath = [
    `M${CENTER - GAUGE_RADIUS} ${CENTER}`,
    `A ${GAUGE_RADIUS} ${GAUGE_RADIUS} 0 0 1 ${CENTER + GAUGE_RADIUS} ${CENTER}`,
  ].join(' ');

  const ratio = computed(() => gaugeRatio(props.value, props.min, props.max));

  /** Visible length of the colored arc, followed by the full arc length. */
  const dashArray = computed(() => `${ratio.value * GAUGE_ARC_LENGTH} ${GAUGE_ARC_LENGTH}`);

  const color = computed(() => gaugeColor(ratio.value));
</script>

<template>
  <div class="gauge">
    <svg
      width="150"
      height="100"
      viewBox="0 0 200 130"
      role="meter"
      :aria-valuenow="value"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-label="label || undefined"
    >
      <!-- Background arc -->
      <path class="gauge__track" :d="arcPath" stroke-width="12" fill="none" />

      <!-- Colored arc, as long as the value is high -->
      <path
        :d="arcPath"
        :stroke="color"
        stroke-width="12"
        fill="none"
        :stroke-dasharray="dashArray"
      />

      <text class="gauge__bound" x="15" y="120">{{ min }}</text>
      <text class="gauge__bound" x="170" y="120">{{ max }}</text>

      <text class="gauge__value" x="100" y="100" text-anchor="middle" :fill="color">
        {{ value }}
      </text>
    </svg>

    <div v-if="label" class="gauge__label fr-text--sm fr-mb-0">{{ label }}</div>
  </div>
</template>

<style scoped>
  .gauge {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px;
  }

  .gauge__track {
    stroke: var(--background-contrast-grey);
  }

  .gauge__bound {
    font-size: 12px;
    fill: var(--text-mention-grey);
  }
  .gauge__value {
    font-size: 50px;
    font-weight: bold;
  }

  .gauge__label {
    margin-top: 5px;
    color: var(--text-mention-grey);
  }
</style>