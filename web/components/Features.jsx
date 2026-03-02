'use client';

import { useEffect, useRef, useState } from 'react';
import { Layers, Terminal, CalendarDays } from 'lucide-react';

/* ── Card 1: Diagnostic Shuffler ── */
function DiagnosticShuffler() {
  const labels = ['Remove Background', 'Detect Edges', 'Isolate Garment'];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % labels.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-48 flex items-center justify-center">
      {labels.map((label, i) => {
        const offset = ((i - active + labels.length) % labels.length);
        return (
          <div
            key={label}
            className="absolute w-52 py-4 px-5 bg-cream border border-charcoal/10 rounded-4xl text-center font-data text-xs tracking-wider transition-all duration-700 ease-out"
            style={{
              transform: `translateY(${offset * 18}px) scale(${1 - offset * 0.06})`,
              opacity: 1 - offset * 0.3,
              zIndex: labels.length - offset,
            }}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
}

/* ── Card 2: Telemetry Typewriter ── */
function TelemetryTypewriter() {
  const lines = [
    '> analyzing wardrobe...',
    '> 47 items detected',
    '> categorizing: SHIRT, PANTS, JACKET',
    '> generating outfit matrix',
    '> compatibility score: 94.2%',
    '> ready.',
  ];
  const [displayed, setDisplayed] = useState([]);
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    if (lineIdx >= lines.length) {
      const timeout = setTimeout(() => {
        setDisplayed([]);
        setLineIdx(0);
        setCharIdx(0);
      }, 3000);
      return () => clearTimeout(timeout);
    }

    const timeout = setTimeout(() => {
      const currentLine = lines[lineIdx];
      if (charIdx < currentLine.length) {
        setDisplayed((prev) => {
          const copy = [...prev];
          copy[lineIdx] = currentLine.slice(0, charIdx + 1);
          return copy;
        });
        setCharIdx((c) => c + 1);
      } else {
        setLineIdx((l) => l + 1);
        setCharIdx(0);
      }
    }, charIdx === 0 ? 400 : 35);

    return () => clearTimeout(timeout);
  }, [lineIdx, charIdx]);

  return (
    <div className="h-48 bg-charcoal rounded-3xl p-5 overflow-hidden relative">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot" />
        <span className="text-[10px] font-data text-green-400 tracking-widest uppercase">
          Live Feed
        </span>
      </div>
      <div className="font-data text-xs text-cream/70 space-y-1">
        {displayed.map((line, i) => (
          <div key={i}>
            {line}
            {i === lineIdx - 0 && i === displayed.length - 1 && (
              <span className="inline-block w-1.5 h-3 bg-clay ml-0.5 -mb-0.5 blink-cursor" />
            )}
          </div>
        ))}
        {displayed.length === 0 && (
          <span className="inline-block w-1.5 h-3 bg-clay blink-cursor" />
        )}
      </div>
    </div>
  );
}

/* ── Card 3: Cursor Protocol Scheduler ── */
function CursorScheduler() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const [activeDay, setActiveDay] = useState(-1);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let step = 0;
    const run = () => {
      if (step === 0) { setActiveDay(3); setSaved(false); }
      if (step === 1) { setSaved(true); }
      if (step === 2) { setActiveDay(-1); setSaved(false); }
      step = (step + 1) % 3;
    };
    run();
    const interval = setInterval(run, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-48 flex flex-col items-center justify-center gap-4">
      <div className="flex gap-2">
        {days.map((day, i) => (
          <div
            key={i}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-data font-medium transition-all duration-500 ${
              i === activeDay
                ? 'bg-clay text-cream scale-110'
                : 'bg-charcoal/5 text-charcoal/40'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      <div
        className={`px-5 py-2 rounded-full text-xs font-medium transition-all duration-500 ${
          saved
            ? 'bg-moss text-cream scale-105'
            : 'bg-charcoal/5 text-charcoal/30'
        }`}
      >
        {saved ? 'Saved' : 'Select Day'}
      </div>
    </div>
  );
}

/* ── Features Section ── */
const cards = [
  {
    icon: Layers,
    title: 'Diagnostic Shuffler',
    desc: 'AI pipeline removes backgrounds, detects edges, and isolates garments in seconds.',
    Component: DiagnosticShuffler,
  },
  {
    icon: Terminal,
    title: 'Telemetry Engine',
    desc: 'Real-time wardrobe analytics. Every item tracked, categorized, and scored.',
    Component: TelemetryTypewriter,
  },
  {
    icon: CalendarDays,
    title: 'Outfit Protocol',
    desc: 'Schedule your outfits weekly. Plan ahead, never repeat unintentionally.',
    Component: CursorScheduler,
  },
];

function FeatureCard({ icon: Icon, title, desc, Component, delay }) {
  const cardRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(60px)',
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      }}
      className="group bg-white rounded-4xl p-8 border border-charcoal/5 hover:border-clay/20 hover:shadow-xl hover:shadow-clay/5"
    >
      <Component />
      <div className="flex items-center gap-3 mt-6 mb-3">
        <div className="w-10 h-10 rounded-2xl bg-moss/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-moss" />
        </div>
        <h3 className="text-lg font-heading font-bold text-charcoal">
          {title}
        </h3>
      </div>
      <p className="text-sm text-charcoal/50 leading-relaxed">{desc}</p>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative py-32 px-6 sm:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 text-xs font-data font-medium tracking-widest uppercase text-moss/60 border border-moss/20 rounded-full mb-6">
            Core Systems
          </span>
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-charcoal tracking-tight">
            Engineered for your wardrobe
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map(({ icon, title, desc, Component }, i) => (
            <FeatureCard
              key={title}
              icon={icon}
              title={title}
              desc={desc}
              Component={Component}
              delay={i * 0.15}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
