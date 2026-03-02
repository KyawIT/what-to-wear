'use client';

import { useEffect, useRef, useState } from 'react';

const screens = [
  '/app-screens/what-to-wear-login-screen.png',
  '/app-screens/view-clothing-items-screen.png',
  '/app-screens/upload-image-screen.png',
  '/app-screens/outfit-suggestion-screen.png',
];

export default function IPhoneMockup({ className = '', enable3D = false }) {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);
  const frameRef = useRef(null);

  // Carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % screens.length);
        setFade(true);
      }, 300);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Scroll-synced tilt for 3D mode
  useEffect(() => {
    if (!enable3D || typeof window === 'undefined') return;

    let rafId;
    const handleScroll = () => {
      rafId = requestAnimationFrame(() => {
        if (!frameRef.current) return;
        const rect = frameRef.current.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const viewCenter = window.innerHeight / 2;
        const offset = (center - viewCenter) / window.innerHeight;
        const rotateX = 4 + offset * 8;
        frameRef.current.style.transform = `perspective(1200px) rotateY(-12deg) rotateX(${rotateX}deg)`;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [enable3D]);

  return (
    <div className={className}>
      <div
        ref={frameRef}
        className={`iphone-frame w-[280px] sm:w-[300px] mx-auto ${
          enable3D ? 'mockup-3d' : ''
        }`}
      >
        <div className="iphone-screen aspect-[9/19.5] bg-charcoal relative">
          <div className="iphone-dynamic-island" />
          <img
            src={screens[current]}
            alt="App screen"
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              fade ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
