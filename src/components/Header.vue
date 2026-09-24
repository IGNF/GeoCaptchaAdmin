<script setup>
  import { ref, onMounted, onUnmounted } from 'vue';
  import CustomHeader from "@/components/CustomHeader/CustomHeader.vue";
  import ApiKeyField from "@/components/ApiKeyField/ApiKeyField.vue";
  import logo from "../assets/logo.png";
  import logoBis from "../assets/logo_bis.png";

  const showField = true;
  const logoText = ['Institut national de', 'l\'information', 'géographique et', 'forestière'];
  const serviceTitle = 'GeoCaptchaAdmin';
  const serviceDescription = 'Interface Administrateur du GéoCaptcha';
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
      to: '/key-access',
      icon: 'fr-icon-admin-line',
    },
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

  const currentLogo = ref(logo);

  function updateLogoBasedOnTheme() {
    // Vérifier le thème actuel basé sur l'attribut data-fr-theme du root
    const isDarkMode = document.documentElement.getAttribute('data-fr-theme') === 'dark';
    currentLogo.value = isDarkMode ? logoBis : logo;
  }

  let observer;

  onMounted(() => {
    // Mettre à jour le logo au montage
    updateLogoBasedOnTheme();

    // Observer les changements d'attribut data-fr-theme sur l'élément root
    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-fr-theme') {
          updateLogoBasedOnTheme();
        }
      });
    });

    observer.observe(document.documentElement, {attributes: true});
  });
  
  onUnmounted(() => {
    observer?.disconnect();
  });
</script>

<template>
  <CustomHeader
    :show-field="showField"
    show-field-label="Clé API"
    :logo-text="logoText"
    :service-title="serviceTitle"
    :service-description="serviceDescription"
    :home-to="homeTo"
    :quick-links="quickLinks"
    :show-beta="showBeta"
    :operator-img-src="currentLogo"
    operatorImgAlt="Logo de l'interface"
    :operator-img-style="{ maxWidth: '5rem' }"
  >
    <template #field>
      <ApiKeyField
          :model-value="apiKey"
          :locked="apiKeyLocked"
          @update:model-value="emit('update-api-key', $event)"
          @toggle-lock="emit('toggle-api-key-lock')"
      />
    </template>
  </CustomHeader>
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
