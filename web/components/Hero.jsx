'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import IPhoneMockup from './IPhoneMockup';
import { WAITLIST_MAILTO } from '@/constants/waitlistMail';

export default function Hero() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-hero-anim]', {
        y: 60,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        stagger: 0.12,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="What to Wear — AI wardrobe management app"
      className="relative min-h-[100dvh] flex items-center overflow-hidden"
    >
      {/* Sentinel for navbar */}
      <div id="hero-sentinel" className="absolute top-0 left-0 w-full h-20" />

      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal/90 via-charcoal/70 to-charcoal/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text */}
          <div>
            <div data-hero-anim className="mb-4">
              <span className="inline-block px-4 py-1.5 text-xs font-data font-medium tracking-widest uppercase text-cream/60 border border-cream/20 rounded-full">
                Wardrobe Intelligence
              </span>
            </div>

            <h1 data-hero-anim className="mb-6">
              <span className="block text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-cream leading-[1.1] tracking-tight">
                Your closet is the
              </span>
              <span className="block text-6xl sm:text-7xl lg:text-8xl font-drama italic text-clay leading-[1] mt-2">
                Algorithm.
              </span>
            </h1>

            <p
              data-hero-anim
              className="text-lg sm:text-xl text-cream/60 max-w-md mb-10 font-light leading-relaxed"
            >
              AI-powered wardrobe management. Capture, organize, and compose
              outfits from what you already own.
            </p>

            <div data-hero-anim className="flex flex-wrap gap-4">
              <a
                href={WAITLIST_MAILTO}
                className="magnetic-btn inline-flex items-center px-8 py-4 bg-clay text-cream font-semibold rounded-4xl text-sm tracking-wide transition-all duration-300 hover:shadow-xl hover:shadow-clay/30"
              >
                <span className="btn-bg bg-moss" />
                <span className="relative z-10">Join the Waitlist</span>
              </a>
              <a
                href="#features"
                className="inline-flex items-center px-8 py-4 border border-cream/20 text-cream/80 font-medium rounded-4xl text-sm tracking-wide transition-all duration-300 hover:bg-cream/10 hover:border-cream/40"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Mockup */}
          <div className="hidden lg:flex justify-center">
            <IPhoneMockup enable3D />
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cream to-transparent" />
    </section>
  );
}
