import { Prediction } from "../data/inkjetData";

interface ResultCardsProps {
  prediction: Prediction;
}

export default function ResultCards({ prediction }: ResultCardsProps) {
  return (
    <section className="result-section" aria-label="Prediction results">
      <MetricCard label="Waveform" value={prediction.waveform} />
      <MetricCard
        label={prediction.waveform === "Bipolar" ? "Compression Voltage" : "Voltage"}
        value={`${prediction.voltage} V`}
      />
      <MetricCard
        label={prediction.waveform === "Unipolar" ? "Dwell Time" : "Cycle Time"}
        value={`${prediction.cycleTime} \u00b5s`}
      />
      <MetricCard label="In-flight Diameter" value={`${prediction.diameter.toFixed(2)} \u00b5m`} tone="blue" />
      <MetricCard label="Ejection Speed" value={prediction.speed === null ? "n/a" : `${prediction.speed.toFixed(2)} m/s`} tone="red" />
      {prediction.printedDiameter !== undefined && (
        <MetricCard label="Printed Dot Diameter" value={`${prediction.printedDiameter.toFixed(1)} \u00b5m`} />
      )}
      <MetricCard label="Droplet / Nozzle" value={`${prediction.ratio.toFixed(2)}x`} />
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
