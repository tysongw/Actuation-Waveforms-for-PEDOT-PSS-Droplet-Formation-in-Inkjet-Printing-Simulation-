import { WaveformType } from "../data/inkjetData";

interface ControlPanelProps {
  waveform: WaveformType;
  voltage: number;
  cycleTime: number;
  onWaveformChange: (waveform: WaveformType) => void;
  onVoltageChange: (voltage: number) => void;
  onCycleTimeChange: (cycleTime: number) => void;
}

const waveformOptions: WaveformType[] = ["Unipolar", "Sinusoidal", "Bipolar"];

const voltageConfig = {
  Unipolar: { min: 25, max: 45, step: 1, label: "Drive Voltage", unit: "V" },
  Sinusoidal: { min: 30, max: 48, step: 1, label: "Driving Voltage", unit: "V" },
  Bipolar: { min: -33, max: -27, step: 1, label: "Compression Voltage", unit: "V" },
};

const cycleConfig = {
  Unipolar: { min: 3, max: 30, step: 1, label: "Dwell Time", unit: "us" },
  Sinusoidal: { min: 12, max: 24, step: 1, label: "Cycle Time", unit: "us" },
  Bipolar: { min: 15, max: 30, step: 1, label: "Total Waveform Duration", unit: "us" },
};

export default function ControlPanel({
  waveform,
  voltage,
  cycleTime,
  onWaveformChange,
  onVoltageChange,
  onCycleTimeChange,
}: ControlPanelProps) {
  const voltageRange = voltageConfig[waveform];
  const cycleRange = cycleConfig[waveform];

  return (
    <aside className="control-panel" aria-label="Simulator controls">
      <div>
        <h2>Controls</h2>
        <p className="panel-note">Select a waveform and tune the actuation parameters.</p>
      </div>

      <fieldset className="control-group">
        <legend>Waveform Type</legend>
        <div className="segmented-control">
          {waveformOptions.map((option) => (
            <button
              className={option === waveform ? "active" : ""}
              key={option}
              onClick={() => onWaveformChange(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

      <SliderControl
        label={voltageRange.label}
        max={voltageRange.max}
        min={voltageRange.min}
        onChange={onVoltageChange}
        step={voltageRange.step}
        unit={voltageRange.unit}
        value={voltage}
      />

      <SliderControl
        label={cycleRange.label}
        max={cycleRange.max}
        min={cycleRange.min}
        onChange={onCycleTimeChange}
        step={cycleRange.step}
        unit={cycleRange.unit}
        value={cycleTime}
      />

      <div className="context-note">
        {waveform === "Unipolar" && (
          <p>
            Unipolar waveform is used as a baseline. The reported optimized droplet size is around 60 &micro;m.
          </p>
        )}
        {waveform === "Sinusoidal" && (
          <p>33 V at 15 &micro;s is marked as the optimized sinusoidal condition.</p>
        )}
        {waveform === "Bipolar" && (
          <p>
            Expansion voltage is fixed at 33 V. The optimized bipolar waveform uses 15 &micro;s total duration.
          </p>
        )}
      </div>
    </aside>
  );
}

interface SliderControlProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
  onChange: (value: number) => void;
}

function SliderControl({ label, min, max, step, value, unit, onChange }: SliderControlProps) {
  return (
    <label className="slider-control">
      <span className="slider-label">
        <span>{label}</span>
        <strong>
          {value} {unit === "us" ? "\u00b5s" : unit}
        </strong>
      </span>
      <input
        aria-label={label}
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
      <span className="slider-bounds">
        <span>
          {min} {unit === "us" ? "\u00b5s" : unit}
        </span>
        <span>
          {max} {unit === "us" ? "\u00b5s" : unit}
        </span>
      </span>
    </label>
  );
}
