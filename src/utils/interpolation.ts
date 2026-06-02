import {
  Prediction,
  bipolarData,
  nozzleDiameter,
  sinusoidalCycleData,
  sinusoidalVoltageData,
  unipolarBaselineData,
} from "../data/inkjetData";

type NumericRecord = Record<string, number | string | null>;

export function linearInterpolate(x: number, x0: number, y0: number, x1: number, y1: number) {
  if (x0 === x1) return y0;
  return y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
}

export function interpolateSeries<T extends NumericRecord>(
  series: T[],
  xKey: keyof T,
  yKey: keyof T,
  x: number,
) {
  const sorted = [...series].sort((a, b) => Number(a[xKey]) - Number(b[xKey]));
  if (x <= Number(sorted[0][xKey])) return Number(sorted[0][yKey]);
  if (x >= Number(sorted[sorted.length - 1][xKey])) return Number(sorted[sorted.length - 1][yKey]);

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const left = sorted[index];
    const right = sorted[index + 1];
    const leftX = Number(left[xKey]);
    const rightX = Number(right[xKey]);

    if (x >= leftX && x <= rightX) {
      return linearInterpolate(x, leftX, Number(left[yKey]), rightX, Number(right[yKey]));
    }
  }

  return Number(sorted[0][yKey]);
}

export function calculateDropletNozzleRatio(diameter: number) {
  return diameter / nozzleDiameter;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function rounded(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

export function getStabilityStatus(status: string): Prediction["statusTone"] {
  const lowered = status.toLowerCase();
  if (lowered.includes("stable") && !lowered.includes("unstable")) return "stable";
  if (lowered.includes("risk") || lowered.includes("satellite")) return "warning";
  if (lowered.includes("baseline")) return "baseline";
  return "unstable";
}

export function getSinusoidalPrediction(voltage: number, cycleTime: number): Prediction {
  if (voltage < 33) {
    return unstableSinusoidal(voltage, cycleTime, "Under-actuated / unstable");
  }

  if (voltage > 45) {
    return unstableSinusoidal(voltage, cycleTime, "Satellite droplets / over-actuated");
  }

  if (cycleTime < 15) {
    return unstableSinusoidal(voltage, cycleTime, "Too short / unstable");
  }

  if (cycleTime > 21) {
    return unstableSinusoidal(voltage, cycleTime, "Multiple droplets");
  }

  const voltageDiameter = interpolateSeries(sinusoidalVoltageData, "voltage", "diameter", voltage);
  const cycleDiameter = interpolateSeries(sinusoidalCycleData, "cycleTime", "diameter", cycleTime);
  const voltageSpeed = interpolateSeries(sinusoidalVoltageData, "voltage", "speed", voltage);
  const cycleSpeed = interpolateSeries(sinusoidalCycleData, "cycleTime", "speed", cycleTime);
  const printedDiameter = interpolateSeries(sinusoidalVoltageData, "voltage", "printedDiameter", voltage);
  const referenceDiameter = 33.35;
  const referenceSpeed = 1.56;
  const diameter = clamp(referenceDiameter + (voltageDiameter - referenceDiameter) + (cycleDiameter - referenceDiameter), 30, 55);
  const speed = clamp(referenceSpeed + (voltageSpeed - referenceSpeed) + (cycleSpeed - referenceSpeed), 0.5, 7);
  const optimized = voltage === 33 && cycleTime === 15;
  const status = optimized ? "Stable - optimized sinusoidal condition" : "Stable jetting window";

  return {
    waveform: "Sinusoidal",
    voltage,
    cycleTime,
    diameter: rounded(diameter),
    speed: rounded(speed),
    printedDiameter: rounded(printedDiameter),
    ratio: rounded(calculateDropletNozzleRatio(diameter)),
    status,
    statusTone: "stable",
  };
}

function unstableSinusoidal(voltage: number, cycleTime: number, status: string): Prediction {
  const fallbackDiameter = interpolateSeries(sinusoidalVoltageData, "voltage", "diameter", clamp(voltage, 33, 45));
  const fallbackSpeed = interpolateSeries(sinusoidalVoltageData, "voltage", "speed", clamp(voltage, 33, 45));

  return {
    waveform: "Sinusoidal",
    voltage,
    cycleTime,
    diameter: rounded(fallbackDiameter),
    speed: rounded(fallbackSpeed),
    ratio: rounded(calculateDropletNozzleRatio(fallbackDiameter)),
    status,
    statusTone: getStabilityStatus(status),
    note: "Output is shown at the nearest calibrated stable voltage for scale; jetting state is not stable.",
  };
}

export function getBipolarPrediction(compressionVoltage: number, cycleTime: number): Prediction {
  const interpolatedDiameter = interpolateSeries(bipolarData, "compressionVoltage", "diameter", compressionVoltage);
  const interpolatedSpeed = interpolateSeries(bipolarData, "compressionVoltage", "speed", compressionVoltage);
  const durationPenalty = Math.max(0, cycleTime - 15);
  const diameter = interpolatedDiameter + 0.8 * durationPenalty;
  const speed = Math.max(0.3, interpolatedSpeed - 0.04 * durationPenalty);
  let status = compressionVoltage === -27 && cycleTime === 15 ? "Stable - minimum stable droplet" : "Stable bipolar jetting";
  let statusTone: Prediction["statusTone"] = "stable";

  if (cycleTime > 24) {
    status = "Multiple droplet risk";
    statusTone = "warning";
  }

  return {
    waveform: "Bipolar",
    voltage: compressionVoltage,
    cycleTime,
    diameter: rounded(diameter),
    speed: rounded(speed),
    ratio: rounded(calculateDropletNozzleRatio(diameter)),
    status,
    statusTone,
    note: "Expansion voltage is held at 33 V; compression voltage is varied.",
  };
}

export function getUnipolarPrediction(voltage: number, dwellTime: number): Prediction {
  const baseline = unipolarBaselineData[0];
  const voltageEffect = (voltage - 35) * 0.35;
  const dwellEffect = (dwellTime - 12) * 0.25;
  const diameter = clamp(baseline.diameter + voltageEffect + dwellEffect, 52, 68);
  const speed = clamp(baseline.speed + (voltage - 35) * 0.035, 1.5, 3.1);

  return {
    waveform: "Unipolar",
    voltage,
    cycleTime: dwellTime,
    diameter: rounded(diameter),
    speed: rounded(speed),
    ratio: rounded(calculateDropletNozzleRatio(diameter)),
    status: "Approximate baseline",
    statusTone: "baseline",
    note: "Unipolar waveform is used as a baseline. The reported optimized droplet size is around 60 \u00b5m.",
  };
}
