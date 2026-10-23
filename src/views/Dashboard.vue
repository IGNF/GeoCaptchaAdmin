<script setup lang="ts">

  /*Service de logs*/
  //import { auditService } from '@/services/audit-service';

  /*Composants visuels importés*/
  import { computed, onMounted, ref, watch } from "vue";
  import {
    DsfrAlert,
    DsfrBadge,
    DsfrButton,
    DsfrButtonGroup,
    DsfrDataTable,
    DsfrModal,
    DsfrPagination,
    DsfrSearchBar,
    DsfrSelect,
    DsfrTabContent,
    DsfrTabItem,
    DsfrTabs,
    DsfrTag,
  } from "@gouvminint/vue-dsfr";

  import GaugeChart from '../components/GaugeChart.vue';
  import Heatmap from '../components/Heatmap.vue';
  import { useAuditLogs } from "@/composables/useAuditLogs";
  import { useKingpinStats } from "@/composables/useKingpinStats";
  import { useStatsList } from "@/composables/useStatsList";
  import { deleteSession } from "@/services/session-service";
  import { auditBadgeType } from "@/utils/dashboard/audit";
  import type { KingpinStat, StatSortKey, StatTag } from "@/utils/dashboard/kingpin-stats";

  /*Audit service*/
  //import { auditService } from '@/services/audit-service';

  const props = defineProps<{
    apiKey?: string;
    appId?: string;
  }>();

  const credentials = () => ({
    apiKey: props.apiKey ?? "",
    appId: props.appId ?? "",
  });

  const SORT_OPTIONS: Array<{ value: StatSortKey; text: string }> = [
    { value: "name", text: "Nom" },
    { value: "successRate", text: "Taux de réussite" },
    { value: "attempts", text: "Nombre d'essais" },
  ];

  const TAG_OPTIONS: Array<{ value: StatTag; label: string }> = [
    { value: "all", label: "Tous" },
    { value: "success", label: "Réussis" },
    { value: "failed", label: "Échoués" },
  ];

  const LOG_COLUMNS = [
    { key: "action", label: "Action" },
    { key: "route", label: "Route" },
    { key: "description", label: "Description" },
    { key: "timestamp", label: "Date" },
  ];

  const activeTab = ref(0);

  // === Statistics of the GeoCaptchas ===
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    load: loadStats,
  } = useKingpinStats(credentials);

  const {
    searchQuery,
    selectedTag,
    sortKey,
    currentPage: metricPage,
    pageItems,
    pageCount,
    totalCount,
    toggleSortOrder,
  } = useStatsList(stats);

  const metricPages = computed(() =>
    Array.from({ length: pageCount.value }, (_, index) => ({
      label: String(index + 1),
      title: `Page ${index + 1}`,
      href: "#",
    })),
  );

  // === Details and rejection of a GeoCaptcha ===
  const selectedStat = ref<KingpinStat | null>(null);
  const isDetailsOpen = ref(false);
  const isRejectOpen = ref(false);
  const rejecting = ref(false);
  const rejectError = ref("");

  const detailRows = computed(() => {
    const stat = selectedStat.value;
    if (!stat) return [];
    return [
      { label: "ID", value: stat.name },
      { label: "IP", value: "N/A" },
      { label: "Essais", value: stat.attempts },
      { label: "Réussites", value: stat.successes },
      { label: "Échecs", value: stat.attempts - stat.successes },
      { label: "Précision", value: `${stat.successRate}%` },
      { label: "Referer", value: "N/A" },
      { label: "Date de création", value: "N/A" },
    ];
  });

  function openDetails(stat: KingpinStat) {
    selectedStat.value = stat;
    isDetailsOpen.value = true;
  }

  function closeDetails() {
    isDetailsOpen.value = false;
  }

  /** Only one modal is shown at a time: the details give way to the confirmation. */
  function askReject() {
    isDetailsOpen.value = false;
    rejectError.value = "";
    isRejectOpen.value = true;
  }

  /** Goes back to the details. */
  function cancelReject() {
    if (rejecting.value) return;
    isRejectOpen.value = false;
    isDetailsOpen.value = true;
  }

  async function confirmReject() {
    const stat = selectedStat.value;
    if (!stat || rejecting.value) return;

    rejecting.value = true;
    rejectError.value = "";
    try {
      await deleteSession(stat.name, credentials());


      // auditService.addLog({
      //   action: 'DELETE',
      //   route: `/geocaptcha/${stat.name}`,
      //   description: `Suppression du géocaptcha ID: ${stat.name}`,
      //   timestamp: new Date().toLocaleString(),
      //   rawTimestamp: new Date(),
      // });

      isRejectOpen.value = false;
      selectedStat.value = null;
      await loadStats();
    } catch (err) {
      console.error(err);

      // auditService.addLog({
      //   action: 'ERROR',
      //   route: `/geocaptcha/${stat.name}`,
      //   description: `Erreur lors de la suppression du géocaptcha: ${err.message}`,
      //   timestamp: new Date().toLocaleString(),
      //   rawTimestamp: new Date(),
      // });

      rejectError.value = "Le rejet a échoué, veuillez réessayer.";
    } finally {
      rejecting.value = false;
    }
  }

  // === Audit logs ===
  const {
    logs,
    filterRoute,
    routeOptions,
    rows: logRows,
    currentPage: logsPage,
    rowsPerPage: logsPerPage,
    load: loadLogs,
    clearFilters,
    clearAll: clearAllLogs,
  } = useAuditLogs();

  const isDeleteLogsOpen = ref(false);

  function confirmDeleteLogs() {
    clearAllLogs();
    isDeleteLogsOpen.value = false;
  }

  // === Lifecycle ===
  onMounted(() => {
    window.scrollTo(0, 0);
    loadLogs();
    loadStats();
  });

  // The credentials can arrive after the first render
  watch(
      () => [props.apiKey, props.appId],
      ([apiKey, appId]) => {
        if (apiKey && appId) loadStats();
      },
  );
