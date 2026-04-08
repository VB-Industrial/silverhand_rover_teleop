import { computed, signal } from "@preact/signals";

import type { DriveMode, InputSource } from "../transport/protocol";

export type ConnectionState = "disconnected" | "connecting" | "connected" | "error";
export type LinkQuality = "offline" | "weak" | "stable" | "strong";
export type SpeedPreset = "N" | "1" | "2" | "3";

export type TelemetryState = {
  speedMps: number;
  turnRateRadS: number;
  headingDeg: number;
  rollDeg: number;
  pitchDeg: number;
  batteryPercent: number;
  batteryVoltage: number;
  odometerKm: number;
  commandAgeMs: number;
};

export type SafetyState = {
  roverReady: boolean;
  controlActive: boolean;
  noFaults: boolean;
  estopActive: boolean;
};

export const driveMode = signal<DriveMode>("manual");
export const speedPreset = signal<SpeedPreset>("N");
export const inputSource = signal<InputSource>("keyboard_mouse");
export const connectionState = signal<ConnectionState>("disconnected");
export const linkQuality = signal<LinkQuality>("offline");
export const wsConnected = computed(() => connectionState.value === "connected");
export const commandLinear = signal(0);
export const commandAngular = signal(0);
export const commandTurbo = signal(false);
export const mockEnabled = signal(true);
export const telemetry = signal<TelemetryState>({
  speedMps: 0,
  turnRateRadS: 0,
  headingDeg: 274,
  rollDeg: 2.5,
  pitchDeg: -1.2,
  batteryPercent: 86,
  batteryVoltage: 28.4,
  odometerKm: 16.9,
  commandAgeMs: 0,
});
export const safetyState = signal<SafetyState>({
  roverReady: true,
  controlActive: true,
  noFaults: true,
  estopActive: false,
});

export const speedKph = computed(() => telemetry.value.speedMps * 3.6);
export const batteryLabel = computed(() => `${Math.round(telemetry.value.batteryPercent)}%`);
export const modeLabel = computed(() => translateDriveMode(driveMode.value));
export const sourceLabel = computed(() => translateInputSource(inputSource.value));
export const speedPresetLabel = computed(() => translateSpeedPreset(speedPreset.value));
export const speedPresetMaxMps = computed(() => {
  switch (speedPreset.value) {
    case "N":
      return 0;
    case "1":
      return 0.1;
    case "2":
      return 0.5;
    case "3":
    default:
      return 1.8;
  }
});
export const maxLinearSpeed = computed(() => {
  switch (driveMode.value) {
    case "precision":
      return 0.6;
    case "docking":
      return 0.35;
    case "crab":
      return 1.4;
    case "manual":
    default:
      return 1.8;
  }
});
export const maxAngularSpeed = computed(() => {
  switch (driveMode.value) {
    case "precision":
      return 0.8;
    case "docking":
      return 0.55;
    case "crab":
      return 1.1;
    case "manual":
    default:
      return 1.5;
  }
});
export const commandedLinearMps = computed(
  () => commandLinear.value * speedPresetMaxMps.value,
);
export const commandedAngularRadS = computed(() => commandAngular.value * maxAngularSpeed.value);

export function setSpeedPreset(preset: SpeedPreset): void {
  speedPreset.value = preset;
}

export function setDriveMode(mode: DriveMode): void {
  driveMode.value = mode;
}

export function cycleDriveMode(step: 1 | -1): void {
  const modes: DriveMode[] = ["manual", "crab", "precision", "docking"];
  const currentIndex = modes.indexOf(driveMode.value);
  const nextIndex = (currentIndex + step + modes.length) % modes.length;
  driveMode.value = modes[nextIndex];
}

export function setInputSource(source: InputSource): void {
  inputSource.value = source;
}

export function setCommand(linear: number, angular: number, turbo: boolean): void {
  commandLinear.value = clamp(linear, -1, 1);
  commandAngular.value = clamp(angular, -1, 1);
  commandTurbo.value = turbo;
}

export function stopCommand(): void {
  commandLinear.value = 0;
  commandAngular.value = 0;
  commandTurbo.value = false;
}

export function setConnectionState(nextState: ConnectionState): void {
  connectionState.value = nextState;
  if (nextState !== "connected") {
    linkQuality.value = nextState === "connecting" ? "weak" : "offline";
  }
}

export function setLinkQuality(nextQuality: LinkQuality): void {
  linkQuality.value = nextQuality;
}

export function setBattery(percent: number, voltage = telemetry.value.batteryVoltage): void {
  telemetry.value = {
    ...telemetry.value,
    batteryPercent: clamp(percent, 0, 100),
    batteryVoltage: voltage,
  };
}

