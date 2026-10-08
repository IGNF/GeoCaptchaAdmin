import { onBeforeUnmount, reactive } from "vue";

export function useTimedAlert(duration = 3000) {
    const alert = reactive({ visible: false, title: '', message: '' });
    let timer: ReturnType<typeof setTimeout> | undefined;

    function hide() {
        clearTimeout(timer);
        alert.visible = false;
    }

    function show(title: string, message: string) {
        clearTimeout(timer);
        Object.assign(alert, { visible: true, title, message });
        timer = setTimeout(hide, duration);

        onBeforeUnmount(() => clearTimeout(timer));
    }

    return { alert, show, hide };
}