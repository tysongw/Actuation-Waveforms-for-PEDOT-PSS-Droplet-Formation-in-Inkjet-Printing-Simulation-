import { Prediction } from "../data/inkjetData";

interface ResultCardsProps {
  prediction: Prediction;
}

export default function ResultCards({ prediction }: ResultCardsProps) {
  const isSinusoidalVoltageSweep = prediction.fixedParameterLabel === "Fixed dwell time";
  const isSinusoidalDwellSweep = prediction.fixedParameterLabel === "Fixed driving voltage";

  return (
    <section className="result-section" aria-label="Prediction results">
      {!isSinusoidalDwellSweep && <MetricCard label="Driving Voltage" value={`${prediction.voltage} V`} />}
      {!isSinusoidalVoltageSweep && (
        <MetricCard label="Dwell Time" value={`${prediction.cycleTime} \u00b5s`} />
      )}
      {prediction.fixedParameterLabel && prediction.fixedParameterValue && (
        <MetricCard label={prediction.fixedParameterLabel} value={prediction.fixedParameterValue} />
      )}
      <MetricCard label="In-flight Diameter" value={`${prediction.diameter.toFixed(2)} \u00b5m`} tone="blue" />
      <MetricCard label="Flying Speed" value={prediction.speed === null ? "n/a" : `${prediction.speed.toFixed(2)} m/s`} tone="red" />
      <article className="metric-card stability-card">
        <span className="metric-label">Jetting Stability</span>
        <span className={`status-badge ${prediction.statusTone}`}>{prediction.status}</span>
        {prediction.note && <p>{prediction.note}</p>}
      </article>
    </section>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone?: "blue" | "red" }) {
  return (
    <article className={`metric-card ${tone ?? ""}`}>
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
