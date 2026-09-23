<script>
import {
  DsfrCallout,
  DsfrButton,
  DsfrAlert,
} from "@gouvminint/vue-dsfr";

export default {
  data() {
    return {
      challengeId: null, 
      imageUrl: null, 
      validationMessage: null, 
      geoCaptchaLoaded: false, 
      apiBaseUrl: 'http://127.0.0.1:3000/api/v1',

      infoTitle: 'GeoCaptcha - Sécurisation innovante',
      introParagraphs: [
          `Lorsque vous arrivez sur un site internet, il vous est souvent demandé si vous êtes un humain ou un robot. Pour prouver votre humanité, vous devez résoudre un captcha, souvent sous la forme de texte à déchiffrer ou de sélection d'images.`,
          `L'IGN, via la Mission Architecture Réseau et Sécurité (MARS), propose une innovation : les GéoCaptcha. Ces captchas reposent sur des données géographiques, offrant une alternative ludique et respectueuse de la vie privée tout en sensibilisant à la donnée géospatiale.`,
          `Grâce à cette interface, vous pouvez administrer les GéoCaptcha, consulter les statistiques d'utilisation et gérer les clés d'accès. Une solution clé en main pour renforcer la sécurité numérique et l'intégrité des données géographiques.`
      ]
    };
  },
  components: {
    DsfrCallout,
    DsfrButton,
    DsfrAlert,
  },
  props: {
    apiKey: String,
    appId: String,
  },
  methods: {
    // Charge dynamiquement le script GeoCaptcha
    async loadGeoCaptchaScript() {
      return new Promise((resolve, reject) => {
        const scriptUrl = `${this.apiBaseUrl}/lib.js`;

        const existingScript = document.querySelector(
            `script[src='${scriptUrl}']`
        );

        // Verifies if the script is loaded
        if (existingScript) {
          if (window.geoCaptcha) {
            this.geoCaptchaLoaded = true;
            resolve();
          } else {
            reject(
              new Error(
                `Le script GeoCaptcha est déjà chargé mais window.geoCaptcha est indisponible`
              )
            );
          }
          return;
        }

        console.log(`Chargement de GeoCaptcha depuis ${scriptUrl}`);

        const script = document.createElement('script');
        script.src = scriptUrl;

        script.onload = () => {
          console.log('GeoCaptcha lib.js chargé');
          console.log('window.geoCaptcha:', window.geoCaptcha);
          console.log('API_ENDPOINT:', window.API_ENDPOINT);

          if (window.geoCaptcha) {
            this.geoCaptchaLoaded = true;
            resolve();
          } else {
            reject(new Error(
                'lib.js est chargé mais window.geoCaptcha est indisponible'
            ));
          }
        };

        script.onerror = (error) => {
          console.error('Impossible de charger:', scriptUrl);
          console.error('Erreur:', error);

          reject(new Error(
              `Impossible de charger GeoCaptcha depuis ${scriptUrl}`
          ));
        };

        document.head.appendChild(script);
      });
    },

    
    // Valide un captcha en envoyant son token à l'API
    async validateCaptcha(token) {
      try {
        const response = await fetch(`${this.apiBaseUrl}/challenge/${token}/validation`, {
          method: 'GET',
          headers: {
            'x-api-key': this.apiKey,
            'x-app-id': this.appId,
          },
        });
        return response.ok;
      } catch (error) {
        return false;
      }
    },

    // Gère l'envoi du formulaire et lance GeoCaptcha
    handleSubmit() {
      this.validationMessage = null;

      if (!this.geoCaptchaLoaded || !window.geoCaptcha) {
        this.validationMessage = "Service GeoCaptcha non chargé. Veuillez réessayer.";
        return;
      }

      window.geoCaptcha.launch({
        form: document.getElementById('captcha-form'),
        submit: async (token) => {
          if (token) {
            await this.validateCaptcha(token);
          } else {
            this.validationMessage = "Aucun token n'a été généré.";
          }
        }
      });
    },

    // Initialise le captcha au chargement de la page
    async initCaptcha() {
      try {
        await this.loadGeoCaptchaScript();

        console.log('GeoCaptcha prêt:', window.geoCaptcha);
        console.log('geoCaptchaLoaded:', this.geoCaptchaLoaded);
      } catch (error) {
        console.error('Erreur GeoCaptcha:', error);

        this.validationMessage =
            `Le service GeoCaptcha est momentanément indisponible. Veuillez réessayer ultérieurement.`
      }
    },

    toggleApiKeyLock() {

      // Si aucune clé saisie => on ne verrouille pas
      if (!this.apiKeyLocked && !this.apiKey.trim()) {
        this.validationMessage = 'Veuillez saisir une API Key';
        return;
      }
      this.apiKeyLocked = !this.apiKeyLocked;
    }
  },

  mounted() {
    window.vm = this;
    console.log("Mounted");
    window.scrollTo(0, 0);
    this.initCaptcha();
  }
};
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
          type="error"
          title="GeoCaptcha indisponible"
          :description="validationMessage"
        />

        <form
            id="captcha-form"
            @submit.prevent="handleSubmit"
            class="flex-center"
        >
          <!-- Bouton pour tester un GeoCaptcha -->
          <DsfrButton
            label="Tester un Geocaptcha"
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

    <!-- Message d'erreur si le chargement échoue -->
<!--    <div v-if="loadingError" class="error-message">-->
<!--      {{ loadingError }}-->
<!--    </div>-->
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
