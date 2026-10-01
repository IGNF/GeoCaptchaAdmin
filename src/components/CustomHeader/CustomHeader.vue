<script lang="ts" setup>
  import type { CustomHeaderProps } from "./CustomHeader.types";
  import type { DsfrLanguageSelectorElement } from "@gouvminint/vue-dsfr";

  import { FocusTrap } from "focus-trap-vue";
  import { computed, onMounted, onUnmounted, provide, ref, toRef } from "vue";

  import { DsfrLanguageSelector } from "@gouvminint/vue-dsfr";
  import { DsfrLogo } from "@gouvminint/vue-dsfr";

  import { DsfrHeaderMenuLinks } from "@gouvminint/vue-dsfr";
  import { registerNavigationLinkKey } from "@gouvminint/vue-dsfr";

  export type { CustomHeaderProps }

  const props = withDefaults(defineProps<CustomHeaderProps>(), {
    languageSelector: undefined,
    serviceTitle: undefined,
    serviceLinks: undefined,
    homeTo: '/',
    logoText: () => 'Gouvernement',
    operatorImgAlt: '',
    operatorImgSrc: '',
    operatorImgStyle: () => ({}),
    quickLinks: () => [],
    quickLinksAriaLabel: 'Menu Secondaire',
    showFieldLabel: 'Champ clé API',
    fieldIcon: 'fr-icon-lock-unlock-fill',
    menuLabel: 'Menu',
    menuModalLabel: 'Menu',
    closeMenuModalLabel: 'Fermer',
    homeLabel: 'Accueil',
  })

  const emit = defineEmits<{
    /** Emitted when a language is selected */
    languageSelect: [payload: DsfrLanguageSelectorElement]
  }>()

  const slots = defineSlots<{
    /** Default slot for fieldset content (will be in `<div class="fr-header__body-row">`) */
    default: () => any
    /** Slot named operator for the operator logo (will be in `<div class="fr-header__operator">` */
    operator: () => any
    /** Slot named mainnav for the main navigation menu */
    mainnav: () => any
    /** Slot for content before quick links */
    'before-quick-links': () => any
    /** Slot for content after quick links */
    'after-quick-links': () => any
    /**
     * Slot for the custom field (replace the default search bar in DsfrHeader).
     * Rendered twice: in the tools zone (desktop, `isModal: false`) and in the mobile modal (`inModal: true`)
     */
    field: (props: { inModal: boolean }) => any
  }>()

  const languageSelector = toRef(props, 'languageSelector')

  const menuOpened = ref(false)
  const fieldModalOpened = ref(false)
  const modalOpened = ref(false)

  const hideModal = () => {
    modalOpened.value = false
    menuOpened.value = false
    fieldModalOpened.value = false
    document.getElementById('button-menu')?.focus()
  }
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      hideModal()
    }
  }

  // Keep this value aligned with DSFR breakpoints.
  // @gouvfr/dsfr/src/dsfr/core/script/api/modules/register/breakpoints.js
  const lgBreakpointQuery = '(min-width: 62em)'

  const isDesktopViewport = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }
    return window.matchMedia(lgBreakpointQuery).matches;
  }

  const closeFieldModalOnDesktop = () => {
    if (!fieldModalOpened.value || !isDesktopViewport()) {
      return
    }
    modalOpened.value = false
    menuOpened.value = true
    fieldModalOpened.value = false
  }

  onMounted(() => {
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', closeFieldModalOnDesktop)
  })
  onUnmounted(() => {
    document.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('resize', closeFieldModalOnDesktop)
  })

  const showMenu = () => {
    modalOpened.value = true
    menuOpened.value = true
    fieldModalOpened.value = false
  }
  const showFieldModal = () => {
    modalOpened.value = true
    menuOpened.value = false
    fieldModalOpened.value = true
  }
  const onQuickLinkClick = hideModal

  const title = computed(() => [props.homeLabel, props.serviceTitle].filter(x => x).join(' - '))

  const isWithSlotOperator = computed(() => Boolean(slots.operator)  || !!props.operatorImgSrc)
  const isWithSlotNav = computed(() => Boolean(slots.mainnav))
  provide(registerNavigationLinkKey, () => {
    return hideModal
  })
</script>

