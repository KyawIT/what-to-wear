const columns = [
  {
    title: 'Product',
    links: ['Features', 'How It Works', 'Pricing', 'Changelog'],
  },
  {
    title: 'Company',
    links: ['About', 'Blog', 'Careers', 'Press'],
  },
  {
    title: 'Connect',
    links: ['Twitter', 'Instagram', 'GitHub', 'Discord'],
  },
];

export default function Footer() {
  return (
    <footer role="contentinfo" className="bg-charcoal mt-[-2rem] relative z-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 pt-20 pb-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-heading font-bold text-cream mb-4">
              WTW
            </h3>
            <p className="text-sm text-cream/40 leading-relaxed max-w-xs">
              AI-powered wardrobe management. Built for people who care about
              what they already own.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-data font-medium tracking-widest uppercase text-cream/30 mb-5">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-cream/50 hover:text-cream transition-colors duration-300"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-cream/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-cream/30 font-data">
            &copy; {new Date().getFullYear()} What to Wear. All rights
            reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 pulse-dot" />
            <span className="text-xs text-cream/40 font-data tracking-wider">
              System Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
