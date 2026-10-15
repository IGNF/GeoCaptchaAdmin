<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'

  // vue-dsfr
  import {
    DsfrSegmentedSet,
    DsfrButton,
    DsfrButtonGroup,
    DsfrSelect,
    DsfrInputGroup,
    DsfrAlert,
    DsfrFieldset
  } from "@gouvminint/vue-dsfr";

  import GeoCaptchaMap from "@/components/GeoCaptchaMap.vue";
  import GeoCaptchaModal from "@/components/GeoCaptchaModal.vue";
  import { useExtraCoordinateMode } from "@/composables/useExactCoordinates";
  import { useRandomMode } from "@/composables/useRandomMode";
  import { useMapMode } from "@/composables/useMapMode";
  import { useTimedAlert } from "@/composables/useTimedAlert";
  import type { BBox } from "@/utils/geo/coordinates";
  import type { GeoCaptchaLocation } from "@/utils/geocaptcha/location";
  import {
    GEOCAPTCHA_MODES,
    pickRandomMode,
    type GeoCaptchaMode,
  } from "@/utils/geocaptcha/modes";

  defineProps<{
    apiKey: string;
    appId: string;
  }>()

  // === Form state ===
  /**
   * Location mode:
   * - `1` => on the map
   * - `2` => exact coordinates
   * - `3` => random
   */
  const selectedOption = ref('1');
  const mode = ref<GeoCaptchaMode | ''>('');
  const modeError = ref('');
  /** Validated location handed to the modal. */
  const generated = ref<GeoCaptchaLocation | null>(null);
  const isModalOpen = ref(false);

  const geoMap = ref<InstanceType<typeof GeoCaptchaMap> | null>(null);
  const modeOptions = [...GEOCAPTCHA_MODES]

  const exact = reactive(useExtraCoordinateMode());
  const random = reactive(useRandomMode());
  const mapMode = reactive(useMapMode());

  // Three independent timed alerts: errors (shared by the three modes), saved, refused
  const { alert: errorAlert, show: showErrorAlert, hide: hideErrorAlert } = useTimedAlert();
  const { alert: successAlert, show: showSuccessAlert } = useTimedAlert();
  const { alert: refusalAlert, show: showRefusalAlert } = useTimedAlert();

  onMounted(() => window.scrollTo(0, 0));

  // === Selection of the local mode ===

  /** Switching mode clears everything the previous mode produced. */
  async function handleOptionChange(value: string) {
    mode.value = '';
    modeError.value = '';
    generated.value = null;
    hideErrorAlert();
    mapMode.reset();
    exact.reset();

    if (value === '3') await rollRandom();
  }

  /** "Sur la carte" mode: a box was drawn, picks a point in it. */
  async function onBoxDrawn(bbox: BBox) {
    const result = await mapMode.pick(bbox);

    if (result.status === 'ok') {
      mode.value = pickRandomMode();
      return;
    }

    if (result.status === 'stale') return;

    geoMap.value?.clear();
    if (result.status === 'outside') {
      showErrorAlert(
        'Zone invalide',
        'Impossible de générer un GéoCaptcha en dehors de la France. Veuillez sélectionner une zone en France.',
      );
    } else {
      showErrorAlert(
        'Erreur réseau',
        "La localisation n'a pas pu être déterminée, veuillez réessayer.",
      );
    }
  }

  /** "Aléatoire" mode: draw a new random location and imagery mode. */
  async function rollRandom() {
    modeError.value = '';
    const location = await random.roll();

    if (location) {
      mode.value = pickRandomMode();
    } else if (random.error) {
      showErrorAlert('Génération impossible', random.error);
    }
  }

  // === Form submission ===

  /** Validates the chosen location and mode, then opens the preview modal. */
  async function validateAndCreateGeoCaptcha() {
    modeError.value = '';
    let location: GeoCaptchaLocation | null = null;

    if (selectedOption.value === '1') {
      location = mapMode.location;
      if (!location) {
        showErrorAlert(
          'Zone non sélectionnée',
          'Veuillez dessiner une boîte et générer un point aléatoire sur la carte.',
        );
        return;
      }
    } else if (selectedOption.value === '2') {
      location = await exact.validate()
    } else {
      location = random.location;
      if (!location) {
        showErrorAlert(
          'Aucune localisation',
          "Générez d'abord une localisation aléatoire.",
        );
        return;
      }
    }

    if (!mode.value) modeError.value = 'Le mode est obligatoire.';
    if (!location || !mode.value) return; // Both kinds of errors are shown together

    generated.value = location;
    isModalOpen.value = true;
  }

  // === Modal results ===

  function onSaved(id: string) {
    showSuccessAlert(
      'Succès de la création',
      `GéoCaptcha créé avec succès ! ID : ${id}`,
    );
  }

  function onRefused() {
    showRefusalAlert(
      'Tuile refusée',
      'GéoCaptcha non enregistré.',
    );
  }
