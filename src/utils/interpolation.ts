import {
  Prediction,
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

export function getSinusoidalVoltagePrediction(voltage: number): Prediction {
  const cycleTime = 15;

  if (voltage < 33) {
    return unstableSinusoidalVoltage(voltage, "Under-actuated / unstable");
  }

  if (voltage > 45) {
    return unstableSinusoidalVoltage(voltage, "Satellite droplets / over-actuated");
  }

  const diameter = interpolateSeries(sinusoidalVoltageData, "voltage", "diameter", voltage);
  const speed = interpolateSeries(sinusoidalVoltageData, "voltage", "speed", voltage);
  const status = voltage === 33 ? "Stable - optimized sinusoidal condition" : "Stable voltage sweep condition";

  return {
    waveform: "Sinusoidal",
    voltage,
    cycleTime,
    diameter: rounded(diameter),
    speed: rounded(speed),
    ratio: rounded(calculateDropletNozzleRatio(diameter)),
    status,
    statusTone: "stable",
    fixedParameterLabel: "Fixed dwell time",
    fixedParameterValue: "15 µs",
  };
}

export function getSinusoidalDwellPrediction(cycleTime: number): Prediction {
  const voltage = 33;

  if (cycleTime < 15) {
    return unstableSinusoidalDwell(cycleTime, "Too short / unstable");
  }

  if (cycleTime > 21) {
    return unstableSinusoidalDwell(cycleTime, "Multiple droplets");
  }

  const diameter = interpolateSeries(sinusoidalCycleData, "cycleTime", "diameter", cycleTime);
  const speed = interpolateSeries(sinusoidalCycleData, "cycleTime", "speed", cycleTime);
  const status = cycleTime === 15 ? "Stable - optimized sinusoidal condition" : "Stable dwell-time sweep condition";

  return {
    waveform: "Sinusoidal",
    voltage,
    cycleTime,
    diameter: rounded(diameter),
    speed: rounded(speed),
    ratio: rounded(calculateDropletNozzleRatio(diameter)),
    status,
    statusTone: "stable",
    fixedParameterLabel: "Fixed driving voltage",
    fixedParameterValue: "33 V",
  };
}

function unstableSinusoidalVoltage(voltage: number, status: string): Prediction {
  const cycleTime = 15;
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
    fixedParameterLabel: "Fixed dwell time",
    fixedParameterValue: "15 µs",
  };
}

function unstableSinusoidalDwell(cycleTime: number, status: string): Prediction {
  const voltage = 33;
  const fallbackCycleTime = clamp(cycleTime, 15, 21);
  const fallbackDiameter = interpolateSeries(sinusoidalCycleData, "cycleTime", "diameter", fallbackCycleTime);
  const fallbackSpeed = interpolateSeries(sinusoidalCycleData, "cycleTime", "speed", fallbackCycleTime);

  return {
    waveform: "Sinusoidal",
    voltage,
    cycleTime,
    diameter: rounded(fallbackDiameter),
    speed: rounded(fallbackSpeed),
    ratio: rounded(calculateDropletNozzleRatio(fallbackDiameter)),
    status,
    statusTone: getStabilityStatus(status),
    note: "Output is shown at the nearest calibrated stable dwell time for scale; jetting state is not stable.",
    fixedParameterLabel: "Fixed driving voltage",
    fixedParameterValue: "33 V",
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
