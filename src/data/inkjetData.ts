export type WaveformType = "Unipolar" | "Sinusoidal";
export type ExperimentMode = "voltage" | "dwell";

export type StabilityTone = "stable" | "warning" | "unstable" | "baseline";

export interface Prediction {
  waveform: WaveformType;
  voltage: number;
  cycleTime: number;
  diameter: number;
  speed: number | null;
  ratio: number;
  status: string;
  statusTone: StabilityTone;
  note?: string;
  fixedParameterLabel?: string;
  fixedParameterValue?: string;
}

export const nozzleDiameter = 30;

export const sinusoidalVoltageData = [
  { voltage: 33, diameter: 33.35, speed: 1.56, status: "stable" },
  { voltage: 36, diameter: 34.91, speed: 2.9, status: "stable" },
  { voltage: 39, diameter: 37.0, speed: 3.92, status: "stable" },
  { voltage: 42, diameter: 38.89, speed: 5.01, status: "stable" },
  { voltage: 45, diameter: 48.26, speed: 6.14, status: "stable" },
];

export const sinusoidalVoltageEndpoints = [
  { voltage: 30, diameter: null, speed: null, status: "under-actuated / unstable" },
  { voltage: 48, diameter: null, speed: null, status: "over-actuated / satellite droplets" },
];

export const sinusoidalCycleData = [
  { cycleTime: 15, diameter: 33.35, speed: 1.56, status: "stable" },
  { cycleTime: 18, diameter: 36.67, speed: 2.6, status: "stable" },
  { cycleTime: 21, diameter: 44.3, speed: 3.6, status: "stable" },
];

export const sinusoidalCycleEndpoints = [
  { cycleTime: 12, diameter: null, speed: null, status: "too short / unstable" },
  { cycleTime: 24, diameter: null, speed: null, status: "multiple droplets" },
];

export const unipolarFigure3Data = [
  { voltage: 20, dwellTime: 13, volume: 49, speed: 0.75, status: "stable" },
  { voltage: 20, dwellTime: 16, volume: 58, speed: 1.38, status: "stable" },
  { voltage: 20, dwellTime: 19, volume: 63, speed: 1.55, status: "stable" },
  { voltage: 20, dwellTime: 22, volume: 60, speed: 1.25, status: "stable" },
  { voltage: 20, dwellTime: 25, volume: 51, speed: 1.22, status: "stable" },
  { voltage: 20, dwellTime: 28, volume: 52, speed: 0.95, status: "stable" },
  { voltage: 20, dwellTime: 31, volume: 46, speed: 0.42, status: "stable" },
  { voltage: 25, dwellTime: 10, volume: 69, speed: 1.72, status: "stable" },
  { voltage: 25, dwellTime: 13, volume: 71, speed: 2.78, status: "stable" },
  { voltage: 25, dwellTime: 16, volume: 74, speed: 3.45, status: "stable" },
  { voltage: 25, dwellTime: 19, volume: 78, speed: 3.72, status: "stable" },
  { voltage: 25, dwellTime: 22, volume: 79, speed: 3.67, status: "stable" },
  { voltage: 25, dwellTime: 25, volume: 72, speed: 3.45, status: "stable" },
  { voltage: 30, dwellTime: 7, volume: 61, speed: 2.18, status: "stable" },
  { voltage: 30, dwellTime: 10, volume: 86, speed: 3.48, status: "stable" },
  { voltage: 30, dwellTime: 13, volume: 92, speed: 4.22, status: "stable" },
  { voltage: 35, dwellTime: 4, volume: 62, speed: 1.85, status: "stable" },
  { voltage: 35, dwellTime: 7, volume: 74, speed: 3.6, status: "stable" },
  { voltage: 35, dwellTime: 10, volume: 96, speed: 4.95, status: "stable" },
  { voltage: 40, dwellTime: 4, volume: 76, speed: 3.15, status: "stable" },
  { voltage: 40, dwellTime: 7, volume: 95, speed: 4.95, status: "stable" },
  { voltage: 45, dwellTime: 4, volume: 76, speed: 4.35, status: "stable" },
  { voltage: 50, dwellTime: 4, volume: 85, speed: 5.35, status: "stable" },
];

export const unipolarFigure3Endpoints = [
  { voltage: 20, dwellTime: 10, outcome: "no-droplet", status: "No droplet ejection" },
  { voltage: 20, dwellTime: 34, outcome: "satellite", status: "Satellite droplets" },
  { voltage: 25, dwellTime: 7, outcome: "no-droplet", status: "No droplet ejection" },
  { voltage: 25, dwellTime: 28, outcome: "satellite", status: "Satellite droplets" },
  { voltage: 30, dwellTime: 4, outcome: "no-droplet", status: "No droplet ejection" },
  { voltage: 30, dwellTime: 16, outcome: "satellite", status: "Satellite droplets" },
  { voltage: 35, dwellTime: 1, outcome: "no-droplet", status: "No droplet ejection" },
  { voltage: 35, dwellTime: 13, outcome: "satellite", status: "Satellite droplets" },
  { voltage: 40, dwellTime: 1, outcome: "no-droplet", status: "No droplet ejection" },
  { voltage: 40, dwellTime: 10, outcome: "satellite", status: "Satellite droplets" },
  { voltage: 45, dwellTime: 1, outcome: "no-droplet", status: "No droplet ejection" },
  { voltage: 45, dwellTime: 7, outcome: "satellite", status: "Satellite droplets" },
  { voltage: 50, dwellTime: 1, outcome: "no-droplet", status: "No droplet ejection" },
  { voltage: 50, dwellTime: 7, outcome: "satellite", status: "Satellite droplets" },
] as const;

export const waveformDefaults: Record<WaveformType, { voltage: number; cycleTime: number }> = {
  Unipolar: { voltage: 25, cycleTime: 10 },
  Sinusoidal: { voltage: 33, cycleTime: 15 },
};
