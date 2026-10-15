import { ref } from 'vue';

/** Wraps any angle, including negative ones, into the [0, 360) range. */
const normalize = (deg: number) => ((deg % 360) + 360) % 360;

/** Picks a whole-degree angle in [0, 360) */
const randomAngle = () => Math.floor(Math.random() * 360);

/**
 * Drag-to-rotate behavior around the center of the element the handlers are attached to.
 *
 * Bind the returned handlers to `pointerdown`, `pointermove`, `pointerup` and `pointercancel` on
 * the draggable element.
 *
 * @returns
 * - `angle` : current rotation in degrees, in [0, 360). Starts at a random value.
 * - `randomize` : sets `angle` to a new value.
 * - `onPointerDown`, `onPointerMove`, `onPointerUp`: pointer event handlers.
 */
export function useCaptchaRotation() {
    const angle = ref(randomAngle());

    // Center of the element, measured when the drag starts
    let center = { x: 0, y: 0 };
    let startAngle = 0;
    let activePointerId: number | null = null;

    const pointerAngle = (e: PointerEvent) =>
        -(Math.atan2(center.y - e.clientY, center.x - e.clientX) * 180) / Math.PI;

    function onPointerDown(e: PointerEvent) {
        if (activePointerId !== null) return;
        const el = e.currentTarget as HTMLElement;
        const rect = el.getBoundingClientRect();
        center = { x:rect.left + rect.width / 2, y:rect.top + rect.height / 2 };
        startAngle = normalize(pointerAngle(e) - angle.value);
        el.setPointerCapture(e.pointerId);
        activePointerId = e.pointerId;
    }

    function onPointerMove(e: PointerEvent) {
        if (e.pointerId !== activePointerId) return;
        angle.value = normalize(pointerAngle(e) - startAngle);
    }

    function onPointerUp(e: PointerEvent) {
        if (e.pointerId === activePointerId) activePointerId = null;
    }

    const randomize = () => { angle.value = randomAngle(); };

    return { angle, randomize, onPointerDown, onPointerMove, onPointerUp };
}