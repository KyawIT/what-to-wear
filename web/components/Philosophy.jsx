'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const neutralText = 'Most wardrobe apps focus on endless shopping recommendations.';
const heroLine = 'We focus on what you already own.';

export default function Philosophy() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Reveal neutral text words
      gsap.from('[data-neutral-word]', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: '[data-neutral-line]',
          start: 'top 80%',
        },
      });

      // Reveal hero text words
      gsap.from('[data-hero-word]', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: {
          trigger: '[data-hero-line]',
          start: 'top 80%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="philosophy"
      ref={sectionRef}
      className="relative py-40 px-6 sm:px-12 bg-charcoal overflow-hidden"
    >
      {/* Parallax moss texture */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=1920&q=60)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Neutral line */}
        <p
          data-neutral-line
          className="text-lg sm:text-xl text-cream/30 font-light mb-12 leading-relaxed"
        >
          {neutralText.split(' ').map((word, i) => (
            <span key={i} data-neutral-word className="inline-block mr-2">
              {word}
            </span>
          ))}
        </p>

        {/* Hero statement */}
        <h2 data-hero-line className="text-4xl sm:text-6xl lg:text-7xl font-drama italic text-cream leading-[1.15]">
          {heroLine.split(' ').map((word, i) => (
            <span
              key={i}
              data-hero-word
              className={`inline-block mr-3 ${
                word === 'already' ? 'text-clay' : ''
              }`}
            >
              {word}
            </span>
          ))}
        </h2>
      </div>
    </section>
  );
}