</script>

<template>
  <div class="dashboard-tabs">
    <DsfrTabs v-model="activeTab" tab-list-name="Navigation des onglets">
      <template #tab-items>
        <DsfrTabItem
            tab-id="tab-0"
            panel-id="tab-content-0"
            icon="ri-slideshow-line"
            @click="activeTab = 0"
            @next="activeTab = 1"
            @previous="activeTab = 1"
            @first="activeTab = 0"
            @last="activeTab = 1"
        >
          Gestion de GéoCaptcha
        </DsfrTabItem>

        <DsfrTabItem
            tab-id="tab-1"
            panel-id="tab-content-1"
            icon="ri-survey-line"
            @click="activeTab = 1"
            @next="activeTab = 0"
            @previous="activeTab = 0"
            @first="activeTab = 0"
            @last="activeTab = 1"
        >
          Logs
        </DsfrTabItem>
      </template>

      <!-- GéoCaptcha management tab -->
      <DsfrTabContent panel-id="tab-content-0" tab-id="tab-0">
        <h1 class="fr-h1">Gestion de Géocaptcha</h1>
        <h2 class="fr-h6">Carte de chaleur affichant la localisation des GéoCaptchas créés :</h2>

        <Heatmap :api-key="apiKey" :app-id="appId" />

        <!-- Search, tag filters and sort -->
        <div class="stats-toolbar">
          <div class="stats-toolbar__search">
            <DsfrSearchBar
                v-model="searchQuery"
                placeholder="Rechercher"
                button-text="Rechercher"
            />
          </div>

          <div class="stats-toolbar__tags">
            <DsfrTag
                v-for="tag in TAG_OPTIONS"
                :key="tag.value"
                :label="tag.label"
                :value="tag.value"
                selectable
                :selected="selectedTag === tag.value"
                @select="selectedTag = tag.value"
            />
          </div>

          <div class="stats-toolbar__sort">
            <DsfrSelect v-model="sortKey" label="Trier par" :options="SORT_OPTIONS" />
            <DsfrButton
                type="button"
                icon="ri-arrow-up-down-line"
                icon-only
                tertiary
                no-outline
                title="Inverser l'ordre de tri"
                aria-label="Inverser l'ordre de tri"
                @click="toggleSortOrder"
            />
          </div>
        </div>

        <!-- Statistics tiles -->
        <DsfrAlert v-if="statsError" type="error" title="Statistiques indisponibles">
          {{ statsError }}
        </DsfrAlert>
        <p v-else-if="statsLoading" role="status">Chargement des statistiques…</p>
        <DsfrAlert v-else-if="stats.length === 0" type="info" title="Aucune statistique disponible." />
        <DsfrAlert
            v-else-if="totalCount === 0"
            type="warning"
            title="Aucun résultat pour cette recherche."
        />

        <div v-else class="fr-grid-row fr-grid-row--gutters">
          <div
              v-for="stat in pageItems"
              :key="stat.name"
              class="fr-col-12 fr-col-md-6 fr-col-lg-4"
          >
            <div
                class="fr-tile metric-tile"
                role="button"
                tabindex="0"
                :aria-label="`Détails du GéoCaptcha ${stat.name}`"
                @click="openDetails(stat)"
                @keydown.enter.prevent="openDetails(stat)"
                @keydown.space.prevent="openDetails(stat)"
            >
              <div class="fr-tile__header">
                <p class="fr-mb-0"><strong>Nom : </strong>{{ stat.name }}</p>
              </div>

              <div class="fr-tile__body">
                <span class="metric-tile__icon" aria-hidden="true">🧩</span> <!-- To replace later -->

                <div class="metric-tile__infos">
                  <p class="fr-mb-0"><strong>Nombre d'essais : </strong>{{ stat.attempts }}</p>
                  <GaugeChart
                      :value="Math.round(stat.successRate)"
                      :min="0"
                      :max="100"
                      label="Taux de réussite (%)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <DsfrPagination
            v-if="pageCount > 1"
            v-model:current-page="metricPage"
            :pages="metricPages"
        />

        <!-- Details of a GéoCaptcha -->
        <DsfrModal
            title="Détails du Géocaptcha"
            :opened="isDetailsOpen"
            size="md"
            icon="ri-arrow-right-line"
            @close="closeDetails"
        >
          <p v-for="row in detailRows" :key="row.label">
            <strong>{{ row.label }}:</strong> {{ row.value }}
          </p>

          <template #footer>
            <DsfrButtonGroup align="right" inline-layout-when="large" reverse>
              <li>
                <DsfrButton label="Rejeter" secondary @click="askReject" />
              </li>
            </DsfrButtonGroup>
          </template>
        </DsfrModal>

        <!-- Confirmation of the rejection -->
        <DsfrModal
            title="Confirmation"
            :opened="isRejectOpen"
            size="md"
            icon="ri-warning-line"
            @close="cancelReject"
        >
          <p>Êtes-vous sûr de vouloir rejeter ce géocaptcha ?</p>

          <DsfrAlert v-if="rejectError" type="error" title="Rejet impossible">
            {{ rejectError }}
          </DsfrAlert>

          <template #footer>
            <DsfrButtonGroup align="right" inline-layout-when="large" reverse>
              <li>
                <DsfrButton label="Oui, rejeter" :disabled="rejecting" @click="confirmReject" />
              </li>
              <li>
                <DsfrButton label="Annuler" secondary :disabled="rejecting" @click="cancelReject" />
              </li>
            </DsfrButtonGroup>
          </template>
        </DsfrModal>
      </DsfrTabContent>

      <!-- Logs tab -->
      <DsfrTabContent panel-id="tab-content-1" tab-id="tab-1">
        <h1 class="fr-h1">Logs</h1>

        <div class="logs-toolbar">
          <DsfrSelect
              v-model="filterRoute"
              label="Filtrer par route"
              :options="routeOptions"
              default-unselected-text="Toutes les routes"
          />

          <DsfrButton
              type="button"
              icon="ri-refresh-line"
              icon-only
              tertiary
              no-outline
              title="Réinitialiser les filtres"
              aria-label="Réinitialiser les filtres"
              @click="clearFilters"
          />

          <DsfrButton
              class="logs-toolbar__delete"
              type="button"
              label="Tout effacer"
              icon="ri-delete-bin-line"
              secondary
              :disabled="logs.length === 0"
              @click="isDeleteLogsOpen = true"
          />
        </div>

        <DsfrAlert
            v-if="logRows.length === 0"
            type="info"
            title="Aucune entrée d'audit ne correspond aux filtres."
        />

        <DsfrDataTable
            v-else
            title="Journal d'audit"
            :columns="LOG_COLUMNS"
            :rows="logRows"
            pagination
            v-model:current-page="logsPage"
            v-model:rows-per-page="logsPerPage"
            :pagination-options="[10, 25, 50]"
            size="sm"
        >
          <template #cell="{ colKey, cell }">
            <DsfrBadge
                v-if="colKey === 'action'"
                :label="String(cell)"
                :type="auditBadgeType(cell)"
                small
            />
            <template v-else>{{ cell }}</template>
          </template>
        </DsfrDataTable>

        <!-- Confirmation of the deletion of all logs -->
        <DsfrModal
            title="Confirmation de suppression"
            :opened="isDeleteLogsOpen"
            size="md"
            icon="ri-warning-line"
            @close="isDeleteLogsOpen = false"
        >
          <p>
            Êtes-vous sûr de vouloir supprimer tous les logs d'audit ? Cette action est
            irréversible.
          </p>

          <template #footer>
            <DsfrButtonGroup align="right" inline-layout-when="large" reverse>
              <li>
                <DsfrButton label="Confirmer la suppression" @click="confirmDeleteLogs" />
              </li>
              <li>
                <DsfrButton label="Annuler" secondary @click="isDeleteLogsOpen = false" />
              </li>
            </DsfrButtonGroup>
          </template>
        </DsfrModal>
      </DsfrTabContent>
    </DsfrTabs>
  </div>
</template>

<style scoped>
  .dashboard-tabs {
    margin: 170px 50px 0;
  }

  /* Statistics */
  .stats-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 20px;
  }

  .stats-toolbar__search {
    width: 250px;
  }

  .stats-toolbar__tags,
  .stats-toolbar__sort {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .metric-tile {
    cursor: pointer;
  }

  .metric-tile__icon {
    font-size: 1.5rem;
  }

  .metric-tile__infos {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .metric-tile__infos > * {
    flex: 1;
  }

  /* Logs */
  .logs-toolbar {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .logs-toolbar__delete {
    margin-left: auto;
  }
</style>
