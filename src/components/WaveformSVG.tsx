import { WaveformType } from "../data/inkjetData";

interface WaveformSVGProps {
  waveform: WaveformType;
  voltage: number;
  cycleTime: number;
}

export default function WaveformSVG({ waveform, voltage, cycleTime }: WaveformSVGProps) {
  const title = `${waveform} waveform preview`;

  return (
    <section className="visual-card waveform-card">
      <div className="waveform-heading">
        <div>
          <span className="waveform-kicker">Waveform preview</span>
          <h2>{waveform} actuation</h2>
        </div>
        <div className="waveform-values" aria-label={`${voltage} V and ${cycleTime} microseconds`}>
          <span>{voltage} V</span>
          <span>{cycleTime} {"\u00b5s"}</span>
        </div>
      </div>
      <div className="waveform-plot">
        <svg aria-label={title} className="waveform-svg" role="img" viewBox="0 0 760 220">
          <defs>
            <linearGradient id="waveFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#e8f1ff" />
              <stop offset="100%" stopColor="#f8fbff" />
            </linearGradient>
          </defs>
          <rect className="plot-panel" height="196" rx="8" width="724" x="18" y="12" />
          <line className="plot-grid" x1="42" x2="720" y1="62" y2="62" />
          <line className="plot-grid" x1="42" x2="720" y1="110" y2="110" />
          <line className="plot-grid" x1="42" x2="720" y1="158" y2="158" />
          <line className="axis-line" x1="58" x2="710" y1="110" y2="110" />
          <text className="axis-label" x="58" y="42">
            Pressure
          </text>
          <text className="axis-label" x="672" y="136">
            Time
          </text>
          {waveform === "Unipolar" && <UnipolarWaveform />}
          {waveform === "Sinusoidal" && <SinusoidalWaveform />}
        </svg>
      </div>
    </section>
  );
}

function UnipolarWaveform() {
  return (
    <>
      <rect className="phase-region" height="116" width="142" x="178" y="52" />
      <polyline className="wave-line" points="72,110 132,110 178,52 320,52 368,110 690,110" />
      <line className="phase-line" x1="178" x2="178" y1="48" y2="174" />
      <line className="phase-line" x1="320" x2="320" y1="48" y2="174" />
      <text className="phase-label" x="116" y="188">
        Expansion
      </text>
      <text className="phase-label" x="230" y="188">
        dwell
      </text>
      <text className="phase-label" x="392" y="188">
        recovery
      </text>
    </>
  );
}

function SinusoidalWaveform() {
  return (
    <>
      <rect className="phase-region" height="116" width="116" x="198" y="52" />
      <path
        className="wave-line"
        d="M72 110 C112 52 158 52 198 110 C238 168 276 168 316 110 C356 52 402 52 442 110 C482 168 528 168 568 110 C608 52 650 66 690 110"
      />
      <line className="phase-line" x1="198" x2="198" y1="48" y2="174" />
      <line className="phase-line" x1="316" x2="316" y1="48" y2="174" />
      <text className="phase-label" x="104" y="188">
        Expansion
      </text>
      <text className="phase-label" x="224" y="188">
        compression
      </text>
      <text className="phase-label" x="390" y="188">
        repeated cycle
      </text>
    </>
  );
}
