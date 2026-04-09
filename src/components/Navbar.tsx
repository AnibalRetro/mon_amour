import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Instagram, Facebook, Twitter } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Nosotros', path: '/nosotros' },
    { name: 'Catálogo', path: '/catalogo' },
    { name: 'Contacto', path: '/contacto' },
  ];

  const isDarkHero = location.pathname === '/' && !scrolled;

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 w-full z-50 transition-all duration-500 px-6 py-4 md:px-12 md:py-6',
        scrolled ? 'bg-brand-black/65 backdrop-blur-md py-4 border-b border-white/10' : 'bg-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex flex-col items-center group">
          <span className={cn(
            'text-2xl md:text-3xl font-serif tracking-[0.2em] uppercase transition-colors group-hover:text-brand-gold',
            isDarkHero ? 'text-brand-ivory drop-shadow-[0_8px_22px_rgba(0,0,0,0.65)]' : 'text-brand-black',
            scrolled && 'text-brand-ivory',
          )}>
            Mon Amour
          </span>
          <span className={cn(
            'text-[8px] md:text-[10px] uppercase tracking-[0.5em] -mt-1',
            isDarkHero || scrolled ? 'text-brand-ivory/75' : 'text-brand-gray',
          )}>
            Modeling Agency
          </span>
        </Link>

        <div className="hidden md:flex items-center space-x-12">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={cn(
                'text-xs uppercase tracking-[0.2em] font-medium transition-all hover:text-brand-gold relative group',
                location.pathname === link.path
                  ? 'text-brand-gold'
                  : isDarkHero || scrolled
                    ? 'text-brand-ivory'
                    : 'text-brand-black',
              )}
            >
              {link.name}
              <span className={cn(
                'absolute -bottom-1 left-0 w-0 h-[1px] bg-brand-gold transition-all duration-300 group-hover:w-full',
                location.pathname === link.path && 'w-full',
              )} />
            </Link>
          ))}
          <Link
            to="/admin"
            className={cn(
              'text-[10px] px-4 py-2 transition-all border',
              isDarkHero || scrolled
                ? 'border-brand-ivory/35 text-brand-ivory hover:bg-brand-ivory hover:text-brand-black'
                : 'border-brand-black/20 text-brand-black hover:bg-brand-black hover:text-brand-ivory',
            )}
          >
            ADMIN
          </Link>
        </div>

        <button className={cn('md:hidden', isDarkHero || scrolled ? 'text-brand-ivory' : 'text-brand-black')} onClick={() => setIsOpen(true)}>
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-brand-black text-brand-ivory z-[60] flex flex-col p-12"
          >
            <div className="flex justify-end">
              <button onClick={() => setIsOpen(false)}>
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                >
                  <Link to={link.path} onClick={() => setIsOpen(false)} className="text-4xl font-serif hover:text-brand-gold transition-colors">
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="flex space-x-6">
              <Instagram className="w-6 h-6 cursor-pointer hover:text-brand-gold" />
              <Facebook className="w-6 h-6 cursor-pointer hover:text-brand-gold" />
              <Twitter className="w-6 h-6 cursor-pointer hover:text-brand-gold" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
