import { signal } from "@preact/signals";

export type InputHint = {
  title: string;
  text: string;
};

export const keyboardHint = signal<InputHint>({
  title: "Клавиатура",
  text: "WASD для движения, Shift для boost, Space для STOP, F для света, Q/E для P-1-2-3.",
});

export const gamepadHint = signal<InputHint>({
  title: "Джойстик",
  text: "Левый стик ведёт rover, ось селектора меняет P-1-2-3, B включает STOP.",
});
