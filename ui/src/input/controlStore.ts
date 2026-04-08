import { signal } from "@preact/signals";

export type InputHint = {
  title: string;
  text: string;
};

export const keyboardHint = signal<InputHint>({
  title: "Клавиатура",
  text: "WASD для движения, Shift для boost, Space для stop, Q/E для смены режима.",
});

export const gamepadHint = signal<InputHint>({
  title: "Джойстик",
  text: "Левый стик ведёт rover, кнопки A/B/X/Y переключают режимы и стоп.",
});
