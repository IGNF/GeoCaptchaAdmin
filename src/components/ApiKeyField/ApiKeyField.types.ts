export type ApiKeyFieldProps = {
    /** Input ID (automatically generated if missing) */
    id?: string
    label?: string
    modelValue?: string
    placeholder?: string
    /** true = validated key: the field is disabled and the button enables edition */
    locked?: boolean
    /** Button text when the key is editable */
    validateText?: string
    /** Button text when the key is locked */
    editText?: string
}