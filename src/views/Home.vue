<script setup>
  import { ref, onMounted, computed } from "vue";
  import {
    DsfrCallout,
    DsfrButton,
    DsfrAlert,
  } from "@gouvminint/vue-dsfr";

  const props = defineProps({
    apiKey: String,
    appId: String,
  });

  const validationMessage = ref(null);
  const validationStatus = ref(null);
  const geoCaptchaLoaded = ref(false);

  const alertTitle = computed(() => {
    switch (validationStatus.value) {
      case "success":
        return "Captcha validé";
      case "warning":
        return "Attention";
      case "error":
        return "Erreur GeoCaptcha";
      default:
        return "";
    }
  });

  const apiBaseUrl = "http://127.0.0.1:3000/api/v1";

  const infoTitle = "GeoCaptcha - Sécurisation innovante";

  const introParagraphs = [
    `Lorsque vous arrivez sur un site internet, il vous est souvent demandé si vous êtes un humain ou un robot. Pour prouver votre humanité, vous devez résoudre un captcha, souvent sous la forme de texte à déchiffrer ou de sélection d'images.`,

    `L'IGN, via la Mission Architecture Réseau et Sécurité (MARS), propose une innovation : les GéoCaptcha. Ces captchas reposent sur des données géographiques, offrant une alternative ludique et respectueuse de la vie privée tout en sensibilisant à la donnée géospatiale.`,

    `Grâce à cette interface, vous pouvez administrer les GéoCaptcha, consulter les statistiques d'utilisation et gérer les clés d'accès. Une solution clé en main pour renforcer la sécurité numérique et l'intégrité des données géographiques.`,
  ];

  /**
   * Dynamically loads GeoCaptcha's script
   */
  function loadGeoCaptchaScript() {
    return new Promise((resolve, reject) => {
      const scriptUrl = `${apiBaseUrl}/lib.js`;

      const existingScript = document.querySelector(
          `script[src='${scriptUrl}']`
      );

      // The script already exists
      if (existingScript) {
        if (window.geoCaptcha) {
          geoCaptchaLoaded.value = true;
          resolve();
          return
        }

        existingScript.addEventListener('load', () => {
          if (window.geoCaptcha) {
            geoCaptchaLoaded.value = true;
            resolve();
          } else {
            reject(
                new Error(
                    "lib.js est chargé mais window.geoCaptcha est indisponible"
                )
            );
          }
        }, { once: true });

        existingScript.addEventListener("error", () => {
          reject(
              new Error(
                  `Impossible de charger GeoCaptcha depuis ${scriptUrl}`
              )
          );
        }, { once: true });

        return;
      }

      const script = document.createElement("script");
      script.src = scriptUrl;

      script.addEventListener("load", () => {
        if (window.geoCaptcha) {
          geoCaptchaLoaded.value = true;
          resolve();
        } else {
          reject(
              new Error(
                  "lib.js est chargé mais window.geoCaptcha est indisponible"
              )
          );
        }
      }, { once: true });

      script.addEventListener("error", () => {
        reject(
            new Error(
                `Impossible de charger GeoCaptcha depuis ${scriptUrl}`
            )
        );
      }, { once: true });

      document.head.appendChild(script);
    });
  }

  /**
   * Validate a captcha by sending its token to the API
   */
  async function validateCaptcha(token) {
    try {
      const response = await fetch(
      `${apiBaseUrl}/challenge/${token}/validation`,
        {
          method: "GET",
          headers: {
            "x-api-key": props.apiKey,
            "x-app-id": props.appId,
          },
        }
      )

      return response.ok;
    } catch (err) {
      console.error("Erreur lors de la validation du captcha:", err);
      return false;
    }
  }
  /** Manages form submission and launches GeoCaptcha */
  function handleSubmit() {
    validationMessage.value = null;
    validationStatus.value = null;

    if (!geoCaptchaLoaded.value || !window.geoCaptcha) {
      validationStatus.value ="error";
      validationMessage.value = "Service GeoCaptcha non chargé. Veuillez réessayer.";
      return
    }

    window.geoCaptcha.launch({
      form: document.getElementById('captcha-form'),

      submit: async (token) => {
        if (token) {
          const isValid = await validateCaptcha(token)

          validationStatus.value = isValid ? "success" : "error";
          validationMessage.value = isValid
            ? "Captcha validé."
            : "Le captcha n'est pas valide."
        } else {
          validationStatus.value = "warning";
          validationMessage.value = "Aucun token n'a été généré.";
        }
      },
    });
  }

  /** Initializes the captcha on page mounting. */
  async function initCaptcha() {
    try {
      await loadGeoCaptchaScript();

      console.log("GeoCaptcha prêt:", window.geoCaptcha);
      console.log("geoCaptchaLoaded:", geoCaptchaLoaded.value);
    } catch (error) {
      console.error("Erreur GeoCaptcha:", error);

      validationStatus.value = "error";
      validationMessage.value =
          "Le service GeoCaptcha est momentanément indisponible. Veuillez réessayer ultérieurement.";
    }
  }

  onMounted(() => {
    console.log("Mounted");

    window.scrollTo(0, 0);

    initCaptcha();
  })
</script>

<template>
  <div class="home">
    <!-- Section d'introduction expliquant le concept de GeoCaptcha -->
    <section class="fr-container fr-mt-5">
      <DsfrCallout :title="infoTitle">
        <p
            v-for="(paragraph, index) in introParagraphs"
            :key="index"
            :class="{ 'fr-mb-4v': index < introParagraphs.length - 1 }"
        >
          {{ paragraph }}
        </p>
      </DsfrCallout>
    </section>

    <!-- Section contenant l'image du captcha et le bouton d'interaction -->
    <section class="fr-container fr-my-5">
      <div class="captcha-actions">

        <!-- Error message displayed on Captcha load failure -->
        <DsfrAlert
          v-if="validationMessage"
          :type="validationStatus"
          :title="alertTitle"
          :description="validationMessage"
        />

        <form
            id="captcha-form"
            @submit.prevent="handleSubmit"
            class="flex-center"
        >
          <!-- Bouton pour tester un GeoCaptcha -->
          <DsfrButton
            label="Tester un GeoCaptcha"
            icon="fr-icon-survey-line"
            type="submit"
          />

        </form>

        <!-- Lien vers plus d'informations -->
        <a href="http://127.0.0.1:3000/api/v1/" target="_blank" rel="noopener noreferrer" class="fr-link">
          En savoir plus sur GeoCaptcha
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  padding-top: 170px;
}

.captcha-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.validation-message {
  margin-top: 10px;
  font-weight: bold;
}

.error-message {
  margin-top: 10px;
  color: #dc3545;
  font-weight: bold;
  text-align: center;
}

.flex-center {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
