<script setup lang="ts">
  import { watch } from "vue";
  import { useCaptchaRotation } from "@/composables/useCaptchaRotation";

  const props = defineProps<{
    foregroundSrc: string
    backgroundSrc: string
    loading?: boolean
    error?: string
  }>()

  const {
    angle,
    randomize,
    onPointerDown,
    onPointerMove,
    onPointerUp
  } = useCaptchaRotation();

  // New images = new starting angle
  watch(() => props.foregroundSrc, randomize)
</script>

<template>
  <div class="image-container">
    <div
      class="captchas"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <div class="captcha-kingpin">
        <div class="layer layer-base">
          <img v-if="backgroundSrc" :src="backgroundSrc" alt="Fond du GéoCaptcha">
        </div>

        <div class="layer layer-stacked" :style="{ transform: `rotate(-${angle}deg)` }">
          <div class="cropped">
            <img v-if="foregroundSrc" :src="foregroundSrc" alt="Disque du GéoCaptcha">
          </div>
          <div class="grab" />
        </div>
      </div>
    </div>

    <p v-if="loading">Chargement de l'image...</p>
    <p v-else-if="error" class="fr-error-text">{{ error }}</p>
  </div>
</template>

<style scoped>
  .image-container {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    margin: 0 auto;
    width: 100%;
    max-width: 256px;
    height: 225px;
  }

  .captchas {
    width: 256px;
    height:200px;
    margin: 50px auto;
    box-shadow:0 0 0 1px;
    background:#d3d3d3;
    user-select: none;
    touch-action: none;
  }

  .captcha-kingpin {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
  }

  .layer-base {
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  .layer-base img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .layer-stacked .cropped img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .captcha-kingpin .cropped img {
    position: absolute;
    width: 256px;
    height: 200px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    object-fit: none;
  }

  .captcha-kingpin .layer-base img {
    width: 256px;
    height: 200px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .captcha-kingpin .layer {
    position: absolute;
    width: 100%;
    height: 100%;
    background-position: 50% 50%;
  }

  .captcha-kingpin .layer-stacked {
    cursor: grab;
    position: absolute;
    width: 150px;
    height: 150px;
    top: 25px;
    left: 0;
    right: 0;
    margin: auto;
  }

  .captcha-kingpin .cropped {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 0 1px 3px, 0 0 0 15px rgba(36,60,71,.25);
  }

  .captcha-kingpin .grab {
    cursor: grab;
    position: absolute;
    z-index: 1;
    right: -10px;
    top: 60px;
    width: 20px;
    height: 30px;
    border-radius: 3px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 30'%3E%3Cpath d='m5,10h10M5,15h10M5,20h10' stroke='white' stroke-width='2'/%3E%3C/svg%3E");
    background-color: #243c47;
  }

  .captcha-kingpin .grab:hover {
    background-color: #30a7df;
  }
</style>