</script>

<template>
  <div class="generation">
    <h1 class="fr-h1">Générer un GéoCaptcha</h1>
  </div>
  <div class="geo-captcha">
    <div class="fr-container fr-container--fluid fr-mb-md-14v">
      <div class="fr-grid-row fr-grid-row--gutters fr-grid-row--center">
        <div class="fr-col-12 fr-col-md-8 fr-col-lg-6">
          <div class="fr-container fr-background-alt--grey fr-px-md-0 fr-pt-10v fr-pt-md-14v fr-pb-6v fr-pb-md-10v">
            <div class="fr-grid-row fr-grid-row--gutters fr-grid-row--center">
              <div class="fr-col-12 fr-col-md-9 fr-col-lg-8"> 

                <!-- Form area -->
                <form @submit.prevent="validateAndCreateGeoCaptcha">
                  <DsfrFieldset>
                    <template #legend>
                      <span class="fr-h4">Paramètres de génération</span>
                    </template>

                    <template #hint>
                      En choisissant un mode, vous pourrez générer un GéoCaptcha en France métropolitaine et dans les DOM-TOM.
                    </template>

                    <!-- Choice between the 3 options : Sur la carte, Coordonnées précises and Aléatoire -->
                    <DsfrSegmentedSet
                        v-model="selectedOption"
                        name="segmented-2073"
                        :options="[
                          {
                            value: '1',
                            label: 'Sur la carte',
                            icon: 'ri-road-map-line',
                          },
                          {
                            value: '2',
                            label: 'Coordonnées exactes',
                            icon: 'ri-map-pin-2-line'
                          },
                          {
                            value: '3',
                            label: 'Aléatoire',
                            icon: 'ri-question-mark'
                          }
                      ]"
                        @update:model-value="handleOptionChange"
                    />

                    <!-- Phrase en fonction de l'option choisi -->
                    <p v-if="selectedOption === '1'" class="choix-zone">
                      Sélectionnez une zone où un GéoCaptcha sera généré. Cliquez une première fois pour initier la sélection, étendez la zone, puis cliquez à nouveau pour valider.
                    </p>
                    <p v-if="selectedOption === '2'" class="choix-zone">
                      Le GéoCaptcha sera généré dans le département de France que vous aurez choisi.
                    </p>
                    <p v-if="selectedOption === '3'" class="choix-zone">
                      Le GéoCaptcha sera généré avec une localisation aléatoire en France.
                    </p>

                    <!-- Sur la carte option -->
                    <div v-if="selectedOption === '1'">
                      <GeoCaptchaMap
                        ref="geoMap"
                        @box-drawn="onBoxDrawn"
                        @clear="mapMode.reset"
                      />

                      <div v-if="mapMode.location" class="mt-3">
                        <p><strong>Point aléatoire dans la boîte :</strong></p>

                        <DsfrInputGroup
                            :model-value="mapMode.location.latitude"
                            type="number"
                            step="any"
                            label="Latitude"
                            readonly
                        />

                        <DsfrInputGroup
                            :model-value="mapMode.location.longitude"
                            type="number"
                            step="any"
                            label="Longitude"
                            readonly
                        />
                      </div>
                    </div>

                    <!-- Exact coordinates option -->
                    <div v-if="selectedOption === '2'">
                      <DsfrSelect
                          v-model="exact.departmentCode"
                          label="Département"
                          :options="exact.departmentOptions"
                          placeholder="Sélectionner un département"
                          :error-message="exact.errors.departement"
                          required
                      />

                      <DsfrInputGroup
                          v-model="exact.latitude"
                          type="number"
                          step="any"
                          label="Latitude"
                          :labelVisible="true"
                          :placeholder="exact.latitudePlaceholder"
                          :error-message="exact.errors.latitude"
                          required
                      />

                      <DsfrInputGroup
                          v-model="exact.longitude"
                          type="number"
                          step="any"
                          label="Longitude"
                          :labelVisible="true"
                          :placeholder="exact.longitudePlaceholder"
                          :error-message="exact.errors.longitude"
                          required
                      />

                      <DsfrInputGroup
                          v-model="exact.zipcode"
                          type="text"
                          label="Code postal (facultatif)"
                          :labelVisible="true"
                          placeholder="Complété automatiquement si vide"
                          :error-message="exact.errors.zipcode"
                      />

                      <p v-if="exact.errors.location" class="fr-error-text">
                        {{ exact.errors.location }}
                      </p>
                    </div>

                    <!-- Aléatoire option -->
                    <div v-if="selectedOption === '3'">
                      <DsfrInputGroup
                          :model-value="random.department ? `${random.department.code} - ${random.department.nom}` : ''"
                          label="Département aléatoire"
                          readonly
                      />

                      <DsfrInputGroup
                          :model-value="random.location?.latitude ?? ''"
                          type="number"
                          step="any"
                          label="Latitude"
                          readonly
                      />

                      <DsfrInputGroup
                          :model-value="random.location?.longitude ?? ''"
                          type="number"
                          step="any"
                          label="Longitude"
                          readonly
                      />

                      <DsfrInputGroup
                          :model-value="random.location?.zipcode ?? ''"
                          type="text"
                          label="Code postal"
                          readonly
                      />
                    </div>

                    <!-- Shared Error Alert (shared by each three mode) -->
                    <DsfrAlert
                        v-if="errorAlert.visible"
                        type="error"
                        :title="errorAlert.title"
                    >
                      {{ errorAlert.message }}
                    </DsfrAlert>

                    <!-- Choix du mode -->
                    <DsfrSelect
                        v-model="mode"
                        label="Mode :"
                        :options="modeOptions"
                        placeholder="Choisissez un mode"
                        :error-message="modeError"
                        required
                    />

                    <!-- Bouton pour générer une tuile -->
                    <DsfrButtonGroup
                        align="right"
                        inline-layout-when="large"
                    >
                      <li v-if="selectedOption === '3'">
                        <DsfrButton
                            type="button"
                            icon="ri-refresh-line"
                            secondary
                            iconOnly
                            title="Choisir un autre département"
                            aria-label="Choisir un autre département"
                            :disabled="random.loading"
                            @click="rollRandom"
                        />
                      </li>

                      <li>
                        <DsfrButton
                            type="submit"
                            label="Générer"
                            :disabled="mapMode.loading || random.loading"
                        />
                      </li>
                    </DsfrButtonGroup>

                    <!-- Tile acceptation alert -->
                    <DsfrAlert
                        v-if="successAlert.visible"
                        type="success"
                        :title="successAlert.title"
                    >
                      {{ successAlert.message }}
                    </DsfrAlert>

                    <!-- Alerte de refus de la tuile -->
                    <DsfrAlert
                        v-if="refusalAlert.visible"
                        type="info"
                        :title="refusalAlert.title"
                    >
                      {{ refusalAlert.message }}
                    </DsfrAlert>
                  </DsfrFieldset>

                  <!-- GeoCaptcha display modal -->
                  <GeoCaptchaModal
                      v-model:opened="isModalOpen"
                      :location="generated"
                      :mode="mode"
                      :api-key="apiKey"
                      :app-id="appId"
                      @saved="onSaved"
                      @refused="onRefused"
                  />
                </form>
              </div>
            </div> 
          </div> 
        </div> 
      </div> 
    </div>
  </div>
</template>

<style scoped>

/* Styles pour le formulaire */
.fr-h1 {
  margin-top: 170px; 
  text-align: center;
}

.choix-zone {
  margin-top: 20px;
}

form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

</style>
