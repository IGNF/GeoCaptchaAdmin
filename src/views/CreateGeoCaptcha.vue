<script>

/*Bibliothèque OpenLayers*/
import { reactive } from 'vue'

// vue-dsfr
import {
  DsfrSegmentedSet,
  DsfrButton,
  DsfrButtonGroup,
  DsfrSelect,
  DsfrInputGroup,
  DsfrAlert,
  DsfrModal,
  DsfrFieldset
} from "@gouvminint/vue-dsfr";

import GeoCaptchaMap from "@/components/GeoCaptchaMap.vue";
import { useExtraCoordinateMode } from "@/composables/useExactCoordinates.ts";
import { useRandomMode } from "@/composables/useRandomMode.ts";
import { useMapMode } from "@/composables/useMapMode.ts";
import { useTimedAlert } from "@/composables/useTimedAlert.ts";
import { GEOCAPTCHA_MODES, pickRandomMode } from "@/utils/geocaptcha/modes.ts";

/*Service de logs*/
//import { auditService } from '@/services/audit-service';

export default {
  name: "CreateGeoCaptcha",
  components: {
    GeoCaptchaMap,
    DsfrSegmentedSet,
    DsfrButton,
    DsfrButtonGroup,
    DsfrSelect,
    DsfrInputGroup,
    DsfrAlert,
    DsfrModal,
    DsfrFieldset,
  },
  data() {
    return {
      selectedOption: "1",
      mode: "",
      modeError: "",
      generated: null, // Validated GeoCaptchaLocation, read by the modal

      // --- Modal ---
      isModalOpen: false,
      isSuccess: false,
      isRefuse: false,
      successMessage: "",
      imageTuile: "",
      backgroundImageTuile: "",
      rotationAngle: Math.floor(Math.random() * 360),
      startAngle: 0,
      bboxCenter: {},
      captcha: null,
    };
  },
  props: {
    apiKey: String,
    appId: String,
  },
  setup() {
    const {
      alert: errorAlert,
      show: showErrorAlert,
      hide: hideErrorAlert,
    } = useTimedAlert();

    return {
      // reactive() unwraps refs: in the template, exact.latitude works with v-model
      exact: reactive(useExtraCoordinateMode()),
      random: reactive(useRandomMode()),
      mapMode: reactive(useMapMode()),
      errorAlert,
      showErrorAlert,
      hideErrorAlert,
      modeOptions: GEOCAPTCHA_MODES,
    };
  },

  async mounted() {
    window.scrollTo(0, 0);
    this.rotationAngle = Math.floor(Math.random() * 360);
  },

  methods: {
    // === Selection of localisation mode ===
    async handleOptionChange(value) {
      this.mode = ''
      this.modeError = ''
      this.generated = null
      this.hideErrorAlert()
      this.mapMode.reset()
      this.exact.reset()

      if (value === '3') await this.rollRandom()
    },

    // "Sur la carte" mode : a box was drawn
    async onBoxDrawn(bbox) {
      const result = await this.mapMode.pick(bbox)

      if (result.status === 'ok') {
        this.mode = pickRandomMode()
        return;
      }
      if (result.status === 'stale') return

      this.$refs.geoMap?.clear()
      if (result.status === 'outside') {
        this.showErrorAlert(
          'Zone invalide',
          'Impossible de générer un GéoCaptcha en dehors de la France. Veuillez sélectionner une zone en France.'
        )
      } else {
        this.showErrorAlert(
          'Erreur réseau',
          "La localisation n'a pas pu être déterminée, veuillez réessayer.",
        )
      }
    },

    // "Aléatoire" mode
    async rollRandom() {
      this.modeError = ''
      const location = await this.random.roll()

      if (location) {
        this.mode = pickRandomMode()
      } else if (this.random.error) {
        this.showErrorAlert('Génération impossible', this.random.error)
      }
    },

    // === Form submission ===
    async validateAndCreateGeoCaptcha() {
      this.modeError = ''
      let location = null
      if (this.selectedOption === '1') {
        location = this.mapMode.location
        if (!location) {
          this.showErrorAlert(
            'Zone non sélectionnée',
            'Veuillez dessiner une boîte et générer un point aléatoire sur la carte.',
          )
          return;
        }
      } else if (this.selectedOption === '2') {
        location = await this.exact.validate() // Displays its own field errors
      } else {
        location = this.random.location
        if (!location) {
          this.showErrorAlert('Aucune localisation', "Générez d'abord une localisation aléatoire.")
          return;
        }
      }

      if (!this.mode) this.modeError = 'Le mode est obligatoire.'
      if (!location || !this.mode) return;

      this.generated = location
      await this.showGeoCaptchaTile()
    },

    // === Modal display ===
    async showGeoCaptchaTile() {
      const { latitude, longitude, zipcode } = this.generated

      // Conversion of latitude/longitude coordinates in tile coordinates
      const tileCoords = this.latLonToTile(latitude, longitude, 15)
      console.log('Tile coordinates: ', tileCoords);

      this.rotationAngle = Math.floor(Math.random() * 360);

      // Preparation of the API data
      const data = {
        id: this.generateUniqueId(),
        x: tileCoords.x,
        y: tileCoords.y,
        z: 15,
        zipcode,
        mode: this.mode,
        ok: '1',
      }
      console.log("Data sent to API: ", data);

      // In case mode is 'plan-sur-plan' - convert to 'plan' to make the mode work
      let actualMode = data.mode
      if (data.mode === 'plan-sur-plan') {
        actualMode = 'plan'
      }

      try {
        // Get the main image
        this.imageTuile = await this.getCaptchaImageTuile(actualMode, data.z, data.x, data.y);

        this.backgroundImageTuile = await this.getCaptchaImageTuile('plan', data.z, data.x, data.y)


        this.isModalOpen = true
      } catch (error) {
        console.error('Error: ', error);
      }
    },

    down(evt) {
      this.captcha = evt.currentTarget
      let bbox = this.captcha.getBoundingClientRect()
      this.bboxCenter = {
        x: bbox.left + bbox.width / 2,
        y: bbox.top + bbox.height / 2,
      }
      this.startAngle = (this.getAngle(evt) - this.rotationAngle + 720) % 360
      this.captcha._evt = this.move.bind(this)
      this.captcha.addEventListener('pointermove', this.captcha._evt)
    },

    up() {
      if (this.captcha) {
        this.captcha.removeEventListener('pointermove', this.captcha._evt)
      }
    },

    move(evt) {
      this.rotationAngle = (this.getAngle(evt) - this.startAngle + 720) % 360
    },

    getAngle(evt) {
      return -(
        (Math.atan2(this.bboxCenter.y - evt.clientY, this.bboxCenter.x - evt.clientX) * 180) /
        Math.PI
      )
    },

    async getCaptchaImageTuile(layer, tileMatrix, col, row) {
      // Récupération de l'image de la tuile à partir de l'API
      try {
        const response = await fetch(
            `http://127.0.0.1:3000/api/v1/admin/proxy/tile?layer=${layer}&tileMatrix=${tileMatrix}&col=${col}&row=${row}`,
            {
              method: 'GET',
              headers: {
                Accept: 'image/png',
                'x-api-key': this.apiKey,
                'x-app-id': this.appId,
              },
            },
        )
        if (!response.ok) throw new Error('Image non trouvée')
        return URL.createObjectURL(await response.blob())
      } catch (error) {
        console.log(error)
      }
    },

    // Function to convert latitude/longitude coordinates to tile coordinates
    latLonToTile(lat, lon, z) {
      const x = Math.floor((lon + 180) / 360 * Math.pow(2, z));
      const y = Math.floor(
          (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) /
          2 * Math.pow(2, z)
      );
      console.log(x, y);
      return { x, y };
    },

    // Function to generate a unique id
    // TODO: replace by a function which generate more trustworthy unique id
    generateUniqueId() {
      return Math.floor(Math.random() * 100000).toString();
    },

    closeModal() {
      this.isModalOpen = false;
      document.body.style.overflow = 'auto';
      this.isRefuse = true;
      setTimeout(() => {
        this.isRefuse = false;
      }, 3000);
    },

    async handleConserver() {
      const { latitude, longitude, zipcode } = this.generated;

      const tileCoords = this.latLonToTile(latitude, longitude, 15);
      const data = {
        id: this.generateUniqueId(),
        x: tileCoords.x,
        y: tileCoords.y,
        z: 15,
        zipcode,
        mode: this.mode,
        ok: '1',
      };

      try {
        // POST request to fetch the Kingpin
        const response = await fetch("http://127.0.0.1:3000/api/v1/admin/kingpin", {
          method: "POST",
          headers: {
            Accept: "*/*",
            "content-type": "application/json",
            "x-api-key": this.apiKey,
            "x-app-id": this.appId,
          },
          body: JSON.stringify(data),
        });
        console.log(response);

        if (!response.ok) {
          throw new Error("Error during GeoCaptchaCreation");
        }

        // Log of GeoCaptchaCreation
        // auditService.logCreate('/geo-captcha', `Création d'un GéoCaptcha`);

        const result = await response.json();
        console.log("Response to the API :", result);

        this.successMessage = `GeoCaptcha creation succeeded ! ID : ${data.id}`;
        this.isSuccess = true;
        this.isModalOpen = false;

        setTimeout(() => {
          this.isSuccess = false;
        }, 3000);
      } catch (error) {
        console.error("Error: ", error);
        // auditService.logError('/geo-captcha', `Échec lors de la création d'un GéoCaptcha`);
      }
    },
  },
};
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

                <!-- Zone du formulaire -->
                <form @submit.prevent="validateAndCreateGeoCaptcha">
                  <DsfrFieldset>
                    <template #legend>
                      <span class="fr-h4">Paramètres de génération</span>
                    </template>

                    <template #hint>
                      En choisissant un mode, vous pourrez générer un GéoCaptcha en France métropolitaine et dans les DOM-TOM.
                    </template>

                    <!-- Choix parmis les 3 options : Sur la carte, Coordonnées précises et Aléatoire -->
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
                    <p v-if="selectedOption === '1'" class="choix-zone">Sélectionnez une zone où un GéoCaptcha sera généré. Cliquez une première fois pour initier la sélection, étendez la zone, puis cliquez à nouveau pour valider.</p>
                    <p v-if="selectedOption === '2'" class="choix-zone">Le GéoCaptcha sera généré dans le département de France que vous aurez choisi.</p>
                    <p v-if="selectedOption === '3'" class="choix-zone">Le GéoCaptcha sera généré avec une localisation aléatoire en France.</p>

                    <!-- Option Sur la carte -->
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

                    <!-- Option Coordonnées précises -->
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

                    <!-- Option Aléatoire -->
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

                    <!-- Alerte d'acceptation de la tuile -->
                    <DsfrAlert
                        v-if="isSuccess"
                        type="success"
                        title="Succès de la création"
                    >
                      {{ successMessage }}
                    </DsfrAlert>

                    <!-- Alerte de refus de la tuile -->
                    <DsfrAlert
                        v-if="isRefuse"
                        type="info"
                        title="Tuile refusée"
                    >
                      GéoCaptcha non enregistré.
                    </DsfrAlert>
                  </DsfrFieldset>


                  
                  <!-- Modale avec la tuile générée -->
                  <DsfrModal
                      :opened="isModalOpen"
                      title="GéoCaptcha généré :"
                      icon="ri-arrow-right-line"
                      @close="closeModal"
                  >
                    <p>Voici un GéoCaptcha correspondant à la zone géographique choisie :</p>

                    <div class="image-container">
                      <div
                        class="captchas"
                        @pointerdown="down($event)"
                        @pointerup="up"
                        @mouseleave="up"
                      >
                        <div class="captcha-kingpin">
                          <div class="layer layer-base">
                            <img
                                v-if="backgroundImageTuile"
                                :src="backgroundImageTuile"
                                alt="fond du geoCaptcha"
                            >
                          </div>

                          <div
                              class="layer layer-stacked"
                              :style="{ transform: `rotate(-${rotationAngle}deg)` }"
                          >
                            <div class="cropped">
                              <img
                                v-if="imageTuile"
                                :src="imageTuile"
                                alt="geocaptcha"
                              >
                            </div>
                            <div class="grab"></div>
                          </div>
                        </div>
                      </div>

                      <p v-if="!imageTuile">Chargement de l'image...</p>
                    </div>

                    <template #footer>
                      <DsfrButtonGroup
                          align="right"
                          inline-layout-when="large"
                          reverse
                      >
                        <li>
                          <DsfrButton
                              label="Accepter"
                              type="button"
                              icon="ri-checkbox-circle-line"
                              @click="handleConserver"
                          />
                        </li>

                        <li>
                          <DsfrButton
                              label="Refuser"
                              type="button"
                              secondary
                              icon="ri-close-circle-line"
                              @click="closeModal"
                          />
                        </li>
                      </DsfrButtonGroup>
                    </template>
                  </DsfrModal>
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

/* Styles pour le défi géocaptcha */

.image-container {
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
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
