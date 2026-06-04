import {
  Prediction,
  nozzleDiameter,
  sinusoidalCycleData,
  sinusoidalVoltageData,
  unipolarFigure3Data,
  unipolarFigure3Endpoints,
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

function volumePlToDiameterUm(volume: number) {
  const volumeUm3 = volume * 1000;
  return 2 * Math.cbrt((3 * volumeUm3) / (4 * Math.PI));
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
  const envelope = getUnipolarStableEnvelope(voltage);
  const calibratedDwellTime = clamp(dwellTime, envelope.minDwellTime, envelope.maxDwellTime);
  const point = interpolateUnipolarPoint(voltage, calibratedDwellTime);
  const diameter = volumePlToDiameterUm(point.volume);
  const isBelowStableRange = dwellTime < envelope.minDwellTime;
  const isAboveStableRange = dwellTime > envelope.maxDwellTime;
  const status = isBelowStableRange
    ? "No droplet ejection"
    : isAboveStableRange
      ? "Satellite droplets"
      : voltage === 25 && dwellTime === 10
        ? "Stable - reported unipolar operating point"
        : "Stable Figure 3 condition";

  return {
    waveform: "Unipolar",
    voltage,
    cycleTime: dwellTime,
    diameter: rounded(diameter),
    speed: rounded(point.speed),
    ratio: rounded(calculateDropletNozzleRatio(diameter)),
    status,
    statusTone: isBelowStableRange ? "unstable" : isAboveStableRange ? "warning" : "stable",
    note:
      isBelowStableRange || isAboveStableRange
        ? "Output is shown at the nearest calibrated stable dwell time for scale; jetting state follows the Figure 3 marker."
        : "Unipolar prediction is interpolated from Figure 3 volume and flying-speed data.",
  };
}

export function getUnipolarStableEnvelope(voltage: number) {
  const summaries = getUnipolarVoltageSummaries();

  return {
    minDwellTime: interpolateSeries(summaries, "voltage", "minDwellTime", voltage),
    maxDwellTime: interpolateSeries(summaries, "voltage", "maxDwellTime", voltage),
  };
}

export function getUnipolarSweepData(voltage: number) {
  const envelope = getUnipolarStableEnvelope(voltage);
  const sampleCount = Math.max(2, Math.round(envelope.maxDwellTime - envelope.minDwellTime) + 1);

  return Array.from({ length: sampleCount }, (_, index) => {
    const dwellTime =
      envelope.minDwellTime + ((envelope.maxDwellTime - envelope.minDwellTime) * index) / (sampleCount - 1);
    const point = interpolateUnipolarPoint(voltage, dwellTime);
    const diameter = volumePlToDiameterUm(point.volume);

    return {
      dwellTime: rounded(dwellTime),
      diameter: rounded(diameter),
      speed: rounded(point.speed),
      status: "stable Figure 3 interpolation",
    };
  });
}

export function getUnipolarEndpointData(voltage: number) {
  const endpoints = getUnipolarEndpointSummaries();

  return ["no-droplet", "satellite"].map((outcome) => {
    const matchingEndpoints = endpoints.filter((point) => point.outcome === outcome);
    const dwellTime = interpolateSeries(matchingEndpoints, "voltage", "dwellTime", voltage);
    const envelope = getUnipolarStableEnvelope(voltage);
    const point = interpolateUnipolarPoint(voltage, clamp(dwellTime, envelope.minDwellTime, envelope.maxDwellTime));
    const diameter = volumePlToDiameterUm(point.volume);

    return {
      dwellTime: rounded(dwellTime),
      diameter: rounded(diameter),
      speed: rounded(point.speed),
      status: outcome === "no-droplet" ? "No droplet ejection" : "Satellite droplets",
    };
  });
}

function interpolateUnipolarPoint(voltage: number, dwellTime: number) {
  const voltages = [...new Set(unipolarFigure3Data.map((point) => point.voltage))].sort((a, b) => a - b);
  const lowerVoltage = voltages.filter((candidate) => candidate <= voltage).at(-1) ?? voltages[0];
  const upperVoltage = voltages.find((candidate) => candidate >= voltage) ?? voltages[voltages.length - 1];
  const lowerPoint = interpolateUnipolarSeriesAtVoltage(lowerVoltage, dwellTime);
  const upperPoint = interpolateUnipolarSeriesAtVoltage(upperVoltage, dwellTime);

  if (lowerVoltage === upperVoltage) return lowerPoint;

  return {
    volume: linearInterpolate(voltage, lowerVoltage, lowerPoint.volume, upperVoltage, upperPoint.volume),
    speed: linearInterpolate(voltage, lowerVoltage, lowerPoint.speed, upperVoltage, upperPoint.speed),
  };
}

function interpolateUnipolarSeriesAtVoltage(voltage: number, dwellTime: number) {
  const series = unipolarFigure3Data.filter((point) => point.voltage === voltage);
  const clampedDwellTime = clamp(
    dwellTime,
    Math.min(...series.map((point) => point.dwellTime)),
    Math.max(...series.map((point) => point.dwellTime)),
  );

  return {
    volume: interpolateSeries(series, "dwellTime", "volume", clampedDwellTime),
    speed: interpolateSeries(series, "dwellTime", "speed", clampedDwellTime),
  };
}

function getUnipolarVoltageSummaries() {
  return [...new Set(unipolarFigure3Data.map((point) => point.voltage))].map((voltage) => {
    const series = unipolarFigure3Data.filter((point) => point.voltage === voltage);

    return {
      voltage,
      minDwellTime: Math.min(...series.map((point) => point.dwellTime)),
      maxDwellTime: Math.max(...series.map((point) => point.dwellTime)),
    };
  });
}

function getUnipolarEndpointSummaries() {
  return unipolarFigure3Endpoints.map((point) => ({
    voltage: point.voltage,
    dwellTime: point.dwellTime,
    outcome: point.outcome,
  }));
}
