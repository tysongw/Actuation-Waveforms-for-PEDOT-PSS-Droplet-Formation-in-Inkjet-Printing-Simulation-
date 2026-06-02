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
  Prediction,
  WaveformType,
  sinusoidalVoltageData,
  sinusoidalVoltageEndpoints,
  unipolarBaselineData,
} from "../data/inkjetData";
import { interpolateSeries } from "../utils/interpolation";

interface InteractiveChartProps {
  waveform: WaveformType;
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

export default function InteractiveChart({ waveform, prediction }: InteractiveChartProps) {
  const chart = buildVoltageChart(waveform, prediction);

  return (
    <section className="chart-stack" aria-label="Voltage sweep charts">
      <SingleMetricChart
        chart={chart}
        color="#1d64c8"
        metric="diameter"
        prediction={prediction}
        title={waveform === "Sinusoidal" ? "Droplet diameter vs voltage" : "Baseline diameter vs voltage"}
        unit="µm"
        yDomain={chart.diameterDomain}
        yLabel="Diameter (µm)"
      />
      <SingleMetricChart
        chart={chart}
        color="#c83d3d"
        metric="speed"
        prediction={prediction}
        title={waveform === "Sinusoidal" ? "Ejection speed vs voltage" : "Baseline speed vs voltage"}
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
  chart: ReturnType<typeof buildVoltageChart>;
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

function buildVoltageChart(waveform: WaveformType, prediction: Prediction) {
  if (waveform === "Sinusoidal") {
    return {
      caption: "Fixed at 15 \u00b5s; open markers indicate unstable voltage endpoints.",
      xLabel: "Driving voltage",
      xUnit: " V",
      currentX: prediction.voltage,
      xDomain: [30, 48] as [number, number],
      diameterDomain: [28, 56] as [number, number],
      speedDomain: [0, 7] as [number, number],
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
    caption: "Unipolar is shown as an approximate baseline reference.",
    xLabel: "Drive voltage",
    xUnit: " V",
    currentX: prediction.voltage,
    xDomain: [25, 45] as [number, number],
    diameterDomain: [48, 72] as [number, number],
    speedDomain: [0, 4] as [number, number],
    data: [
      { x: 25, diameter: 56, speed: 1.85, status: "approximate baseline" },
      { x: 35, diameter: unipolarBaselineData[0].diameter, speed: unipolarBaselineData[0].speed, status: "stable baseline" },
      { x: 45, diameter: 64, speed: 2.55, status: "approximate baseline" },
    ],
    unstableData: [] as EndpointPoint[],
  };
}
