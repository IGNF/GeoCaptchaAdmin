<script>

import {
  DsfrTabs,
  DsfrTabItem,
  DsfrTabContent,
  DsfrTag,
  DsfrTooltip,
  DsfrSearchBar,
  DsfrDataTable,
  DsfrButton,
  DsfrButtonGroup,
  DsfrAlert,
  DsfrModal,
  DsfrInput,
  DsfrInputGroup,
} from "@gouvminint/vue-dsfr";

export default {

  components: {
    DsfrTabs,
    DsfrTabItem,
    DsfrTabContent,
    DsfrTag,
    DsfrTooltip,
    DsfrSearchBar,
    DsfrDataTable,
    DsfrButton,
    DsfrButtonGroup,
    DsfrAlert,
    DsfrModal,
    DsfrInput,
    DsfrInputGroup,
  },

  data() {
    return {
      activeTab: 0,
      keyName: "",
      email: "",
      referer: "",
      isValidReferer: true,
      isValidEmail: true,
      isValidKeyname: true,
      role: "",
      apiKeys: [],
      searchQuery: "",
      showModal: false,
      keyToDelete: null,
      showConfirmationModal: false,
      showMissingInfoModal: false,
      firstObject: 1,
      nbObjects: 20,
      totalKeys: 0,
      itemsPerPage: 6,
      selectedTag: "",
      showEditModal: false,
      editedUser: {
        appId: "",
        email: "",
        referer: "",
        role: ""
      },
      userTableColumns: [
        {
          key: "appId",
          label: "Nom",
          isHeader: true,
        },
        {
          key: "role",
          label: "Rôle",
        },
        {
          key: "email",
          label: "Adresse mail",
        },
        {
          key: "referer",
          label: "Referer",
        },
        {
          key: "actions",
          label: "Actions",
        },
      ],
      tableCurrentPage: 0,
    };
  },
  props: {
    apiKey: String,
    appId: String,
  },
  computed: {
    // Nouvelle propriété calculée pour déterminer si le formulaire est valide
    isFormValid() {
      return (
          this.keyName &&
          this.keyName.length >= 5 &&
          this.isValidKeyname &&
          this.email &&
          this.isValidEmail &&
          this.referer &&
          this.isValidReferer &&
          this.role
      );
    },

    userTableRows() {
      return this.apiKeys
        .filter(key => {
          const searchQueryLower = this.searchQuery.toLowerCase();

          const appIdMatch =
              key.appId &&
              key.appId.toLowerCase().includes(searchQueryLower);

          const emailMatch =
              key.email &&
              key.email.toLowerCase().includes(searchQueryLower);

          const refererMatch =
              Array.isArray(key.referer) &&
              key.referer.some(referer =>
                  referer.toLowerCase().includes(searchQueryLower)
              );

          const matchesTag =
              this.selectedTag === "" ||
              key.role === this.selectedTag;

          return (appIdMatch || emailMatch || refererMatch) && matchesTag;
        })
        .map((key) => ({
          appId: key.appId,
          email: key.email,
          referer: Array.isArray(key.referer)
              ? key.referer
              : [key.referer],
          role: key.role,
          actions: key,
        }));
    },
  },
  methods: {
    validateKeyName() {
      // Regex pour une chaîne compacte avec uniquement des lettres, chiffres, _ et -, sans espace
      const regex = /^[a-zA-Z0-9_-]+$/;
      this.isValidKeyname = this.keyName.length >= 5 && regex.test(this.keyName);
      return this.keyName && this.keyName.length >= 5 && regex.test(this.keyName);
    },

    validateEmail() {
      // Regex pour valider que l'email se termine par .xx (exactement 2 caractères)
      const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:[a-zA-Z]{2}|com)$/;
      this.isValidEmail = regex.test(this.email);
    },

    validateReferer() {
      // Regex pour vérifier que le referer se termine par .xx (2 caractères) ou .com
      const referers = this.referer
          .split(',')
          .map(referer => referer.trim())
          .filter(Boolean);

      const regex = /^(https?:\/\/)[a-zA-Z0-9-]+(\.[a-zA-Z]{2}|\.com)\/?$/;

      this.isValidReferer =
          referers.length > 0 &&
          referers.every(referer => regex.test(referer));
    },

    // Ouvrir le modal et définir la clé à supprimer
    openModal(id) {
      this.keyToDelete = id;
      this.showModal = true;
    },

    // Fermer le modal sans effectuer de suppression
    closeModal() {
      this.showModal = false;
      this.keyToDelete = null;
    },

    // Ouvrir le modal de confirmation pour générer une clé
    openConfirmationModal() {
      if (this.isFormValid) {
        this.showConfirmationModal = true; // Affiche le modal de confirmation
      } else {
        this.showMissingInfoModal = true; // Affiche le modal d'erreur si les champs sont invalides
      }
    },

    toggleTag(role) {
      // Si on clique sur le tag déjà actif, on le désactive
      this.selectedTag = this.selectedTag === role ? "" : role;
      this.tableCurrentPage = 0;
    },

    openEditModal(user) {
      this.editedUser = {
        ...user,
        referer: Array.isArray(user.referer)
          ? user.referer.join(', ')
          : user.referer || '',
      };
      this.showEditModal = true;

      this.email = this.editedUser.email;
      this.referer = this.editedUser.referer;

      this.validateEmail();
      this.validateReferer();
    },

    closeEditModal() {
      this.showEditModal = false;
      this.email = "";
      this.referer = "";
      this.editedUser = {
        appId: "",
        email: "",
        referer: "",
        role: ""
      };
    },

    async saveChanges() {
      this.email = this.editedUser.email;
      this.referer = this.editedUser.referer;
      this.validateEmail();
      this.validateReferer();

      // Ne soumettre que si les validations passent
      if (!this.isValidEmail || !this.isValidReferer) {
        return;
      }

      const referers = this.editedUser.referer
        .split(',')
        .map(referer => referer.trim())
        .filter(Boolean);

      const updatedUser = {
        ...this.editedUser,
        referer: referers,
      }

      try {
        const oldEmail = this.apiKeys.find(key => key.appId === updatedUser.appId).email;

        const response = await fetch(
            `http://127.0.0.1:3000/api/v1/admin/cuser`,
            {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
            "x-app-id": this.appId
          },
          body: JSON.stringify({
            appId: updatedUser.appId,
            email: updatedUser.email,
            referer: updatedUser.referer,
            role: updatedUser.role
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur HTTP : ${response.status} - ${errorText}`);
        }

        const subjectNew = encodeURIComponent("Modification de votre profil utilisateur");
        const bodyNew = encodeURIComponent(`Bonjour,

Nous avons procédé à une modification de votre profil utilisateur. Voici vos nouvelles informations :

Nom : ${updatedUser.appId}
Adresse mail : ${updatedUser.email}
Referer : ${updatedUser.referer}
Rôle : ${updatedUser.role}

Votre clé d'accès reste inchangée.

Si vous n'êtes pas à l'origine de cette action ou si vous avez des questions, veuillez nous contacter.

Cordialement,
Votre service CaptchAdmin`);

        window.location.href = `mailto:${oldEmail},${updatedUser.email}?subject=${subjectNew}&body=${bodyNew}`;

        // auditService.logUpdate('/key-access', `Modification du profil de l'utilisateur: ${this.editedUser.appId}`);
        await this.fetchKeys();
        this.closeEditModal();
      } catch (error) {
        console.error("Erreur:", error);
        //auditService.logError('/key-access', `Échec lors de la modification du profil de l'utilisateur: ${this.editedUser.appId}`);
      }
    },

    // Méthode pour générer une nouvelle clé d'accès
    async generateApiKey() {
      try {
        const response = await fetch("http://127.0.0.1:3000/api/v1/admin/cuser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
            "x-app-id": this.appId
          },
          body: JSON.stringify({
            appId: this.keyName,
            email: this.email,
            referer: this.referer,
            role: this.role
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erreur HTTP : ${response.status} - ${errorText}`);
        }

        const responseData = await response.json();

        // Log détaillé de la réponse
        console.log('Réponse complète :', responseData);

        // Extraction de la clé depuis l'objet cuser
        const generatedApiKey = responseData.cuser?.key ||
            responseData.cuser?.apiKey ||
            responseData.cuser?.access_key;

        if (!generatedApiKey) {
          console.error('Aucune clé trouvée dans cuser', responseData.cuser);
          throw new Error('Impossible de trouver la clé API dans la réponse');
        }

        const subject = encodeURIComponent("Votre nouvelle clé d'accès");
        const body = encodeURIComponent(`Bonjour,

Voici votre nouvelle clé d'accès :

Nom : ${this.keyName}
Clé : ${generatedApiKey}

Veuillez la conserver de manière sécurisée.

Cordialement,
Votre service CaptchAdmin`);

        window.location.href = `mailto:${this.email}?subject=${subject}&body=${body}`;

        // auditService.logCreate('/key-access', `Création de la clé d'accès pour l'utilisateur: ${this.keyName}`);

        await this.fetchKeys();

        // Réinitialisation des champs
        this.keyName = "";
        this.email = "";
        this.referer = "";
        this.role = "";
        this.showConfirmationModal = false;

      } catch (error) {
        console.error("Erreur lors de la génération de la clé", error);
        this.errorMessage = error.message || "Une erreur est survenue lors de la génération de la clé.";
        // auditService.logCreate('/key-access', `Échec lors de la création de la clé d'accès pour l'utilisateur: ${this.keyName}`);
      }
    },

    // Méthode pour supprimer la clé d'accès après confirmation
    async deleteKey() {
      const id = this.keyToDelete;
      if (!id) return;

      try {
        // Trouver l'email de l'utilisateur avant de supprimer la clé
        const userToDelete = this.apiKeys.find(key => key.appId === id);
        const userEmail = userToDelete?.email;
        const userName = userToDelete?.appId;

        const response = await fetch(`http://127.0.0.1:3000/api/v1/admin/cuser/${id}`,
            { method: "DELETE",
              headers: {
                "Accept": "*/*",
                "x-api-key": this.apiKey,
                "x-app-id": this.appId
              }});

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression de la clé.");
        }

        // Si l'email existe, envoyer une notification
        if (userEmail) {
          const subject = encodeURIComponent("Suppression de votre clé d'accès");
          const body = encodeURIComponent(`Bonjour,

Nous vous informons que votre clé d'accès "${userName}" a été supprimée.

Si vous n'êtes pas à l'origine de cette action ou si vous avez des questions, veuillez nous contacter.

Cordialement,
Votre service CaptchAdmin`);

          window.location.href = `mailto:${userEmail}?subject=${subject}&body=${body}`;
        }

        // auditService.logDelete('/key-access', `Suppression de la clé d'accès pour l'utilisateur: ${userName}`);

        await this.fetchKeys();
        this.closeModal();
      } catch (error) {
        console.error("Erreur:", error);
        // auditService.logError('/key-access', `Échec lors de la suppression de la clé d'accès pour l'utilisateur: ${this.keyToDelete}`);
      }
    },

    async fetchMoreKeys() {
      try {
        const response = await fetch(
            `http://127.0.0.1:3000/api/v1/admin/cuser?firstObject=21&nbObjects=20`,
            {
              method: "GET",
              headers: {
                "Accept": "application/json",
                "x-api-key": this.apiKey,
                "x-app-id": this.appId
              },
            }
        );
        const resultat = await response.json();
        const additionalKeys = JSON.parse(JSON.stringify(resultat.cusers)) || [];

        this.apiKeys = [...this.apiKeys, ...additionalKeys];
        this.totalKeys = this.apiKeys.length;
      } catch (error) {
        console.error("Erreur lors de la récupération des clés supplémentaires", error);
      }
    },

    async fetchKeys() {
      try {
        console.log("=== fetchKeys DEBUG ===");
        console.log("apiKey exists:", !!this.apiKey);
        console.log("apiKey length:", this.apiKey?.length);
        console.log("appId:", this.appId);

        if (!this.apiKey) {
          throw new Error("apiKey est undefined ou vide");
        }

        if (!this.appId) {
          throw new Error("appId est undefined ou vide");
        }

        const url =
            "http://127.0.0.1:3000/api/v1/admin/cuser?firstObject=1&nbObjects=100";

        console.log("GET URL:", url);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
            "x-api-key": this.apiKey,
            "x-app-id": this.appId
          },
        });

        console.log("HTTP status:", response.status);
        console.log("HTTP statusText:", response.statusText);

        const rawBody = await response.text();

        console.log("Raw response body:", rawBody);

        if (!response.ok) {
          throw new Error(
              `HTTP ${response.status} ${response.statusText} - ${rawBody}`
          );
        }

        let resultat;

        try {
          resultat = JSON.parse(rawBody);
        } catch (parseError) {
          console.error("Réponse non JSON:", rawBody);
          throw parseError;
        }

        console.log("Parsed response:", resultat);

        this.apiKeys = resultat.cusers || [];
        this.totalKeys = this.apiKeys.length;

      } catch (error) {
        console.error("Erreur lors de la récupération des clés:", error);
      }
    },
  },

  mounted() {
    window.scrollTo(0, 0);

    if (this.apiKey) {
      this.fetchKeys();
    } else {
      console.log("KeyAccess mounted: waiting for API key...");
    }
  },

  watch: {
    activeTab(newTab, oldTab) {
      if (newTab !== oldTab) {
        this.fetchKeys();
      }
    },

    // Remettre à la première page quand la requête de recherche change
    searchQuery() {
      this.tableCurrentPage= 0;
    },
    // Valider l'email à chaque changement
    email() {
      this.validateEmail();
    },
    // Valider le referer à chaque changement
    referer() {
      this.validateReferer();
    },

    "editedUser.email"() {
      this.email = this.editedUser.email;
      this.validateEmail();
    },

    "editedUser.referer"() {
      this.referer = this.editedUser.referer;
      this.validateReferer();
    },

    apiKey(newApiKey) {
      if (newApiKey) {
        console.log("API key received by KeyAccess");
        console.log("API key length:", newApiKey.length);

        this.fetchKeys();
      }
    }
  }
};
</script>

