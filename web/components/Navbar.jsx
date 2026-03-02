'use client';

import { useEffect, useState } from 'react';
import { WAITLIST_MAILTO } from '@/constants/waitlistMail';

const links = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#protocol' },
  { label: 'App', href: '#philosophy' },
  { label: 'Team', href: '#team' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0.9 }
    );

    const sentinel = document.getElementById('hero-sentinel');
    if (sentinel) observer.observe(sentinel);

    return () => observer.disconnect();
  }, []);

  return (
    <header role="banner">
      <nav
        aria-label="Main navigation"
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-2 rounded-full transition-all duration-500 ${scrolled
            ? 'bg-cream/80 backdrop-blur-xl shadow-lg shadow-charcoal/5'
            : 'bg-white/10 backdrop-blur-sm'
          }`}
      >
        <a
          href="#"
          className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${scrolled ? 'text-charcoal' : 'text-white'
            }`}
        >
          WTW
        </a>

        <div className="hidden sm:flex items-center gap-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`px-4 py-2 text-sm rounded-full transition-colors duration-300 ${scrolled
                  ? 'text-charcoal/60 hover:text-charcoal hover:bg-charcoal/5'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <a
          href={WAITLIST_MAILTO}
          className="ml-2 px-5 py-2 text-sm font-medium text-cream bg-clay rounded-full magnetic-btn transition-all duration-300 hover:shadow-lg hover:shadow-clay/25"
        >
          Join Waitlist
        </a>
      </nav>
    </header>
  );
}
