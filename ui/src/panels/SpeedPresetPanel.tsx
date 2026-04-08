import { setSpeedPreset, speedPreset, type SpeedPreset } from "../store/appState";

const PRESETS: Array<{ id: SpeedPreset; label: string; meta: string }> = [
  { id: "3", label: "3", meta: "max" },
  { id: "2", label: "2", meta: "0.5" },
  { id: "1", label: "1", meta: "0.1" },
  { id: "N", label: "N", meta: "стоп" },
];

export function SpeedPresetPanel() {
  return (
    <section className="panel speed-preset-panel">
      <div className="speed-preset-stack">
        {PRESETS.map((preset) => (
          <button
            className={preset.id === speedPreset.value ? "speed-preset-chip active" : "speed-preset-chip"}
            onClick={() => setSpeedPreset(preset.id)}
            type="button"
          >
            <strong>{preset.label}</strong>
            <span>{preset.meta}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
