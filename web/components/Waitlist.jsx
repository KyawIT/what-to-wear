'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WAITLIST_MAILTO } from '@/constants/waitlistMail';

gsap.registerPlugin(ScrollTrigger);

export default function Waitlist() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('[data-waitlist-anim]', {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 75%',
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="waitlist"
      ref={sectionRef}
      className="relative py-40 px-6 sm:px-12"
    >
      <div className="max-w-3xl mx-auto text-center">
        <span
          data-waitlist-anim
          className="inline-block px-4 py-1.5 text-xs font-data font-medium tracking-[0.3em] uppercase text-clay mb-8"
        >
          Ready to Start
        </span>

        <h2
          data-waitlist-anim
          className="text-4xl sm:text-6xl lg:text-7xl font-heading font-bold text-charcoal tracking-tight mb-6 leading-[1.1]"
        >
          Your wardrobe,{' '}
          <span className="font-drama italic text-clay">reimagined.</span>
        </h2>

        <p
          data-waitlist-anim
          className="text-lg text-charcoal/50 mb-12 max-w-md mx-auto leading-relaxed"
        >
          Be first in line when we launch. Join thousands of early adopters
          rethinking how they dress.
        </p>

        <div data-waitlist-anim>
          <a
            href={WAITLIST_MAILTO}
            className="magnetic-btn inline-flex items-center px-12 py-5 bg-clay text-cream text-lg font-semibold rounded-4xl transition-all duration-300 hover:shadow-2xl hover:shadow-clay/30"
          >
            <span className="btn-bg bg-moss" />
            <span className="relative z-10">Join the Waitlist</span>
          </a>
        </div>
      </div>
    </section>
  );
}
