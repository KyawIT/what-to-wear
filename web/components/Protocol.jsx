'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ── SVG Animations ── */
function CaptureAnimation() {
  return (
    <svg viewBox="0 0 200 200" className="w-32 h-32 mx-auto">
      {[60, 45, 30].map((r, i) => (
        <circle
          key={i}
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke="#CC5833"
          strokeWidth="1"
          opacity={0.3 + i * 0.2}
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from={`0 100 100`}
            to={`${i % 2 === 0 ? 360 : -360} 100 100`}
            dur={`${4 + i * 2}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
      <circle cx="100" cy="100" r="8" fill="#CC5833" opacity="0.6" />
    </svg>
  );
}

function OrganizeAnimation() {
  return (
    <div className="relative w-32 h-32 mx-auto overflow-hidden">
      {/* Dot grid */}
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {Array.from({ length: 64 }).map((_, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;
          return (
            <circle
              key={i}
              cx={20 + col * 24}
              cy={20 + row * 24}
              r="2"
              fill="#2E4036"
              opacity="0.2"
            />
          );
        })}
        {/* Scanning line */}
        <rect x="0" y="0" width="4" height="200" fill="#CC5833" opacity="0.6">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="-10 0; 210 0; -10 0"
            dur="3s"
            repeatCount="indefinite"
          />
        </rect>
      </svg>
    </div>
  );
}

function ComposeAnimation() {
  return (
    <svg viewBox="0 0 200 80" className="w-48 h-20 mx-auto">
      <polyline
        points="0,40 30,40 40,15 50,60 60,30 70,50 80,35 90,40 120,40 130,10 140,65 150,25 160,45 170,40 200,40"
        fill="none"
        stroke="#CC5833"
        strokeWidth="2"
        strokeDasharray="600"
        strokeDashoffset="0"
        style={{ animation: 'ekg-dash 3s linear infinite' }}
      />
      <polyline
        points="0,40 30,40 40,15 50,60 60,30 70,50 80,35 90,40 120,40 130,10 140,65 150,25 160,45 170,40 200,40"
        fill="none"
        stroke="#CC5833"
        strokeWidth="2"
        opacity="0.2"
      />
    </svg>
  );
}

const steps = [
  {
    step: '01',
    title: 'Capture',
    desc: 'Photograph your garments. Our AI instantly removes backgrounds and isolates every piece with surgical precision.',
    Animation: CaptureAnimation,
    bg: 'bg-cream',
  },
  {
    step: '02',
    title: 'Organize',
    desc: 'Automatic categorization, tagging, and a searchable inventory of your entire wardrobe — no manual sorting.',
    Animation: OrganizeAnimation,
    bg: 'bg-white',
  },
  {
    step: '03',
    title: 'Compose',
    desc: 'Mix and match items. Get AI-suggested outfits or build your own — then schedule them for the week ahead.',
    Animation: ComposeAnimation,
    bg: 'bg-cream',
  },
];

export default function Protocol() {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, i) => {
        if (!card || i === cardsRef.current.length - 1) return;

        ScrollTrigger.create({
          trigger: card,
          start: 'top top',
          endTrigger: cardsRef.current[i + 1],
          end: 'top top',
          pin: false,
          onUpdate: (self) => {
            const progress = self.progress;
            gsap.set(card, {
              scale: 1 - progress * 0.1,
              filter: `blur(${progress * 20}px)`,
              opacity: 1 - progress * 0.5,
            });
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="protocol" ref={sectionRef} className="relative py-32 px-6 sm:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 text-xs font-data font-medium tracking-widest uppercase text-moss/60 border border-moss/20 rounded-full mb-6">
            Protocol
          </span>
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-charcoal tracking-tight">
            How it works
          </h2>
        </div>

        <div className="space-y-8">
          {steps.map(({ step, title, desc, Animation, bg }, i) => (
            <div
              key={step}
              ref={(el) => (cardsRef.current[i] = el)}
              className={`${bg} sticky top-0 min-h-[80vh] rounded-5xl p-10 sm:p-16 flex flex-col justify-center border border-charcoal/5 stack-card`}
            >
              <div className="max-w-2xl mx-auto text-center">
                <span className="font-data text-sm text-clay tracking-widest mb-6 block">
                  {step}
                </span>
                <div className="mb-8">
                  <Animation />
                </div>
                <h3 className="text-3xl sm:text-4xl font-heading font-bold text-charcoal mb-4">
                  {title}
                </h3>
                <p className="text-lg text-charcoal/50 leading-relaxed max-w-lg mx-auto">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
