import type { DsfrLanguageSelectorProps} from "@gouvminint/vue-dsfr";
import { VIcon } from "@gouvminint/vue-dsfr";
import type { HTMLAttributes, StyleValue } from "vue";
import type { RouteLocationRaw } from "vue-router";
import type { DsfrHeaderMenuLinkProps } from "@gouvminint/vue-dsfr";

export type CustomHeaderProps = {
    serviceTitle?: string
    serviceDescription?: string
    homeTo?: string
    logoText?: string | string[]
    modelValue?: string
    operatorImgAlt?: string
    operatorImgSrc?: string
    operatorImgStyle?: StyleValue
    quickLinks?: (DsfrHeaderMenuLinkProps & HTMLAttributes)[]
    languageSelector?: DsfrLanguageSelectorProps
    quickLinksAriaLabel?: string
    /** Displays the 'field' slot (and the opening button on mobile) */
    showField?: boolean
    /** Label accessible from the modal opening button on mobile */
    showFieldLabel?: string
    fieldIcon?: string
    showBeta?: boolean
    menuLabel?: string
    menuModalLabel?: string
    closeMenuModalLabel?: string
    homeLabel?: string
}