export function applyOdometry(speedMps: number, turnRateRadS: number, headingDeg: number, odometerKm?: number): void {
  telemetry.value = {
    ...telemetry.value,
    speedMps,
    turnRateRadS,
    headingDeg: normalizeHeading(headingDeg),
    odometerKm: odometerKm ?? telemetry.value.odometerKm,
    commandAgeMs: 0,
  };
}

export function setRoverReady(ready: boolean): void {
  safetyState.value = {
    ...safetyState.value,
    roverReady: ready,
  };
}

export function setControlActive(active: boolean): void {
  safetyState.value = {
    ...safetyState.value,
    controlActive: active,
  };
}

export function setFault(active: boolean): void {
  safetyState.value = {
    ...safetyState.value,
    noFaults: !active,
  };
}

export function activateEstop(): void {
  safetyState.value = {
    ...safetyState.value,
    estopActive: true,
    controlActive: false,
  };
  stopCommand();
}

export function resetEstop(): void {
  safetyState.value = {
    ...safetyState.value,
    estopActive: false,
    controlActive: true,
  };
}

export function setMockEnabled(enabled: boolean): void {
  mockEnabled.value = enabled;
}

export function tickMock(dtSec: number): void {
  if (!mockEnabled.value || !safetyState.value.controlActive || safetyState.value.estopActive) {
    telemetry.value = {
      ...telemetry.value,
      speedMps: telemetry.value.speedMps * Math.max(0, 1 - dtSec * 2.8),
      turnRateRadS: telemetry.value.turnRateRadS * Math.max(0, 1 - dtSec * 3.2),
      commandAgeMs: telemetry.value.commandAgeMs + dtSec * 1000,
    };
    return;
  }

  const speedTarget = commandedLinearMps.value;
  const turnTarget = commandAngular.value * maxAngularSpeed.value;
  const nextSpeed = approach(telemetry.value.speedMps, speedTarget, dtSec * 1.9);
  const nextTurn = approach(telemetry.value.turnRateRadS, turnTarget, dtSec * 3.8);
  const nextHeading = normalizeHeading(telemetry.value.headingDeg + radToDeg(nextTurn) * dtSec);
  const nextRoll = Math.sin(Date.now() / 900) * 7 + nextTurn * 9;
  const nextPitch = Math.sin(Date.now() / 1300) * 4 + nextSpeed * 3.5;
  const distanceKm = Math.abs(nextSpeed) * dtSec / 1000;
  const batteryDrain = Math.abs(nextSpeed) * dtSec * 0.018 + (commandTurbo.value ? dtSec * 0.008 : 0);

  telemetry.value = {
    ...telemetry.value,
    speedMps: nextSpeed,
    turnRateRadS: nextTurn,
    headingDeg: nextHeading,
    rollDeg: clamp(nextRoll, -25, 25),
    pitchDeg: clamp(nextPitch, -20, 20),
    odometerKm: telemetry.value.odometerKm + distanceKm,
    batteryPercent: clamp(telemetry.value.batteryPercent - batteryDrain, 0, 100),
    batteryVoltage: 24 + telemetry.value.batteryPercent * 0.05,
    commandAgeMs: 0,
  };
}

export function ageTelemetry(dtSec: number): void {
  telemetry.value = {
    ...telemetry.value,
    commandAgeMs: telemetry.value.commandAgeMs + dtSec * 1000,
  };
}

function translateDriveMode(mode: DriveMode): string {
  switch (mode) {
    case "manual":
      return "Ручной";
    case "crab":
      return "Крабовый";
    case "precision":
      return "Точный";
    case "docking":
      return "Швартовка";
    default:
      return mode;
  }
}

function translateInputSource(source: InputSource): string {
  switch (source) {
    case "keyboard_mouse":
      return "Клавиатура + мышь";
    case "joystick":
      return "Джойстик";
    case "mock_autonomy":
      return "Mock backend";
    default:
      return source;
  }
}

function translateSpeedPreset(preset: SpeedPreset): string {
  switch (preset) {
    case "N":
      return "Нейтраль";
    case "1":
      return "До 0.1 м/с";
    case "2":
      return "До 0.5 м/с";
    case "3":
      return "Максимум";
    default:
      return preset;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeHeading(value: number): number {
  let next = value % 360;
  if (next < 0) {
    next += 360;
  }
  return next;
}

function radToDeg(value: number): number {
  return (value * 180) / Math.PI;
}

function approach(current: number, target: number, delta: number): number {
  if (current < target) {
    return Math.min(current + delta, target);
  }
  return Math.max(current - delta, target);
}