<template>
  <header
    role="banner"
    class="fr-header"
  >
    <div class="fr-header__body">
      <div class="fr-container width-inherit">
        <div class="fr-header__body-row">
          <div class="fr-header__brand fr-enlarge-link">
            <div class="fr-header__brand-top">
              <div class="fr-header__logo">
                <RouterLink
                    v-if="!serviceTitle && (!operatorImgSrc || $slots.operator)"
                    :to="homeTo"
                    :title
                >
                  <DsfrLogo
                      :logo-text="logoText"
                      data-testid="header-logo"
                  />
                </RouterLink>
                <DsfrLogo
                    v-else
                    :logo-testid="logoText"
                    data-testid="header-logo"
                />
              </div>
              <div
                v-if="isWithSlotOperator"
                class="fr-header__operator"
              >
                <slot name="operator">
                  <RouterLink
                      v-if="operatorImgSrc"
                      :to="homeTo"
                      :title
                  >
                    <img
                      v-if="operatorImgSrc"
                      class="fr-responsive-img"
                      :src="operatorImgSrc"
                      :alt="operatorImgAlt"
                      :style="operatorImgStyle"
                    >
                  </RouterLink>
                </slot>
              </div>
              <div
                v-if="showField || isWithSlotNav || quickLinks?.length"
                class="fr-header__navbar"
              >
                <!-- The DSFR classes `fr-btn--search` / `fr-header__search` are kept only for the responsive style and
                     behavior of DSFR. -->
                <button
                  v-if="showField"
                  class="fr-btn"
                  :class="fieldIcon"
                  aria-controls="header-search"
                  :aria-label="showFieldLabel"
                  :title="showFieldLabel"
                  :data-fr-opened="fieldModalOpened"
                  @click.prevent.stop="showFieldModal()"
                >
                  <span class="fr-sr-only">
                    {{ showFieldLabel }}
                  </span>
                </button>
                <button
                  v-if="isWithSlotNav || quickLinks?.length"
                  id="button-menu"
                  class="fr-btn--menu fr-btn"
                  :data-fr-opened="showMenu"
                  aria-controls="header-navigation"
                  aria-haspopup="dialog"
                  data-testid="open-menu-btn"
                  @click.prevent.stop="showMenu()"
                >
                  <span class="fr-sr-only">
                    {{ menuLabel }}
                  </span>
                </button>
              </div>
            </div>
            <div
              v-if="serviceTitle"
              class="fr-header__service"
            >
              <RouterLink
                  :to="homeTo"
                  :title
                  v-bind="$attrs"
              >
                <p class="fr-header__service-title">
                  {{ serviceTitle }}
                  <span
                    v-if="showBeta"
                    class="fr-badge fr-badge--sm fr-badge--green-emeraude"
                  >
                    BETA
                  </span>
                </p>
              </RouterLink>
              <p
                v-if="serviceDescription"
                class="fr-header__service-tagline"
              >
                {{ serviceDescription }}
              </p>
            </div>
            <div
              v-if="!serviceTitle && showBeta"
              class="fr-header__service"
            >
              <span
                class="fr-badge fr-badge--sm fr-badge--green-emeraude"
              >
                BETA
              </span>
            </div>
          </div>
          <div class="fr-header__tools">
            <div
              v-if="quickLinks?.length || languageSelector"
              class="fr-header__tools-links"
            >
              <slot name="before-quick-links" />
              <DsfrHeaderMenuLinks
                  v-if="!menuOpened"
                  :links="quickLinks"
                  :nav-aria-label="quickLinksAriaLabel"
              />
              <slot name="after-quick-links" />
              <template v-if="languageSelector">
                <DsfrLanguageSelector
                    v-bind="languageSelector"
                    @select="emit('languageSelect', $event)"
                />
              </template>
            </div>
            <div
              v-if="showField"
              class="fr-header__search fr-modal"
            >
              <slot
                name="field"
                :in-modal="false"
              />
            </div>
          </div>
        </div>
        <FocusTrap
            v-if="modalOpened"
            :active="modalOpened"
            :focus-trap-options="{
              initialFocus: '#close-button',
              fallbackFocus: '#close-button',
              escapeDeactivates: true,
              clickOutsideDeactivates: true,
              returnFocusOnDeactivate: true,
            }"
        >
          <div
            v-if="(showField || isWithSlotNav || (quickLinks && quickLinks.length) || languageSelector) && modalOpened"
            id="header-navigation"
            class="fr-header__menu fr-modal fr-modal--opened"
            :aria-label="menuModalLabel"
            role="dialog"
            aria-modal="true"
          >
            <div class="fr-container">
              <button
                id="close-button"
                class="fr-btn fr-btn--close"
                aria-controls="header-navigation"
                data-testId="close-modal-btn"
                @click.prevent.stop="hideModal()"
              >
                {{ closeMenuModalLabel }}
              </button>
              <div class="fr-header__menu-links">
                <template v-if="languageSelector">
                  <DsfrLanguageSelector
                      v-bind="languageSelector"
                      @select="emit('languageSelect', $event)"
                  />
                </template>
                <slot name="before-quick-links" />
                <DsfrHeaderMenuLinks
                    v-if="menuOpened"
                    role="navigation"
                    :links="quickLinks"
                    :nav-aria-label="quickLinksAriaLabel"
                    @link-click="onQuickLinkClick"
                />
                <slot name="after-quick-links" />
              </div>

              <template v-if="modalOpened">
                <slot
                  name="mainnav"
                  :hidemodal="hideModal"
                />
              </template>
              <div
                v-if="fieldModalOpened"
                class="flex justify-center items-center"
              >
                <slot
                  name="field"
                  :in-modal="true"
                />
              </div>
            </div>
          </div>
        </FocusTrap>
        <slot />
      </div>
    </div>
  <div class="fr-header__menu fr-modal">
    <div
      v-if="isWithSlotNav && !modalOpened"
      class="fr-container"
    >
      <slot
        name="mainnav"
        :hidemodal="hideModal"
      />
    </div>
  </div>
  </header>
</template>

