
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-brand-black text-brand-ivory pt-20 pb-10 px-6 md:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-brand-ivory/10 pb-16">
        <div className="space-y-6">
          <Link to="/" className="flex flex-col group">
            <span className="text-2xl font-serif tracking-[0.2em] uppercase">Mon Amour</span>
            <span className="text-[8px] uppercase tracking-[0.5em] text-brand-gray">Modeling Agency</span>
          </Link>
          <p className="text-sm text-brand-gray font-light leading-relaxed max-w-xs">
            Representando talento, presencia e imagen con una propuesta elegante, comercial y profesional.
          </p>
          <div className="flex space-x-4">
            <Instagram className="w-5 h-5 cursor-pointer hover:text-brand-gold transition-colors" />
            <Facebook className="w-5 h-5 cursor-pointer hover:text-brand-gold transition-colors" />
            <Twitter className="w-5 h-5 cursor-pointer hover:text-brand-gold transition-colors" />
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs uppercase tracking-[0.3em] font-medium text-brand-gold">Navegación</h4>
          <ul className="space-y-4 text-sm font-light text-brand-gray">
            <li><Link to="/" className="hover:text-brand-ivory transition-colors">Inicio</Link></li>
            <li><Link to="/nosotros" className="hover:text-brand-ivory transition-colors">Nosotros</Link></li>
            <li><Link to="/catalogo" className="hover:text-brand-ivory transition-colors">Catálogo</Link></li>
            <li><Link to="/contacto" className="hover:text-brand-ivory transition-colors">Contacto</Link></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs uppercase tracking-[0.3em] font-medium text-brand-gold">Servicios</h4>
          <ul className="space-y-4 text-sm font-light text-brand-gray">
            <li>Campañas de Moda</li>
            <li>Eventos de Marca</li>
            <li>Branding Corporativo</li>
            <li>Editorial y Pasarela</li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs uppercase tracking-[0.3em] font-medium text-brand-gold">Contacto</h4>
          <ul className="space-y-4 text-sm font-light text-brand-gray">
            <li className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-brand-gold" />
              <span>contacto@monamour.com</span>
            </li>
            <li className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-brand-gold" />
              <span>+52 55 0000 0000</span>
            </li>
            <li className="flex items-center space-x-3">
              <MapPin className="w-4 h-4 text-brand-gold" />
              <span>Ciudad de México</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 flex flex-col md:row justify-between items-center text-[10px] uppercase tracking-widest text-brand-gray space-y-4 md:space-y-0">
        <p>© 2026 Mon Amour. Todos los derechos reservados.</p>
        <div className="flex space-x-8">
          <span className="cursor-pointer hover:text-brand-ivory transition-colors">Aviso de Privacidad</span>
          <span className="cursor-pointer hover:text-brand-ivory transition-colors">Términos y Condiciones</span>
        </div>
      </div>
    </footer>
  );
};
