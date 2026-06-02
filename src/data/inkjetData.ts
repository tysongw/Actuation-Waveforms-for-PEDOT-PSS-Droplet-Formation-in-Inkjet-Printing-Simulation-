export type WaveformType = "Unipolar" | "Sinusoidal";

export type StabilityTone = "stable" | "warning" | "unstable" | "baseline";

export interface Prediction {
  waveform: WaveformType;
  voltage: number;
  cycleTime: number;
  diameter: number;
  speed: number | null;
  printedDiameter?: number;
  ratio: number;
  status: string;
  statusTone: StabilityTone;
  note?: string;
}

export const nozzleDiameter = 30;

export const sinusoidalVoltageData = [
  { voltage: 33, diameter: 33.35, speed: 1.56, printedDiameter: 53.6, status: "stable" },
  { voltage: 36, diameter: 34.91, speed: 2.9, printedDiameter: 62.7, status: "stable" },
  { voltage: 39, diameter: 37.0, speed: 3.92, printedDiameter: 70.7, status: "stable" },
  { voltage: 42, diameter: 38.89, speed: 5.01, printedDiameter: 74.4, status: "stable" },
  { voltage: 45, diameter: 48.26, speed: 6.14, printedDiameter: 79.4, status: "stable" },
];

export const sinusoidalVoltageEndpoints = [
  { voltage: 30, diameter: null, speed: null, printedDiameter: null, status: "under-actuated / unstable" },
  { voltage: 48, diameter: null, speed: null, printedDiameter: null, status: "over-actuated / satellite droplets" },
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

export const unipolarBaselineData = [
  { waveform: "Unipolar", diameter: 60.0, speed: 2.2, status: "stable baseline" },
] as const;

export const waveformDefaults: Record<WaveformType, { voltage: number; cycleTime: number }> = {
  Unipolar: { voltage: 35, cycleTime: 12 },
  Sinusoidal: { voltage: 33, cycleTime: 15 },
};
