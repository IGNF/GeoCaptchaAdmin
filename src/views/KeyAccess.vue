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

  const CUSER_API_URL = "http://127.0.0.1:3000/api/v1/admin/cuser";
  const KEY_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:[a-zA-Z]{2}|com)$/;
  const REFERER_REGEX = /^https?:\/\/([a-zA-Z0-9-]+\.)+([a-zA-Z]{2}|com)\/?$/;
  const ROLE_OPTIONS = [
    { value: 'admin', text: 'Admin' },
    { value: 'private', text: 'Private' },
  ];

  /*
   * State
   */
  const activeTab = ref(0);

  const keyName = ref("");
  const email = ref("");
  const referer = ref("");
  const role = ref("");

  const isEditedEmailValid = ref(true);
  const isEditedRefererValid = ref(true);

  const isValidReferer = ref(true);
  const isValidEmail = ref(true);
  const isValidKeyName = ref(true);

  const apiKeys = ref([]);
  const searchQuery = ref("");
  const selectedTag = ref("");

  const showModal = ref(false);
  const keyToDelete = ref(null);

  const showConfirmationModal = ref(false);
  const showEditModal = ref(false);

  const rowsPerPage = ref(6);
  const tableCurrentPage = ref(0);

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
    return Boolean(
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
    const query = searchQuery.value.toLowerCase().trim();
    const tag = selectedTag.value;

    return apiKeys.value
      .filter((user) => {
        const matchesSearch =
          !query ||
          user.email?.toLowerCase().includes(query) ||
          user.appId?.toLowerCase().includes(query) ||
          (Array.isArray(user.referer)
            ? user.referer.some(value =>
              value.toLowerCase().includes(query)
              )
            : user.referer?.toLowerCase().includes(query)
          );

        const matchesTag =
          !tag || user.role === tag;

        return matchesSearch && matchesTag;
      })
        .map((user) => ({
          ...user,
          referer: Array.isArray(user.referer)
              ? user.referer
              : user.referer
                  ? [user.referer]
                  : [],
        }));
  });

  /*
   * Validation
   */
  function validateKeyName() {
    isValidKeyName.value =
        keyName.value.length >= 5 &&
        KEY_NAME_REGEX.test(keyName.value);

    return isValidKeyName.value;
  }

  function validateEmail() {
    isValidEmail.value = EMAIL_REGEX.test(email.value);

    return isValidEmail.value;
  }

  function validateReferer() {
    const referers = parseReferers(referer.value);

    isValidReferer.value =
      referers.length > 0 &&
      referers.every(value => REFERER_REGEX.test(value));

    return isValidReferer.value;
  }

  function validateEditedEmail() {
    isEditedEmailValid.value = EMAIL_REGEX.test(editedUser.email);

    return isEditedEmailValid.value;
  }

  function validateEditedReferer() {
    const referers = parseReferers(editedUser.referer);

    isEditedRefererValid.value =
        referers.length > 0 &&
        referers.every((value) => REFERER_REGEX.test(value));

    return isEditedRefererValid.value;
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

    validateEditedEmail();
    validateEditedReferer();

    showEditModal.value = true;
  }

  function closeEditModal() {
    showEditModal.value = false;

    editedUser.appId = "";
    editedUser.email = "";
    editedUser.referer = "";
    editedUser.role = "";

    isEditedEmailValid.value = true;
    isEditedRefererValid.value = true;
  }

  function openMail(to, subject, lines) {
    const recipients = [...new Set([to].flat().filter(Boolean))].join(",");
    if (!recipients) return;

    window.location.href =
        `mailto:${recipients}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(lines.join("\n"))}`;
  }

  async function saveChanges() {
    validateEditedEmail();
    validateEditedReferer();

    if (!isEditedEmailValid.value || !isEditedRefererValid.value) {
      return;
    }

    const updatedUser = {
      ...editedUser,
      referer: parseReferers(editedUser.referer),
    };

    try {
      const existingUser = apiKeys.value.find(
          (key) => key.appId === updatedUser.appId
      );

      const oldEmail = existingUser?.email;

      const response = await fetch(
        `${CUSER_API_URL}/${encodeURIComponent(
            updatedUser.appId
        )}`,
        {
          method: "PUT",
          headers: {
            ...getCuserHeaders(),
            "Content-Type": "application/json",
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

      openMail(
        [oldEmail, updatedUser.email],
        "Modification de votre profil utilisateur",
      [
          "Bonjour,",
          "",
          "Nous avons procédé à une modification de votre profil utilisateur. Voici vos nouvelles informations :",
          "",
          `Nom : ${updatedUser.appId}`,
          `Adresse mail : ${updatedUser.email}`,
          `Referer : ${updatedUser.referer.join(", ")}`,
          `Rôle : ${updatedUser.role}`,
          "",
          "Votre clé d'accès reste inchangée.",
          "",
          "Si vous n'êtes pas à l'origine de cette action ou si vous avez des questions, veuillez nous contacter.",
          "",
          "Cordialement,",
          "Votre service CaptchAdmin",
        ],
      );

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
      const referers = parseReferers(referer.value);

      const response = await fetch(
        CUSER_API_URL,
        {
          method: "POST",
          headers: {
            ...getCuserHeaders(),
            "Content-Type": "application/json",
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

      openMail(
        email.value,
        "Votre nouvelle clé d'accès",
        [
          "Bonjour,",
          "",
          "Voici votre nouvelle clé d'accès :",
          "",
          `Nom : ${keyName.value}`,
          `Clé : ${generatedApiKey}`,
          "",
          "Veuillez la conserver de manière sécurisée.",
          "",
          "Cordialement,",
          "Votre service CaptchAdmin",
        ],
      );

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
        `${CUSER_API_URL}/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            ...getCuserHeaders(),
            Accept: "*/*",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `Erreur HTTP : ${response.status} - ${errorText}`
        );
      }

      if (userEmail) {
        openMail(
          userEmail,
          "Suppression de votre clé d'accès",
          [
            "Bonjour,",
            "",
            `Nous vous informons que votre clé d'accès "${userName}" a été supprimée.`,
            "",
            "Si vous n'êtes pas à l'origine de cette action ou si vous avez des questions, veuillez nous contacter.",
            "",
            "Cordialement,",
            "Votre service CaptchAdmin",
          ]
        );
      }

      await fetchKeys();
      closeModal();
    } catch (error) {
      console.error("Erreur:", error);
    }
  }

  /*
   * Fetch additional keys
   * Todo: Rehabilitate later for large dataset api compatibility
   */
  // async function fetchMoreKeys() {
  //   try {
  //     const response = await fetch(
  //       `${CUSER_API_URL}?firstObject=21&nbObjects=20`,
  //       {
  //         method: "GET",
  //         headers: {
  //           ...getCuserHeaders(),
  //           Accept: "application/json",
  //         },
  //       }
  //     );
  //
  //     const result = await response.json();
  //
  //     const additionalKeys =
  //         JSON.parse(JSON.stringify(result.cusers)) || [];
  //
  //     apiKeys.value = [
  //       ...apiKeys.value,
  //       ...additionalKeys,
  //     ];
  //
  //     totalKeys.value = apiKeys.value.length;
  //   } catch (error) {
  //     console.error(
  //         "Erreur lors de la récupération des clés supplémentaires",
  //         error
  //     );
  //   }
  // }

  /*
   * Fetch keys
   */
  async function fetchKeys() {
    try {
      if (!props.apiKey) {
        throw new Error("apiKey est undefined ou vide");
      }

      if (!props.appId) {
        throw new Error("appId est undefined ou vide");
      }

      const url =
          `${CUSER_API_URL}?firstObject=1&nbObjects=100`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...getCuserHeaders(),
          Accept: "application/json",
        },
      });

      const rawBody = await response.text();

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

      apiKeys.value = result.cusers || [];
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des clés:",
        error
      );
      apiKeys.value = [];
    }
  }

  /*
   * Helpers
   */
  function parseReferers(value) {
    return value
      .split(",")
      .map(referer => referer.trim())
      .filter(Boolean);
  }

  const getCuserHeaders  = () => ({
    "x-api-key": props.apiKey,
    "x-app-id": props.appId,
  });

  /*
   * Lifecycle
   */
  onMounted(() => {
    window.scrollTo(0, 0);

    if (props.apiKey) {
      fetchKeys();
    }
  });

  /*
   * Watchers
   */
  watch(activeTab, (newTab) => {
    if (newTab === 0) {
      fetchKeys();
    }
  });

  watch(searchQuery, () => {
    tableCurrentPage.value = 0;
  });

  watch(keyName, () => {
    validateKeyName();
  });

  watch(email, () => {
    validateEmail();
  });

  watch(referer, () => {
    validateReferer();
  });

  watch(
    () => editedUser.email,
    () => {
      validateEditedEmail();
    }
  );

  watch(
    () => editedUser.referer,
    () => {
      validateEditedReferer();
    }
  );

  watch(
      () => [props.apiKey, props.appId],
      ([apiKey, appId]) => {
        if (apiKey && appId) {
          fetchKeys();
        }
      }
  );

  watch(
    [() => userTableRows.value.length, rowsPerPage],
    ([length, perPage]) => {
      const lastPage = Math.max(0, Math.ceil(length / perPage) - 1);
      if (tableCurrentPage.value > lastPage) {
        tableCurrentPage.value = lastPage;
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
            v-if="apiKeys.length > 0"
            title="Liste des utilisateurs"
            :columns="userTableColumns"
            :rows="userTableRows"
            pagination
            v-model:current-page="tableCurrentPage"
            v-model:rows-per-page="rowsPerPage"
            :pagination-options="[2, 6, 12, 24]"
            size="sm"
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

            <template v-if="userTableRows.length === 0" #tbody>
              <tr>
                <td :colspan="userTableColumns.length">
                  <DsfrAlert
                      type="warning"
                      title="Aucun résultat pour cette recherche."
                  />
                </td>
              </tr>
            </template>

            <template
              #cell="{ colKey, cell }"
            >
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
              v-if="apiKeys.length === 0"
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
              :label-visible="true"
              hint="Le nom d'utilisateur ne peut pas être modifié"
              type="text"
              disabled
              readonly
            />

            <DsfrInputGroup
              v-model="editedUser.email"
              label="Adresse mail associée :"
              :label-visible="true"
              type="email"
              placeholder="exemple@xyz.fr"
              required
              :error-message="
                editedUser.email && !isEditedEmailValid
                  ? 'L\'adresse email doit se terminer par un domaine à exactement 2 caractères ' +
                    '(ex: .fr, .uk, .de) ou par .com, et être de la forme exemple@xyz.fr'
                  : undefined
              "
            />

            <DsfrInputGroup
              v-model="editedUser.referer"
              label="Referer :"
              :label-visible="true"
              type="text"
              placeholder="Exemple : http(s)://application-client1.fr, http(s)://application-client2.fr"
              required
              :error-message="
                editedUser.referer && !isEditedRefererValid
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
              :options="ROLE_OPTIONS"
              default-unselected-text="Choisissez un rôle"
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
                :disabled="!isEditedEmailValid || !isEditedRefererValid || !editedUser.role"
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
                :label-visible="true"
                placeholder="Nom associé à la clé d'accès (minimum 5 caractères)"
                hint="Minimum 5 caractères, sans espace et sans symbole autres que « - » et « _ »."
                minlength="5"
                required
                type="text"
                :error-message="
                  keyName && !isValidKeyName
                    ? 'Le nom doit comprendre au minimum 5 caractères, sans espace, et sans symbole autre que « - » et « _ ».'
                    : undefined
                "
              />

              <DsfrInputGroup
                v-model="email"
                input-group-id="email"
                label="Adresse mail associée :"
                :label-visible="true"
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
                :label-visible="true"
                placeholder="Exemple : http(s)://application-client1.fr, http(s)://application-client2.fr"
                required
                type="text"
                :error-message="
                  referer && !isValidReferer
                    ? 'L’URL doit se terminer par un domaine à exactement 2 caractères (ex: .fr, .uk, .de) ou par .com, et être de la forme http(s)://application-client1.fr'
                    : undefined
                "
              />


              <DsfrSelect
                  v-model="role"
                  select-id="select"
                  label="Rôle :"
                  name="select"
                  :options="ROLE_OPTIONS"
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
