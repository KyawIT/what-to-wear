'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Github } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const developers = [
  {
    name: 'Kyaw Htet Htun',
    role: 'Full-Stack Mobile Engineer & Infrastructure Architect',
    initials: 'KH',
    github: 'https://github.com/KyawIT',
  },
  {
    name: 'Tobias Kletsch',
    role: 'Machine Learning Engineer – Data & Model Systems',
    initials: 'TK',
    github: 'https://github.com/KletschTobias',
  },
];

export default function Team() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-team-header]', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '[data-team-header]',
          start: 'top 85%',
        },
      });

      gsap.from('[data-dev-card]', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.18,
        scrollTrigger: {
          trigger: '[data-dev-grid]',
          start: 'top 80%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="team"
      ref={sectionRef}
      className="relative py-32 px-6 sm:px-12 bg-charcoal overflow-hidden"
    >
      {/* Subtle gradient backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 80% 50% at 50% 50%, #CC5833 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Section label + heading */}
        <div data-team-header className="text-center mb-20">
          <span className="inline-block text-xs font-mono uppercase tracking-widest text-clay mb-6 opacity-80">
            The Team
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-drama italic text-cream leading-tight">
            Built by two,
            <br />
            <span className="text-clay">crafted for many.</span>
          </h2>
        </div>

        {/* Developer cards — horizontal layout */}
        <div
          data-dev-grid
          className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-10"
        >
          {developers.map((dev) => (
            <div
              key={dev.name}
              data-dev-card
              className="group relative rounded-2xl border border-cream/10 bg-cream/[0.03] backdrop-blur-sm p-8 lg:p-10 flex flex-col gap-6 overflow-hidden transition-colors duration-500 hover:border-clay/30 hover:bg-cream/[0.06]"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(204,88,51,0.08) 0%, transparent 70%)',
                  }}
                />
              </div>

              <div className="relative z-10 flex items-center gap-5">
                {/* Avatar initials */}
                <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-clay/20 border border-clay/30 flex items-center justify-center">
                  <span className="text-clay font-mono font-semibold text-sm tracking-widest">
                    {dev.initials}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-cream font-semibold text-lg sm:text-xl leading-snug">
                    {dev.name}
                  </h3>
                  <p className="text-cream/40 text-sm font-light mt-1 leading-snug">
                    {dev.role}
                  </p>
                </div>
              </div>

              {/* Decorative rule */}
              <div className="relative z-10 h-px w-full bg-gradient-to-r from-transparent via-clay/30 to-transparent" />

              {/* GitHub link */}
              <div className="relative z-10">
                <a
                  href={dev.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-cream/40 hover:text-cream text-sm transition-colors duration-300 group/gh"
                >
                  <Github
                    size={16}
                    className="transition-transform duration-300 group-hover/gh:scale-110"
                  />
                  <span className="font-mono text-xs tracking-wide">
                    {dev.github.replace('https://github.com/', '@')}
                  </span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
