<script setup>
  import { computed, onMounted, reactive, ref, watch } from "vue";

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
    DsfrInputGroup,
    DsfrSelect,
  } from "@gouvminint/vue-dsfr";

  /*
   * Props
   */
  const props = defineProps({
    apiKey: String,
    appId: String,
  });

  /*
   * State
   */
  const activeTab = ref(0);

  const keyName = ref("");
  const email = ref("");
  const referer = ref("");
  const role = ref("");

  const isValidReferer = ref(true);
  const isValidEmail = ref(true);
  const isValidKeyName = ref(true);

  const apiKeys = ref([]);
  const searchQuery = ref("");
  const selectedTag = ref("");

  const showModal = ref(false);
  const keyToDelete = ref(null);

  const showConfirmationModal = ref(false);
  const showMissingInfoModal = ref(false);
  const showEditModal = ref(false);

  const firstObject = ref(1);
  const nbObjects = ref(20);
  const totalKeys = ref(0);

  const itemsPerPage = ref(6);
  const tableCurrentPage = ref(0);

  const errorMessage = ref("");

  const editedUser = reactive({
    appId: "",
    email: "",
    referer: "",
    role: "",
  });

  const userTableColumns = [
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
  ];

  /*
   * Computed
   */
  const isFormValid = computed(() => {
    return (
        keyName.value &&
        keyName.value.length >= 5 &&
        isValidKeyName.value &&
        email.value &&
        isValidEmail.value &&
        referer.value &&
        isValidReferer.value &&
        role.value
    );
  });

  const userTableRows = computed(() => {
    return apiKeys.value
        .filter((key) => {
          const searchQueryLower = searchQuery.value.toLowerCase();

          const appIdMatch =
              key.appId &&
              key.appId.toLowerCase().includes(searchQueryLower);

          const emailMatch =
              key.email &&
              key.email.toLowerCase().includes(searchQueryLower);

          const refererMatch =
              Array.isArray(key.referer) &&
              key.referer.some((refererValue) =>
                  refererValue.toLowerCase().includes(searchQueryLower)
              );

          const matchesTag =
              selectedTag.value === "" ||
              key.role === selectedTag.value;

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
  });

  /*
   * Validation
   */
  function validateKeyName() {
    const regex = /^[a-zA-Z0-9_-]+$/;

    isValidKeyName.value =
      keyName.value.length >= 5 &&
      regex.test(keyName.value);

    return (
      keyName.value &&
      keyName.value.length >= 5 &&
      regex.test(keyName.value)
    );
  }

  function validateEmail() {
    const regex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:[a-zA-Z]{2}|com)$/;

    isValidEmail.value = regex.test(email.value);
  }

  function validateReferer() {
    const referers = referer.value
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const regex =
      /^(https?:\/\/)[a-zA-Z0-9-]+(\.[a-zA-Z]{2}|\.com)\/?$/;

    isValidReferer.value =
      referers.length > 0 &&
      referers.every((value) => regex.test(value));
  }

  /*
   * Modal management
   */
  function openModal(id) {
    keyToDelete.value = id;
    showModal.value = true;
  }

  function closeModal() {
    showModal.value = false;
    keyToDelete.value = null;
  }

  function openConfirmationModal() {
    if (isFormValid.value) {
      showConfirmationModal.value = true;
    } else {
      showMissingInfoModal.value = true;
    }
  }

  function toggleTag(tagRole) {
    selectedTag.value =
      selectedTag.value === tagRole ? "" : tagRole;

    tableCurrentPage.value = 0;
  }

  /*
   * Edit user
   */
  function openEditModal(user) {
    editedUser.appId = user.appId;
    editedUser.email = user.email;
    editedUser.referer = Array.isArray(user.referer)
      ? user.referer.join(", ")
      : user.referer || "";
    editedUser.role = user.role;

    showEditModal.value = true;

    email.value = editedUser.email;
    referer.value = editedUser.referer;

    validateEmail();
    validateReferer();
  }

  function closeEditModal() {
    showEditModal.value = false;

    email.value = "";
    referer.value = "";

    editedUser.appId = "";
    editedUser.email = "";
    editedUser.referer = "";
    editedUser.role = "";
  }

  async function saveChanges() {
    email.value = editedUser.email;
    referer.value = editedUser.referer;

    validateEmail();
    validateReferer();

    if (!isValidEmail.value || !isValidReferer.value) {
      return;
    }

    const referers = editedUser.referer
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    const updatedUser = {
      ...editedUser,
      referer: referers,
    };

    try {
      const existingUser = apiKeys.value.find(
          (key) => key.appId === updatedUser.appId
      );

      const oldEmail = existingUser?.email;

      const response = await fetch(
        `http://127.0.0.1:3000/api/v1/admin/cuser/${encodeURIComponent(
            updatedUser.appId
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": props.apiKey,
            "x-app-id": props.appId,
          },
          body: JSON.stringify({
            email: updatedUser.email,
            referer: updatedUser.referer,
            role: updatedUser.role,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `Erreur HTTP : ${response.status} - ${errorText}`
        );
      }

      const subjectNew = encodeURIComponent(
          "Modification de votre profil utilisateur"
      );

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

      window.location.href =
        `mailto:${oldEmail},${updatedUser.email}` +
        `?subject=${subjectNew}&body=${bodyNew}`;

      await fetchKeys();
      closeEditModal();
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  /*
   * Generate API key
   */
  async function generateApiKey() {
    try {
      const referers = referer.value
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const response = await fetch(
        "http://127.0.0.1:3000/api/v1/admin/cuser",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": props.apiKey,
            "x-app-id": props.appId,
          },
          body: JSON.stringify({
            appId: keyName.value,
            email: email.value,
            referer: referers,
            role: role.value,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
          `Erreur HTTP : ${response.status} - ${errorText}`
        );
      }

      const responseData = await response.json();

      console.log("Réponse complète :", responseData);

      const generatedApiKey =
        responseData.cuser?.key ||
        responseData.cuser?.apiKey ||
        responseData.cuser?.access_key;

      if (!generatedApiKey) {
        console.error(
          "Aucune clé trouvée dans cuser",
          responseData.cuser
        );

        throw new Error(
          "Impossible de trouver la clé API dans la réponse."
        );
      }

      const subject = encodeURIComponent(
        "Votre nouvelle clé d'accès"
      );

      const body = encodeURIComponent(`Bonjour,

        Voici votre nouvelle clé d'accès :

        Nom : ${keyName.value}
        Clé : ${generatedApiKey}

        Veuillez la conserver de manière sécurisée.

        Cordialement,
        Votre service CaptchAdmin`);

      window.location.href =
        `mailto:${email.value}?subject=${subject}&body=${body}`;

      await fetchKeys();

      keyName.value = "";
      email.value = "";
      referer.value = "";
      role.value = "";

      showConfirmationModal.value = false;
    } catch (error) {
      console.error(
          "Erreur lors de la génération de la clé",
          error
      );

      errorMessage.value =
        error.message ||
        "Une erreur est survenue lors de la génération de la clé.";
    }
  }

  /*
   * Delete API key
   */
  async function deleteKey() {
    const id = keyToDelete.value;

    if (!id) {
      return;
    }

    try {
      const userToDelete = apiKeys.value.find(
          (key) => key.appId === id
      );

      const userEmail = userToDelete?.email;
      const userName = userToDelete?.appId;

      const response = await fetch(
        `http://127.0.0.1:3000/api/v1/admin/cuser/${id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "*/*",
            "x-api-key": props.apiKey,
            "x-app-id": props.appId,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
            "Erreur lors de la suppression de la clé."
        );
      }

      if (userEmail) {
        const subject = encodeURIComponent(
            "Suppression de votre clé d'accès"
        );

        const body = encodeURIComponent(`Bonjour,

          Nous vous informons que votre clé d'accès "${userName}" a été supprimée.

          Si vous n'êtes pas à l'origine de cette action ou si vous avez des questions, veuillez nous contacter.

          Cordialement,
          Votre service CaptchAdmin`);

        window.location.href =
          `mailto:${userEmail}?subject=${subject}&body=${body}`;
      }

      await fetchKeys();
      closeModal();
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  /*
   * Fetch additional keys
   */
  async function fetchMoreKeys() {
    try {
      const response = await fetch(
        "http://127.0.0.1:3000/api/v1/admin/cuser?firstObject=21&nbObjects=20",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "x-api-key": props.apiKey,
            "x-app-id": props.appId,
          },
        }
      );

      const result = await response.json();

      const additionalKeys =
          JSON.parse(JSON.stringify(result.cusers)) || [];

      apiKeys.value = [
        ...apiKeys.value,
        ...additionalKeys,
      ];

      totalKeys.value = apiKeys.value.length;
    } catch (error) {
      console.error(
          "Erreur lors de la récupération des clés supplémentaires",
          error
      );
    }
  }

  /*
   * Fetch keys
   */
  async function fetchKeys() {
    try {
      console.log("=== fetchKeys DEBUG ===");
      console.log("apiKey exists:", !!props.apiKey);
      console.log("apiKey length:", props.apiKey?.length);
      console.log("appId:", props.appId);

      if (!props.apiKey) {
        throw new Error("apiKey est undefined ou vide");
      }

      if (!props.appId) {
        throw new Error("appId est undefined ou vide");
      }

      const url =
          "http://127.0.0.1:3000/api/v1/admin/cuser?firstObject=1&nbObjects=100";

      console.log("GET URL:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-api-key": props.apiKey,
          "x-app-id": props.appId,
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

      let result;

      try {
        result = JSON.parse(rawBody);
      } catch (parseError) {
        console.error("Réponse non JSON:", rawBody);
        throw parseError;
      }

      console.log("Parsed response:", result);

      apiKeys.value = result.cusers || [];
      totalKeys.value = apiKeys.value.length;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des clés:",
        error
      );
    }
  }

  /*
   * Lifecycle
   */
  onMounted(() => {
    window.scrollTo(0, 0);

    if (props.apiKey) {
      fetchKeys();
    } else {
      console.log(
          "KeyAccess mounted: waiting for API key..."
      );
    }
  });

  /*
   * Watchers
   */
  watch(activeTab, (newTab, oldTab) => {
    if (newTab !== oldTab) {
      fetchKeys();
    }
  });

  watch(searchQuery, () => {
    tableCurrentPage.value = 0;
  });

  watch(email, () => {
    validateEmail();
  });

  watch(referer, () => {
    validateReferer();
  });

  watch(
    () => editedUser.email,
    (newEmail) => {
      email.value = newEmail;
      validateEmail();
    }
  );

  watch(
    () => editedUser.referer,
    (newReferer) => {
      referer.value = newReferer;
      validateReferer();
    }
  );

  watch(
    () => props.apiKey,
    (newApiKey) => {
      if (newApiKey) {
        console.log("API key received by KeyAccess");
        console.log("API key length:", newApiKey.length);

        fetchKeys();
      }
    }
  );
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

            <DsfrSelect
              v-model="editedUser.role"
              select-id="edit-select"
              name="edit-select"
              label="Rôle :"
              :options="[
                  { value: 'admin', text: 'Admin' },
                  { value: 'private', text: 'Private' },
              ]"
              default-unselected-text="Choissez un rôle"
              required
            />
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
        <DsfrModal
          title="Confirmation de suppression"
          :opened="showModal"
          size="md"
          icon="ri-warning-line"
          @close="closeModal"
        >
          <p>Êtes vous sûr de vouloir supprimer cette clé ?</p>

          <template #footer>
            <DsfrButtonGroup
              align="right"
              inline-layout-when="large"
              reverse
            >
              <DsfrButton
                label="Supprimer"
                @click="deleteKey"
              />

              <DsfrButton
                label="Annuler"
                secondary
                @click="closeModal"
              />
            </DsfrButtonGroup>
          </template>
        </DsfrModal>
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

              <DsfrInputGroup
                v-model="keyName"
                label="Nom :"
                placeholder="Nom associé à la clé d'accès (minimum 5 caratères)"
                hint="Minimum 5 caractères, sans espace et sans symboles autres que « - » et « _ »."
                minlength="5"
                required
                type="text"
                :error-message="
                  keyName && !isValidKeyName
                    ? 'Le nom doit comprendre au minimum 5 caractères, sans espace, et sans symboles autre que « - » et « _ ».'
                    : undefined
                "
                @input="validateKeyName"
              />

              <DsfrInputGroup
                v-model="email"
                input-group-id="email"
                label="Adresse mail associée :"
                placeholder="exemple@xyz.fr"
                required
                type="email"
                :error-message="
                  email && !isValidEmail
                    ? 'L’adresse email doit se terminer par un domaine à exactement 2 caractères (ex: .fr, .uk, .de) ou par .com, et être de la forme exemple@xyz.fr'
                    : undefined
                "
              />

              <DsfrInputGroup
                v-model="referer"
                input-group-id="key-referer"
                label="Referer :"
                placeholder="Exemple : http(s)://application-client1.fr, http(s)://application-client2.fr"
                required
                type="text"
                :error-message="
                  referer && !isValidReferer
                    ? 'L’URL doit se terminer par un domaine à exactement 2 caractères (ex: .fr, .uk, .de) ou par .com, et être de la forme http(s)://application-client1.fr'
                    : undefined
                "
                @input="validateReferer"
              />


              <DsfrSelect
                  v-model="role"
                  select-id="select"
                  label="Rôle :"
                  name="select"
                  :options="[
                    { value: 'admin', text: 'Admin' },
                    { value: 'private', text: 'Private' },
                ]"
                  default-unselected-text="Choisissez un rôle"
                  required
              />

              <DsfrButton
                label="Générer la clé"
                type="submit"
                :disabled="!isFormValid"
              />
            </form>
          </div>

          <!-- Modal de confirmation de génération -->
          <DsfrModal
            title="Confirmation de génération"
            :opened="showConfirmationModal"
            size="md"
            icon="ri-warning-line"
            @close="showConfirmationModal = false"
          >
            <p>
              Êtes-vous sûr de vouloir générer cette clé d'accès ?
              Un mail contenant la nouvelle clé sera envoyé à l'adresse renseignée.
            </p>

            <template #footer>
              <DsfrButtonGroup
                align="right"
                inline-layout-when="large"
                reverse
              >
                <DsfrButton
                    label="Valider"
                    @click="generateApiKey"
                />

                <DsfrButton
                  label="Annuler"
                  secondary
                  @click="showConfirmationModal = false"
                />
              </DsfrButtonGroup>
            </template>
          </DsfrModal>
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

.key-generation {
padding: 1em;
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
