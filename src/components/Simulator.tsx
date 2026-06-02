import { useMemo, useState } from "react";
import ControlPanel from "./ControlPanel";
import InteractiveChart from "./InteractiveChart";
import ResultCards from "./ResultCards";
import WaveformSVG from "./WaveformSVG";
import { WaveformType, waveformDefaults } from "../data/inkjetData";
import { getSinusoidalPrediction, getUnipolarPrediction } from "../utils/interpolation";

export default function Simulator() {
  const [waveform, setWaveform] = useState<WaveformType>("Sinusoidal");
  const [voltage, setVoltage] = useState(waveformDefaults.Sinusoidal.voltage);
  const [cycleTime, setCycleTime] = useState(waveformDefaults.Sinusoidal.cycleTime);

  const prediction = useMemo(() => {
    if (waveform === "Unipolar") return getUnipolarPrediction(voltage, cycleTime);
    return getSinusoidalPrediction(voltage, cycleTime);
  }, [waveform, voltage, cycleTime]);

  function handleWaveformChange(nextWaveform: WaveformType) {
    const defaults = waveformDefaults[nextWaveform];
    setWaveform(nextWaveform);
    setVoltage(defaults.voltage);
    setCycleTime(defaults.cycleTime);
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">PEDOT:PSS inkjet printing model</p>
          <h1>Interactive Inkjet Droplet Waveform Simulator</h1>
          <p className="subtitle">
            Explore how actuation waveform, voltage, and cycle time affect PEDOT:PSS droplet formation.
          </p>
        </div>
        <p className="scientific-note">
          This simulator uses experimental data and piecewise linear interpolation from the reported figures. It is
          intended for interactive visualization and design intuition, not full CFD prediction.
        </p>
      </header>

      <section className="simulator-grid">
        <ControlPanel
          waveform={waveform}
          voltage={voltage}
          cycleTime={cycleTime}
          onWaveformChange={handleWaveformChange}
          onVoltageChange={setVoltage}
          onCycleTimeChange={setCycleTime}
        />

        <section className="output-column" aria-label="Simulator output">
          <WaveformSVG waveform={waveform} voltage={voltage} cycleTime={cycleTime} />
          <ResultCards prediction={prediction} />
          <InteractiveChart waveform={waveform} prediction={prediction} />
        </section>
      </section>
    </main>
  );
}
