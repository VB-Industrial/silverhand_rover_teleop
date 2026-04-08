import type { CameraConfig, CameraId } from "./cameraTypes";

function envValue(key: string): string {
  const env = import.meta.env as Record<string, string | undefined>;
  return (env[key] ?? "").trim();
}

export const cameraConfigs: CameraConfig[] = [
  {
    id: "front",
    title: "Передняя камера",
    whepUrl: envValue("VITE_CAMERA_FRONT_WHEP_URL"),
    enabledByDefault: true,
    reconnectDelayMs: 2000,
    connectTimeoutMs: 8000,
    tone: "front",
  },
  {
    id: "rear",
    title: "Задняя панорама",
    whepUrl: envValue("VITE_CAMERA_REAR_WHEP_URL"),
    enabledByDefault: false,
    reconnectDelayMs: 2500,
    connectTimeoutMs: 8000,
    tone: "rear",
  },
  {
    id: "panoramic",
    title: "Передняя панорама",
    whepUrl: envValue("VITE_CAMERA_PANORAMIC_WHEP_URL"),
    enabledByDefault: false,
    reconnectDelayMs: 2500,
    connectTimeoutMs: 8000,
    tone: "panoramic",
  },
];

export const cameraConfigMap = Object.fromEntries(cameraConfigs.map((config) => [config.id, config])) as Record<
  CameraId,
  CameraConfig
>;
