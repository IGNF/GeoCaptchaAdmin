<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import {
  DsfrHeader,
  DsfrInput,
} from "@gouvminint/vue-dsfr";
import logo from "../assets/logo.png";
import logoBis from "../assets/logo_bis.png";

const showSearch = true;
const logoText = ['Institut national de', 'l\'information', 'géographique et', 'forestière'];
const serviceTitle = 'GeoCaptchaAdmin';
const serviceDescription = 'Interface Administrateur de GeoCaptcha';
const homeTo = '/';
const quickLinks = [
  {
    label: 'Générer un GéoCaptcha',
    to: '/geo-captcha',
    icon: 'fr-icon-earth-fill',
  },
  {
    label: 'Tableau de bord',
    to: '/dashboard',
    icon: 'fr-icon-dashboard-3-line',
  },
  {
    label: 'Gestion des clés d\'accès',
    to: 'key-access',
    icon: 'fr-icon-admin-line',
  }
];
const showBeta = true;

const props = defineProps({
  apiKey: String,
  apiKeyLocked: Boolean,
});

const emit = defineEmits([
  'update-api-key',
  'toggle-api-key-lock'
]);

function onInput(event) {
  emit('update-api-key', event.target.value);
}

function toggle() {
  emit('toggle-api-key-lock');
}

const activeButton = ref('');
const currentLogo = ref(logo);

function setActiveButton(button) {
  activeButton.value = button;
}

function updateLogoBasedOnTheme() {
  // Vérifier le thème actuel basé sur l'attribut data-fr-theme du root
  const isDarkMode = document.documentElement.getAttribute('data-fr-theme') === 'dark';
  currentLogo.value = isDarkMode ? logoBis : logo;
}

onMounted(() => {
  // Mettre à jour le logo au montage
  updateLogoBasedOnTheme();
  
  // Observer les changements d'attribut data-fr-theme sur l'élément root
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'data-fr-theme') {
        updateLogoBasedOnTheme();
      }
    });
  });
  
  observer.observe(document.documentElement, { attributes: true });
  
  onUnmounted(() => {
    observer.disconnect();
  });
});
</script>

<template>
  <header role="banner" class="fr-header">
    <!-- En-tête fixe avec logo, menu et liens de navigation vers les fonctionnalités-->
    <div class="fr-header__body">
      <div class="fr-container">
        <div class="fr-header__body-row">
          <div class="fr-header__brand fr-enlarge-link">
            <div class="fr-header__brand-top">
              <div class="fr-header__operator">
                <!-- Logo avec attribut alt à renseigner -->
                <img
                    class="fr-responsive-img logo"
                    style="max-width:5rem;"
                    :src="currentLogo"
                    alt="Logo de l'interface"
                />
              </div>
            </div>
            <div class="fr-header__service">
              <!-- Lien vers la page d'accueil -->
              <router-link
                  to="/"
                  class="fr-header__service-title"
                  :class="{ active: activeButton === '' }"
                  @click="setActiveButton('')"
              >
                CaptchAdmin
                <span class="fr-badge fr-badge--sm fr-badge--green-emeraude">BETA</span>
              </router-link>
              <p class="fr-header__service-tagline">Interface Administrateur du GéoCaptcha</p>
            </div>
          </div>
          <div class="fr-header__tools">
            <div class="fr-header__tools-links">
              <!-- Liste des liens de navigation -->
              <ul class="fr-btns-group">
                <li>
                  <router-link
                      to="/geo-captcha"
                      class="fr-btn fr-icon-earth-fill fr-btn"
                      :class="{ active: activeButton === 'geo-captcha' }"
                      @click="setActiveButton('geo-captcha')"
                  >
                    Générer un GeoCaptcha
                  </router-link>
                </li>
                <li>
                  <router-link
                      to="/dashboard"
                      class="fr-btn fr-icon-dashboard-3-line fr-btn"
                      :class="{ active: activeButton === 'dashboard' }"
                      @click="setActiveButton('dashboard')"
                  >
                    Tableau de Bord
                  </router-link>
                </li>
                <li>
                  <router-link
                      to="/key-access"
                      class="fr-btn fr-icon-user-setting-fill"
                      :class="{ active: activeButton === 'key-access' }"
                      @click="setActiveButton('key-access')"
                  >
                    Gestion des clés d'accès
                  </router-link>
                </li>

                <li>
                  <input
                      :value="apiKey"
                      @input="onInput"
                      type="password"
                      :disabled="apiKeyLocked"
                      placeholder="clé d'API pour le dashboard"
                      class="fr-input"
                  />
                  <button @click="toggle" class="fr-btn" >
                    {{ apiKeyLocked ? 'Modifier la clé' : 'Valider' }}
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
<!--  <DsfrHeader-->
<!--    :showSearch-->
<!--    :logo-text-->
<!--    :service-title-->
<!--    :serviceDescription-->
<!--    :homeTo-->
<!--    :quickLinks-->
<!--    :showBeta-->
<!--  >-->
<!--    <template #after-quick-links>-->
<!--      <div class="api-key-controls">-->
<!--        <DsfrInput-->

<!--        />-->
<!--      </div>-->
<!--    </template>-->
<!--  </DsfrHeader>-->
</template>

<style scoped>
@import "@gouvfr/dsfr/dist/dsfr.min.css";

.fr-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
}

.fr-btn {
  transition: all 0.3s ease;
}

.fr-btn:hover {
  background-color: rgb(18, 18, 255) !important;
  color: #ffffff !important;
}

.fr-btn:active {
  background-color: rgb(220, 220, 252) !important;
}

.fr-btn.active {
  background-color: rgb(0, 0, 145) !important;
  color: #fff !important;
}

:root[data-fr-theme="dark"] .fr-btn {
  color: #ffffff !important;
}

:root[data-fr-theme="dark"] .fr-btn:hover {
  background-color: rgb(177, 177, 249) !important;
  color: #ffffff !important;
}

:root[data-fr-theme="dark"] .fr-btn:active {
  background-color: rgb(198, 198, 251) !important;
}

:root[data-fr-theme="dark"] .fr-btn.active {
  background-color: rgb(133, 133, 246) !important;
  color: rgb(0, 0, 145) !important;
}
</style>
