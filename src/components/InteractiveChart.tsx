import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ExperimentMode,
  Prediction,
  WaveformType,
  sinusoidalCycleData,
  sinusoidalCycleEndpoints,
  sinusoidalVoltageData,
  sinusoidalVoltageEndpoints,
} from "../data/inkjetData";
import { getUnipolarEndpointData, getUnipolarSweepData, interpolateSeries } from "../utils/interpolation";

interface InteractiveChartProps {
  waveform: WaveformType;
  experimentMode: ExperimentMode;
  prediction: Prediction;
}

type MetricKey = "diameter" | "speed";

interface ChartPoint {
  x: number;
  diameter: number;
  speed: number;
  status: string;
}

interface EndpointPoint {
  x: number;
  diameter: number;
  speed: number;
  status: string;
}

interface ChartConfig {
  caption: string;
  diameterTitle: string;
  speedTitle: string;
  xLabel: string;
  xUnit: string;
  currentX: number;
  xDomain: [number, number];
  diameterDomain: [number, number];
  speedDomain: [number, number];
  data: ChartPoint[];
  unstableData: EndpointPoint[];
}

export default function InteractiveChart({ experimentMode, waveform, prediction }: InteractiveChartProps) {
  const chart = buildChart(waveform, experimentMode, prediction);

  return (
    <section className="chart-stack" aria-label="Experimental sweep charts">
      <SingleMetricChart
        chart={chart}
        color="#1d64c8"
        metric="diameter"
        prediction={prediction}
        title={chart.diameterTitle}
        unit={"\u00b5m"}
        yDomain={chart.diameterDomain}
        yLabel={"Diameter (\u00b5m)"}
      />
      <SingleMetricChart
        chart={chart}
        color="#c83d3d"
        metric="speed"
        prediction={prediction}
        title={chart.speedTitle}
        unit="m/s"
        yDomain={chart.speedDomain}
        yLabel="Speed (m/s)"
      />
    </section>
  );
}

function SingleMetricChart({
  chart,
  color,
  metric,
  prediction,
  title,
  unit,
  yDomain,
  yLabel,
}: {
  chart: ChartConfig;
  color: string;
  metric: MetricKey;
  prediction: Prediction;
  title: string;
  unit: string;
  yDomain: [number, number];
  yLabel: string;
}) {
  const currentValue = metric === "diameter" ? prediction.diameter : prediction.speed ?? 0;

  return (
    <section className="visual-card chart-card">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{chart.caption}</p>
        </div>
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer height={320} width="100%">
          <LineChart data={chart.data} margin={{ top: 20, right: 28, bottom: 20, left: 4 }}>
            <CartesianGrid stroke="#e1e7ef" strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              domain={chart.xDomain}
              label={{ value: chart.xLabel, position: "insideBottom", offset: -8 }}
              tickLine={false}
              type="number"
              unit={chart.xUnit}
            />
            <YAxis
              domain={yDomain}
              label={{ value: yLabel, angle: -90, position: "insideLeft" }}
              stroke={color}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0]?.payload as ChartPoint | undefined;
                const value = Number(payload[0]?.value ?? 0);
                return (
                  <div className="chart-tooltip">
                    <strong>
                      {chart.xLabel}: {label}
                      {chart.xUnit}
                    </strong>
                    <span style={{ color }}>
                      {metric === "diameter" ? "Diameter" : "Speed"}: {value.toFixed(2)} {unit}
                    </span>
                    {point?.status && <em>{point.status}</em>}
                  </div>
                );
              }}
            />
            <Line
              activeDot={{ r: 6 }}
              dataKey={metric}
              dot={{ r: 4 }}
              isAnimationActive={false}
              name={metric === "diameter" ? "Diameter" : "Speed"}
              stroke={color}
              strokeWidth={2.5}
              type="monotone"
            />
            {chart.unstableData.map((point) => (
              <ReferenceDot
                fill="#ffffff"
                ifOverflow="extendDomain"
                key={`${metric}-${point.x}-${point.status}`}
                r={6}
                stroke="#e09b2f"
                strokeDasharray="3 2"
                strokeWidth={2}
                x={point.x}
                y={point[metric]}
              />
            ))}
            <ReferenceDot
              fill="#172033"
              ifOverflow="extendDomain"
              r={7}
              stroke="#ffffff"
              strokeWidth={2}
              x={chart.currentX}
              y={currentValue}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function buildChart(waveform: WaveformType, experimentMode: ExperimentMode, prediction: Prediction): ChartConfig {
  if (waveform === "Sinusoidal" && experimentMode === "dwell") {
    return {
      caption: "Driving voltage is fixed at 33 V; only dwell time is varied.",
      diameterTitle: "Droplet diameter vs dwell time",
      speedTitle: "Flying speed vs dwell time",
      xLabel: "Dwell time",
      xUnit: " \u00b5s",
      currentX: prediction.cycleTime,
      xDomain: [12, 24],
      diameterDomain: [28, 56],
      speedDomain: [0, 7],
      data: sinusoidalCycleData.map((point) => ({ x: point.cycleTime, ...point })),
      unstableData: sinusoidalCycleEndpoints.map((point) => {
        const cycleTime = point.cycleTime < 15 ? 15 : 21;
        return {
          x: point.cycleTime,
          diameter: interpolateSeries(sinusoidalCycleData, "cycleTime", "diameter", cycleTime),
          speed: interpolateSeries(sinusoidalCycleData, "cycleTime", "speed", cycleTime),
          status: point.status,
        };
      }),
    };
  }

  if (waveform === "Sinusoidal") {
    return {
      caption: "Dwell time is fixed at 15 \u00b5s; only driving voltage is varied.",
      diameterTitle: "Droplet diameter vs voltage",
      speedTitle: "Flying speed vs voltage",
      xLabel: "Driving voltage",
      xUnit: " V",
      currentX: prediction.voltage,
      xDomain: [30, 48],
      diameterDomain: [28, 56],
      speedDomain: [0, 7],
      data: sinusoidalVoltageData.map((point) => ({ x: point.voltage, ...point })),
      unstableData: sinusoidalVoltageEndpoints.map((point) => {
        const voltage = point.voltage < 33 ? 33 : 45;
        return {
          x: point.voltage,
          diameter: interpolateSeries(sinusoidalVoltageData, "voltage", "diameter", voltage),
          speed: interpolateSeries(sinusoidalVoltageData, "voltage", "speed", voltage),
          status: point.status,
        };
      }),
    };
  }

  return {
    caption: "Drive voltage is selected with the slider; dwell time is swept from Figure 3 data.",
    diameterTitle: "Droplet diameter vs dwell time",
    speedTitle: "Flying speed vs dwell time",
    xLabel: "Dwell time",
    xUnit: " \u00b5s",
    currentX: prediction.cycleTime,
    xDomain: [0, 35],
    diameterDomain: [30, 70],
    speedDomain: [0, 8],
    data: getUnipolarSweepData(prediction.voltage).map((point) => ({ x: point.dwellTime, ...point })),
    unstableData: getUnipolarEndpointData(prediction.voltage).map((point) => ({ x: point.dwellTime, ...point })),
  };
}
