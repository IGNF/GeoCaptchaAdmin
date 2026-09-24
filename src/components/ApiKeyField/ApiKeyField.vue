<script lang="ts" setup>
  import type { ApiKeyFieldProps} from "./ApiKeyField.types";

  import { computed } from 'vue'
  import { DsfrButton, DsfrInput } from "@gouvminint/vue-dsfr";

  const props = withDefaults(defineProps<ApiKeyFieldProps>(), {
    id: '',
    label: 'Clé API',
    modelValue: '',
    placeholder: 'clé API pour le dashboard',
    locked: false,
    validateText: 'Valider',
    editText: 'Modifier la clé',
  })


  const emit = defineEmits<{
    /** Emitted at each change (v-model compatible) */
     'update:modelValue': [payload: string | number | undefined]
    /** Emitted at submission: validates the key (if unlocked) or mofify it (if locked) */
    'toggle-lock': []
  }>()

  // Unique ID per-instance (for both desktop and mobile display
  const uid = Math.random().toString(36).slice(2, 8)
  const inputId = computed(() => props.id || `api-key-input-${uid}`)
  const buttonText = computed(() => (props.locked ? props.editText : props.validateText))
</script>

<template>
  <form
    class="api-key-field"
    @submit.prevent="emit('toggle-lock')"
  >
    <DsfrInput
        :id="inputId"
        type="password"
        autocomplete="off"
        :label="label"
        :placeholder="placeholder"
        :model-value="modelValue"
        :disabled="locked"
        :aria-disabled="locked"
        @update:model-value="emit('update:modelValue', $event)"
    />
    <DsfrButton
      type="submit"
      :title="buttonText"
    >
      {{ buttonText }}
    </DsfrButton>
  </form>
</template>

<style scoped>
  .api-key-field {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .api-key-field > :deep(.fr-input) {
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
  }

  .api-key-field > :deep(.fr-btn) {
    flex: 0 0 auto;
  }

  /**
   * Le DSFR code la couleur en dur sans tenir compte de l'état disabled
   * (même contournement que dans DsfrSearchBar).
   */
  .api-key-field :deep(.fr-input:disabled) {
    box-shadow: inset 0 -2px 0 0 var(--border-disabled-grey);
    color: var(--text-disabled-grey);
  }
</style>