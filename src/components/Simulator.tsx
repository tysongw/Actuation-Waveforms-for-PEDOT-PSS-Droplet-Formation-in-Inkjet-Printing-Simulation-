import { useMemo, useState } from "react";
import ControlPanel from "./ControlPanel";
import InteractiveChart from "./InteractiveChart";
import ResultCards from "./ResultCards";
import WaveformSVG from "./WaveformSVG";
import { ExperimentMode, WaveformType, waveformDefaults } from "../data/inkjetData";
import { getSinusoidalDwellPrediction, getSinusoidalVoltagePrediction, getUnipolarPrediction } from "../utils/interpolation";

export default function Simulator() {
  const [waveform, setWaveform] = useState<WaveformType>("Sinusoidal");
  const [experimentMode, setExperimentMode] = useState<ExperimentMode>("voltage");
  const [voltage, setVoltage] = useState(waveformDefaults.Sinusoidal.voltage);
  const [cycleTime, setCycleTime] = useState(waveformDefaults.Sinusoidal.cycleTime);

  const prediction = useMemo(() => {
    if (waveform === "Unipolar") return getUnipolarPrediction(voltage, cycleTime);
    if (experimentMode === "dwell") return getSinusoidalDwellPrediction(cycleTime);
    return getSinusoidalVoltagePrediction(voltage);
  }, [experimentMode, waveform, voltage, cycleTime]);

  function handleWaveformChange(nextWaveform: WaveformType) {
    const defaults = waveformDefaults[nextWaveform];
    setWaveform(nextWaveform);
    setExperimentMode("voltage");
    setVoltage(defaults.voltage);
    setCycleTime(defaults.cycleTime);
  }

  function handleExperimentModeChange(nextMode: ExperimentMode) {
    setExperimentMode(nextMode);
    if (nextMode === "voltage") {
      setCycleTime(15);
    } else {
      setVoltage(33);
    }
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Empirical PEDOT:PSS inkjet model</p>
          <h1>Interactive Inkjet Droplet Waveform Simulator</h1>
          <p className="subtitle">
            Compare voltage and dwell-time sweeps derived from reported droplet formation experiments.
          </p>
        </div>
        <p className="scientific-note">
          Predictions use figure-level experimental data with piecewise linear interpolation. Values should be read as
          empirical operating guidance, not a full fluid-dynamics model.
        </p>
      </header>

      <section className="simulator-grid">
        <ControlPanel
          waveform={waveform}
          experimentMode={experimentMode}
          voltage={voltage}
          cycleTime={cycleTime}
          onWaveformChange={handleWaveformChange}
          onExperimentModeChange={handleExperimentModeChange}
          onVoltageChange={setVoltage}
          onCycleTimeChange={setCycleTime}
        />

        <section className="output-column" aria-label="Simulator output">
          <WaveformSVG waveform={waveform} voltage={voltage} cycleTime={cycleTime} />
          <ResultCards prediction={prediction} />
          <InteractiveChart experimentMode={experimentMode} waveform={waveform} prediction={prediction} />
        </section>
      </section>
    </main>
  );
}
