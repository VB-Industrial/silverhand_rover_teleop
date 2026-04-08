import {
  activateEstop,
  commandAngular,
  commandLinear,
  inputSource,
  safetyState,
  setCommand,
  setInputSource,
  setSpeedPreset,
  stopCommand,
} from "../store/appState";
import { sendCmdVelToRobot, sendEstopToRobot, sendStopToRobot } from "../transport/robotConnectionStore";

const pressedKeys = new Set<string>();
let animationFrame = 0;
let lastButtons: boolean[] = [];
let lastSpeedBucket = -1;

export function initializeInputController(): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) {
      return;
    }
    pressedKeys.add(event.code);
    setInputSource("keyboard_mouse");

    if (event.code === "Space") {
      event.preventDefault();
      stopCommand();
      void sendStopToRobot();
      return;
    }

    if (event.code === "KeyN") {
      setSpeedPreset("N");
      return;
    }

    if (event.code === "Digit1") {
      setSpeedPreset("1");
      return;
    }

    if (event.code === "Digit2") {
      setSpeedPreset("2");
      return;
    }

    if (event.code === "Digit3") {
      setSpeedPreset("3");
      return;
    }

    if (event.code === "KeyX") {
      activateEstop();
      void sendEstopToRobot();
      return;
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    pressedKeys.delete(event.code);
  };

  const onWindowBlur = () => {
    pressedKeys.clear();
    stopCommand();
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onWindowBlur);

  const tick = () => {
    animationFrame = window.requestAnimationFrame(tick);
    updateFromKeyboard();
    updateFromGamepad();
  };
  animationFrame = window.requestAnimationFrame(tick);

  return () => {
    window.cancelAnimationFrame(animationFrame);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", onWindowBlur);
  };
}

function updateFromKeyboard(): void {
  if (!hasKeyboardIntent()) {
    if (inputSource.value === "keyboard_mouse" && Math.abs(commandLinear.value) < 0.001 && Math.abs(commandAngular.value) < 0.001) {
      return;
    }
    if (inputSource.value === "keyboard_mouse" && !pressedKeys.has("ShiftLeft") && !pressedKeys.has("ShiftRight")) {
      setCommand(0, 0, false);
    }
    return;
  }

  if (safetyState.value.estopActive) {
    return;
  }

  const forward = pressedKeys.has("KeyW") ? 1 : 0;
  const backward = pressedKeys.has("KeyS") ? 1 : 0;
  const left = pressedKeys.has("KeyA") ? 1 : 0;
  const right = pressedKeys.has("KeyD") ? 1 : 0;
  const linear = forward - backward;
  const angular = left - right;
  const turbo = pressedKeys.has("ShiftLeft") || pressedKeys.has("ShiftRight");
  setCommand(linear, angular, turbo);
  void sendCmdVelToRobot();
}

function updateFromGamepad(): void {
  const pads = navigator.getGamepads?.() ?? [];
  const gamepad = pads.find((pad) => pad && pad.connected);
  if (!gamepad) {
    lastButtons = [];
    lastSpeedBucket = -1;
    return;
  }

  const angularAxis = gamepad.axes[0] ?? 0;
  const linearAxis = -(gamepad.axes[1] ?? 0);
  const speedAxis = gamepad.axes[2] ?? 0;
  const hasIntent = Math.abs(linearAxis) > 0.14 || Math.abs(angularAxis) > 0.14;
  if (!hasIntent) {
    if (inputSource.value === "joystick") {
      setCommand(0, 0, false);
    }
  } else if (!safetyState.value.estopActive) {
    setInputSource("joystick");
    setCommand(applyDeadzone(linearAxis), applyDeadzone(angularAxis), Boolean(gamepad.buttons[5]?.pressed));
    void sendCmdVelToRobot();
  }

  const speedBucket = bucketiseSpeedAxis(speedAxis);
  if (speedBucket !== -1 && speedBucket !== lastSpeedBucket) {
    setSpeedPreset(presetFromBucket(speedBucket));
  }
  lastSpeedBucket = speedBucket;

  if (isButtonPressed(gamepad, 0)) {
    setSpeedPreset("1");
  }
  if (isButtonPressed(gamepad, 1)) {
    stopCommand();
    void sendStopToRobot();
  }
  if (isButtonPressed(gamepad, 2)) {
    setSpeedPreset("2");
  }
  if (isButtonPressed(gamepad, 3)) {
    setSpeedPreset("3");
  }
  if (isButtonPressed(gamepad, 9)) {
    activateEstop();
    void sendEstopToRobot();
  }

  lastButtons = gamepad.buttons.map((button) => button.pressed);
}

function applyDeadzone(value: number): number {
  if (Math.abs(value) < 0.14) {
    return 0;
  }
  return value;
}

function hasKeyboardIntent(): boolean {
  return (
    pressedKeys.has("KeyW") ||
    pressedKeys.has("KeyA") ||
    pressedKeys.has("KeyS") ||
    pressedKeys.has("KeyD") ||
    pressedKeys.has("ShiftLeft") ||
    pressedKeys.has("ShiftRight")
  );
}

function isButtonPressed(gamepad: Gamepad, index: number): boolean {
  const pressed = Boolean(gamepad.buttons[index]?.pressed);
  return pressed && !lastButtons[index];
}

function bucketiseSpeedAxis(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) < 0.18) {
    return -1;
  }

  if (value < -0.5) {
    return 0;
  }
  if (value < 0) {
    return 1;
  }
  if (value < 0.5) {
    return 2;
  }
  return 3;
}

function presetFromBucket(bucket: number): "N" | "1" | "2" | "3" {
  switch (bucket) {
    case 0:
      return "N";
    case 1:
      return "1";
    case 2:
      return "2";
    case 3:
    default:
      return "3";
  }
}