<template>
  <div class="key-tabs">
    <DsfrTabs
      v-model="activeTab"
      tab-list-name="Navigation des onglets"
    >
      <template #tab-items>
        <DsfrTabItem
            tab-id="tab-0"
            panel-id="tab-content-0"
            icon="ri-group-line"
            @click="activeTab = 0"
        >
          Liste des utilisateurs
        </DsfrTabItem>

        <DsfrTabItem
          tab-id="tab-1"
          panel-id="tab-content-1"
          icon="ri-user-add-line"
          @click="activeTab = 1"
        >
          Générer une clé d'accès
        </DsfrTabItem>
      </template>

      <!-- Onglet Liste des utilisateurs-->
      <DsfrTabContent
        panel-id="tab-content-0"
        tab-id="tab-0"
      >
        <div class="key-list">
          <DsfrDataTable
            title="Liste des utilisateurs"
            :columns="userTableColumns"
            :rows="userTableRows"
            pagination
            v-model:current-page="tableCurrentPage"
            :rows-per-page="itemsPerPage"
            :pagination-options="[2, 6, 12, 24]"
            size="sm"
            v-if="userTableRows.length > 0"
          >
            <template #tableTopBarSearch>
              <div class="search-container">
                <div class="tag-container">
                  <DsfrTag
                    label="Admin"
                    value="admin"
                    selectable
                    :selected="selectedTag === 'admin'"
                    @select="toggleTag('admin')"
                  />

                  <DsfrTag
                    label="Private"
                    value="private"
                    selectable
                    :selected="selectedTag === 'private'"
                    @select="toggleTag('private')"
                  />
                </div>

                <DsfrTooltip
                  content="Vous pouvez rechercher via le nom, l'adresse mail ou le referer."
                  :on-hover="true"
                  class="tooltip-container"
                >
                  <span
                    class="fr-icon-information-line"
                    aria-label="Informations sur la recherche"
                  />
                </DsfrTooltip>

                <DsfrSearchBar
                  v-model="searchQuery"
                  placeholder="Rechercher"
                  button-text="Rechercher"
                />
              </div>
            </template>

            <template #cell="{ colKey, cell }">
              <template v-if="colKey === 'actions'">
                <DsfrButtonGroup
                  inline-layout-when="always"
                  size="sm"
                >
                  <DsfrButton
                    label="Modifier"
                    size="sm"
                    @click="openEditModal(cell)"
                  />

                  <DsfrButton
                    label="Supprimer"
                    size="sm"
                    secondary
                    @click="openModal(cell.appId)"
                  />
                </DsfrButtonGroup>
              </template>

              <template v-else-if="colKey === 'referer'">
                <ul v-if="Array.isArray(cell) && cell.length">
                  <li v-for="(referer, index) in cell" :key="index">
                    {{ referer }}
                  </li>
                </ul>

                <span v-else>
                  -
                </span>
              </template>

              <template v-else>
                {{ cell }}
              </template>
            </template>
          </DsfrDataTable>

          <!-- Message si la liste des clés est vide -->
          <DsfrAlert
            v-if="userTableRows.length === 0"
            type="error"
            title="Aucune clé d'accès trouvée."
          />

        </div>

        <!-- Modal de modification -->
        <DsfrModal
          title="Modifier l'utilisateur"
          :opened="showEditModal"
          size="md"
          icon="ri-edit-line"
          @close="closeEditModal"
        >
          <form @submit.prevent="saveChanges">

            <DsfrInputGroup
              v-model="editedUser.appId"
              label="Nom :"
              hint="Le nom d'utilisateur ne peut pas être modfifié"
              type="text"
              disabled
              readonly
            />

            <DsfrInputGroup
              v-model="editedUser.email"
              label="Adresse mail associée :"
              type="email"
              placeholder="exemple@xyz.fr"
              required
              :error-message="
                editedUser.email && !isValidEmail
                  ? 'L\'adresse email doit se terminer par un domaine à exactement 2 caractères ' +
                    '(ex: .fr, .uk, .de) ou par .com, et être de la forme exemple@xyz.fr'
                  : undefined
              "
            />

            <DsfrInputGroup
              v-model="editedUser.referer"
              label="Referer :"
              type="text"
              placeholder="Exemple : http(s)://application-client1.fr, http(s)://application-client2.fr"
              required
              :error-message="
                editedUser.referer && !isValidReferer
                  ? 'L’URL doit se terminer par un domaine à exactement 2 caractères (ex: .fr, .uk, ' +
                  '.de) ou par .com, et être de la forme http(s)://application-client1.fr'
                  : undefined
              "
            />

            <div class="fr-select-group">
              <label class="fr-label" for="edit-select">
                Rôle :
              </label>

              <select
                  id="edit-select"
                  name="edit-select"
                  v-model="editedUser.role"
                  class="fr-select"
                  required
              >
                <option value="" disabled hidden>
                  Choisissez un rôle
                </option>
                <option value="admin">
                  Admin
                </option>
                <option value="private">
                  Private
                </option>
              </select>
            </div>
          </form>

          <template #footer>
            <DsfrButtonGroup
              align="right"
              inline-layout-when="large"
              reverse
            >
              <DsfrButton
                label="Enregistrer les modifications"
                :disabled="!isValidEmail || !isValidReferer || !editedUser.role"
                @click="saveChanges"
              />

              <DsfrButton
                label="Annuler"
                secondary
                @click="closeEditModal"
              />
            </DsfrButtonGroup>
          </template>
        </DsfrModal>


        <!-- Modal de confirmation de suppression -->
        <div v-if="showModal" class="modal-overlay">
          <div class="fr-container fr-container--fluid fr-container-md">
            <div class="fr-grid-row fr-grid-row--center">
              <div class="fr-col-12 fr-col-md-8 fr-col-lg-6">
                <div class="fr-modal__body">
                  <div class="fr-modal__header">
                    <button @click="closeModal" class="fr-btn--close fr-btn" id="close">Fermer</button>
                  </div>

                  <div class="fr-modal__content">
                    <h2 class="fr-modal__title">
                      <span class="fr-icon-warning-line fr-icon--lg" aria-hidden="true"></span>
                      Confirmation de suppression
                    </h2>
                    <p>Êtes-vous sûr de vouloir supprimer cette clé ?</p>
                  </div>

                  <div class="fr-modal__footer fr-btns-group--right fr-btns-group--inline-lg fr-btns-group--icon-left">
                    <button @click="deleteKey" class="fr-btn fr-btn--reject">Oui, supprimer</button>
                    <button @click="closeModal" class="fr-btn fr-btn--cancel" id="cancel">Annuler</button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </DsfrTabContent>

      <!-- Onglet Générer une clé d'accès -->
      <DsfrTabContent
        panel-id="tab-content-1"
        tab-id="tab-1"
      >
        <div class="main-content">

          <div class="key-generation">
            <h1 class="fr-h1">Générer une clé d'accès</h1>
            <form @submit.prevent="openConfirmationModal">

              <div class="fr-input-group">
                <label class="fr-label" for="key-name">Nom :</label>
                <input
                    type="text"
                    id="key-name"
                    v-model="keyName"
                    class="fr-input"
                    placeholder="Nom associé à la clé d'accès (minimum 5 caractères)"
                    minlength="5"
                    required
                    @input="validateKeyName"
                />
                <span v-if="keyName && !isValidKeyname" class="fr-error">Le nom doit comprendre au minimum 5 caractères, sans espace, et sans symboles autre que "-" et "_".</span>
              </div>


              <div class="fr-input-group">
                <label class="fr-label" for="email">Adresse mail associée :</label>
                <input type="email" id="email" v-model="email" class="fr-input" placeholder="exemple@xyz.fr" required/>
                <span v-if="email && !isValidEmail" class="fr-error">L'adresse email doit se terminer par un domaine à exactement 2 caractères (ex: .fr, .uk, .de) ou par .com, et être de la forme exemple@xyz.fr</span>
              </div>

              <div class="fr-input-group">
                <label class="fr-label" for="key-referer">Referer :</label>
                <input
                    type="text"
                    id="key-referer"
                    v-model="referer"
                    class="fr-input"
                    placeholder="Exemple : http(s)://application-client1.fr"
                    @input="validateReferer"
                    required
                />
                <span v-if="referer && !isValidReferer" class="fr-error">L'URL doit se terminer par un domaine à exactement 2 caractères (ex: .fr, .uk, .de) ou par .com, et être de la forme http(s)://application-client1.fr</span>
              </div>


              <div class="fr-select-group">
                <label class="fr-label" for="select">Rôle :</label>
                <select id="select" name="select" v-model="role" class="fr-select" required>
                  <option value="" disabled selected hidden>Choisissez un rôle</option>
                  <option value='admin'>Admin</option>
                  <option value='private'>Private</option>
                </select>
              </div>

              <button
                  type="submit"
                  class="fr-btn fr-btn--primary cle-generer"
                  :disabled="!isFormValid"
                  :class="{ 'fr-btn--disabled': !isFormValid }"
              >
                Générer la clé
              </button>
            </form>
          </div>

          <!-- Modal de confirmation de génération -->
          <div v-if="showConfirmationModal" class="modal-overlay">
            <div class="fr-container fr-container--fluid fr-container-md">
              <div class="fr-grid-row fr-grid-row--center">
                <div class="fr-col-12 fr-col-md-8 fr-col-lg-6">
                  <div class="fr-modal__body">
                    <div class="fr-modal__header">
                      <button @click="generateApiKey" aria-controls="modal-6053" title="Fermer" type="button" id="button-6054" class="fr-btn--close fr-btn">Fermer</button>
                    </div>

                    <div class="fr-modal__content">
                      <h1 id="modal-6053-title" class="fr-modal__title">
                        <span class="fr-icon-check-line fr-icon--lg" aria-hidden="true"></span>
                        Clé Générée
                      </h1>
                      <p>La clé a été générée avec succès. Un mail sera envoyé à l'adresse renseignée dans les plus brefs délais.</p>
                    </div>

                    <div class="fr-modal__footer">
                      <div class="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-btns-group--icon-left">
                        <button @click="generateApiKey" type="button" id="button-6047" class="validate-btn fr-btn fr-icon-checkbox-circle-line fr-btn--icon-left">Valider</button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DsfrTabContent>
    </DsfrTabs>
  </div>
