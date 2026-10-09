<script setup lang="ts">
  import { watch } from "vue";
  import {
    DsfrAlert,
    DsfrButton,
    DsfrButtonGroup,
    DsfrModal,
  } from "@gouvminint/vue-dsfr";
  import GeoCaptchaPreview from "@/components/GeoCaptchaPreview.vue";
  import { useGeoCaptchaPreview } from "@/composables/useGeoCaptchaPreview";
  import type { GeoCaptchaLocation } from '@/utils/geocaptcha/location'
  import type { GeoCaptchaMode } from '@/utils/geocaptcha/modes'

  const props = defineProps<{
    opened: boolean,
    location: GeoCaptchaLocation | null,
    mode: GeoCaptchaMode | '',
    apiKey?: string,
    appId?: string,
  }>();

  const emit = defineEmits<{
    (e: 'update:opened', value: boolean): void
    (e: 'saved', id: string): void
    (e: 'refused'): void
  }>();

  const {
    foregroundSrc,
    backgroundSrc,
    loading,
    error,
    saving,
    saveError,
    open,
    save,
    close,
  } = useGeoCaptchaPreview(() => ({
    apiKey: props.apiKey ?? '',
    appId: props.appId ?? '',
  }));

  watch(
    () => props.opened,
    (isOpen) => {
      if (!isOpen && props.location && props.mode) {
        open(props.location, props.mode);
      } else if (!isOpen) {
        close()
        document.body.style.overflow = 'auto'
      }
    },
  )

  /** Saves the GeoCaptcha, then reports it and closes the modal. Stays open on failure. */
  async function onAccept() {
    const id = await save();
    if (id) {
      emit('saved', id);
      emit('update:opened', false);
    }
  }

  /** Reports the refusal and loses the modal. Ignored while a save is in progress. */
  function onRefuse() {
    if (saving.value) return;
    emit('refused');
    emit('update:opened', false);
  }
</script>

<template>
  <DsfrModal
      :opened="opened"
      title="GéoCaptcha généré :"
      icon="ri-arrow-right-line"
      @close="onRefuse"
  >
    <p>Voici un GéoCaptcha correspondant à la zone géographique choisie :</p>

    <GeoCaptchaPreview
        :foreground-src="foregroundSrc"
        :background-src="backgroundSrc"
        :loading="loading"
        :error="error"
    />


    <DsfrAlert v-if="saveError" type="error" title="Enregistrement impossible">
      {{ saveError }}
    </DsfrAlert>

    <template #footer>
      <DsfrButtonGroup align="right" inline-layout-when="large" reverse>
        <li>
          <DsfrButton
              type="button"
              label="Accepter"
              icon="ri-checkbox-circle-line"
              :disabled="saving || loading || !!error || !foregroundSrc"
              @click="onAccept"
          />
        </li>
        <li>
          <DsfrButton
              type="button"
              label="Refuser"
              secondary
              icon="ri-close-circle-line"
              :disabled="saving"
              @click="onRefuse"
          />
        </li>
      </DsfrButtonGroup>
    </template>
  </DsfrModal>
</template>

<style scoped>

</style>