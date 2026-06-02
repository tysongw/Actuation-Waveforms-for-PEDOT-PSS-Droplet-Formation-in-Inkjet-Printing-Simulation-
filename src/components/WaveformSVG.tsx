import { WaveformType } from "../data/inkjetData";

interface WaveformSVGProps {
  waveform: WaveformType;
  voltage: number;
  cycleTime: number;
}

export default function WaveformSVG({ waveform, voltage, cycleTime }: WaveformSVGProps) {
  const title = `${waveform} actuation waveform`;

  return (
    <section className="visual-card waveform-card">
      <div className="section-heading">
        <h2>{title}</h2>
        <span>{`${voltage} V / ${cycleTime} \u00b5s`}</span>
      </div>
      <svg aria-label={title} className="waveform-svg" role="img" viewBox="0 0 760 250">
        <line className="axis-line" x1="42" x2="720" y1="130" y2="130" />
        <line className="axis-line" x1="42" x2="42" y1="30" y2="215" />
        <text className="axis-label" x="52" y="42">
          Pressure
        </text>
        <text className="axis-label" x="666" y="154">
          Time
        </text>
        {waveform === "Unipolar" && <UnipolarWaveform />}
        {waveform === "Sinusoidal" && <SinusoidalWaveform />}
      </svg>
    </section>
  );
}

function UnipolarWaveform() {
  return (
    <>
      <polyline className="wave-line" points="72,130 130,130 170,62 340,62 386,130 690,130" />
      <line className="phase-line" x1="170" x2="170" y1="62" y2="198" />
      <line className="phase-line" x1="340" x2="340" y1="62" y2="198" />
      <text className="phase-label" x="112" y="208">
        Expansion
      </text>
      <text className="phase-label" x="232" y="208">
        dwell
      </text>
      <text className="phase-label" x="382" y="208">
        recovery
      </text>
    </>
  );
}

function SinusoidalWaveform() {
  return (
    <>
      <path
        className="wave-line"
        d="M72 130 C112 62 158 62 198 130 C238 198 284 198 324 130 C364 62 410 62 450 130 C490 198 536 198 576 130 C616 62 650 76 690 130"
      />
      <line className="phase-line" x1="198" x2="198" y1="48" y2="206" />
      <line className="phase-line" x1="324" x2="324" y1="48" y2="206" />
      <text className="phase-label" x="98" y="208">
        Expansion
      </text>
      <text className="phase-label" x="224" y="208">
        compression
      </text>
      <text className="phase-label" x="386" y="208">
        repeated cycle
      </text>
    </>
  );
}