</template>

<style scoped>

.key-tabs {
  margin-left: 50px;
  margin-right: 50px;
  margin-top: 170px;
}


/* Styles pour la recherche d'utilisateur */
.key-list {
margin: 1em;
}

.barre h1 {
margin: 0;
}

/* Styles des boutons */

#close{
background: none;
border: none;
cursor: pointer;
}

.fr-btn--reject {
      background-color: red; 
      color: #fff; 
}

.fr-btn--reject:hover {
      background-color: #c82333; 
}

#cancel{
background-color: #ddd !important;
color: #3a3a3a;
}

#cancel:hover {
background-color: #c1c1c1 !important;
color: #3a3a3a;
}

.key-generation {
padding: 1em;
}

.fr-btn--disabled {
opacity: 0.5;
cursor: not-allowed;
pointer-events: none;
}

/* Pour une meilleure indication visuelle */
.cle-generer {
transition: opacity 0.3s ease;
}

.fr-input-group {
margin-bottom: 1em;
}

.fr-input-group .fr-label {
margin-bottom: 0.5em;
}

.fr-input {
width: 100%;
padding: 0.8rem;
}

.cle-generer {
display: block;
margin-left: auto;
}

/* Modal */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.search-container {
display: flex;
align-items: center; 
gap: 8px; 
}


/* Tags */

.tag-container {
margin-right: 25px;
}
</style>
