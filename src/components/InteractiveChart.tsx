import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
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
  bipolarData,
  sinusoidalCycleData,
  sinusoidalCycleEndpoints,
  sinusoidalVoltageData,
  sinusoidalVoltageEndpoints,
  unipolarBaselineData,
} from "../data/inkjetData";
import { interpolateSeries } from "../utils/interpolation";

interface InteractiveChartProps {
  waveform: WaveformType;
  prediction: Prediction;
}

type ChartTab = "voltage" | "cycle";

export default function InteractiveChart({ waveform, prediction }: InteractiveChartProps) {
  const [sinusoidalTab, setSinusoidalTab] = useState<ChartTab>("voltage");
  const chart = useMemo(() => buildChart(waveform, prediction, sinusoidalTab), [waveform, prediction, sinusoidalTab]);

  return (
    <section className="visual-card chart-card">
      <div className="section-heading">
        <div>
          <h2>{chart.title}</h2>
          <p>{chart.caption}</p>
        </div>
        {waveform === "Sinusoidal" && (
          <div className="tab-control" aria-label="Sinusoidal chart mode">
            <button
              className={sinusoidalTab === "voltage" ? "active" : ""}
              onClick={() => setSinusoidalTab("voltage")}
              type="button"
            >
              Voltage
            </button>
            <button className={sinusoidalTab === "cycle" ? "active" : ""} onClick={() => setSinusoidalTab("cycle")} type="button">
              Cycle time
            </button>
          </div>
        )}
      </div>

      <div className="chart-wrap">
        <ResponsiveContainer height={340} width="100%">
          <LineChart data={chart.data} margin={{ top: 24, right: 42, bottom: 20, left: 4 }}>
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
              domain={chart.diameterDomain}
              label={{ value: "Diameter (\u00b5m)", angle: -90, position: "insideLeft" }}
              stroke="#1d64c8"
              tickLine={false}
              yAxisId="diameter"
            />
            <YAxis
              domain={chart.speedDomain}
              label={{ value: "Speed (m/s)", angle: 90, position: "insideRight" }}
              orientation="right"
              stroke="#c83d3d"
              tickLine={false}
              yAxisId="speed"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const status = payload[0]?.payload?.status;
                return (
                  <div className="chart-tooltip">
                    <strong>
                      {chart.xLabel}: {label}
                      {chart.xUnit}
                    </strong>
                    {payload.map((item) => (
                      <span key={item.dataKey as string} style={{ color: item.color }}>
                        {item.name}: {Number(item.value).toFixed(2)}
                      </span>
                    ))}
                    {status && <em>{status}</em>}
                  </div>
                );
              }}
            />
            <Legend verticalAlign="top" />
            <Line
              activeDot={{ r: 6 }}
              dataKey="diameter"
              dot={{ r: 4 }}
              isAnimationActive={false}
              name="Diameter"
              stroke="#1d64c8"
              strokeWidth={2.5}
              type="monotone"
              yAxisId="diameter"
            />
            <Line
              activeDot={{ r: 6 }}
              dataKey="speed"
              dot={{ r: 4 }}
              isAnimationActive={false}
              name="Speed"
              stroke="#c83d3d"
              strokeWidth={2.5}
              type="monotone"
              yAxisId="speed"
            />
            {chart.unstableData.map((point) => (
              <ReferenceDot
                fill="#ffffff"
                ifOverflow="extendDomain"
                key={`${point.x}-${point.status}`}
                r={6}
                stroke="#e09b2f"
                strokeDasharray="3 2"
                strokeWidth={2}
                x={point.x}
                y={point.diameter}
                yAxisId="diameter"
              />
            ))}
            <ReferenceDot
              fill="#172033"
              ifOverflow="extendDomain"
              r={7}
              stroke="#ffffff"
              strokeWidth={2}
              x={chart.currentX}
              y={prediction.diameter}
              yAxisId="diameter"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function buildChart(waveform: WaveformType, prediction: Prediction, sinusoidalTab: ChartTab) {
  if (waveform === "Sinusoidal" && sinusoidalTab === "cycle") {
    const currentX = prediction.cycleTime;
    return {
      title: "Sinusoidal cycle-time sweep",
      caption: "Fixed at 33 V; increasing cycle time increases droplet diameter.",
      xLabel: "Cycle time",
      xUnit: " \u00b5s",
      currentX,
      xDomain: [12, 24] as [number, number],
      diameterDomain: [28, 56] as [number, number],
      speedDomain: [0, 7] as [number, number],
      data: sinusoidalCycleData.map((point) => ({ x: point.cycleTime, ...point })),
      unstableData: sinusoidalCycleEndpoints.map((point) => ({
        x: point.cycleTime,
        diameter: interpolateSeries(sinusoidalCycleData, "cycleTime", "diameter", point.cycleTime < 15 ? 15 : 21),
        status: point.status,
      })),
    };
  }

  if (waveform === "Sinusoidal") {
    const currentX = prediction.voltage;
    return {
      title: "Sinusoidal voltage sweep",
      caption: "Fixed at 15 \u00b5s; endpoints indicate under- and over-actuation.",
      xLabel: "Driving voltage",
      xUnit: " V",
      currentX,
      xDomain: [30, 48] as [number, number],
      diameterDomain: [28, 56] as [number, number],
      speedDomain: [0, 7] as [number, number],
      data: sinusoidalVoltageData.map((point) => ({ x: point.voltage, ...point })),
      unstableData: sinusoidalVoltageEndpoints.map((point) => ({
        x: point.voltage,
        diameter: interpolateSeries(sinusoidalVoltageData, "voltage", "diameter", point.voltage < 33 ? 33 : 45),
        status: point.status,
      })),
    };
  }

  if (waveform === "Bipolar") {
    return {
      title: "Bipolar compression-voltage sweep",
      caption: "Expansion voltage is fixed at 33 V; weaker compression reduces droplet size.",
      xLabel: "Compression voltage",
      xUnit: " V",
      currentX: prediction.voltage,
      xDomain: [-33, -27] as [number, number],
      diameterDomain: [28, 40] as [number, number],
      speedDomain: [0, 3.5] as [number, number],
      data: bipolarData.map((point) => ({ x: point.compressionVoltage, ...point })),
      unstableData: [],
    };
  }

  return {
    title: "Unipolar baseline marker",
    caption: "Baseline reference around 60 \u00b5m; not a fully calibrated model.",
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
    unstableData: [],
  };
}
