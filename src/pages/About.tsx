
import { motion } from 'framer-motion';
import React from 'react';

export const About = () => {
  return (
    <div className="pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto space-y-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <span className="text-xs uppercase tracking-[0.4em] text-brand-gold font-medium">Nuestra Esencia</span>
            <h1 className="text-5xl md:text-7xl leading-tight">Mon Amour</h1>
            <p className="text-brand-gray text-lg font-light leading-relaxed">
              Mon Amour nace como una agencia de modelaje con enfoque premium, orientada a conectar talento, imagen y oportunidades comerciales con una estética refinada y una operación profesional.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="aspect-square bg-brand-black overflow-hidden"
          >
            <img
              src="https://picsum.photos/seed/about-main/1000/1000"
              alt="About"
              className="w-full h-full object-cover opacity-80 grayscale"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="p-12 bg-white premium-shadow space-y-6">
            <h3 className="text-2xl font-serif text-brand-gold">Misión</h3>
            <p className="text-sm text-brand-gray font-light leading-relaxed">
              Representar talento con alto potencial y facilitar procesos de booking, contacto y seguimiento bajo un estándar visual y operativo elegante.
            </p>
          </div>
          <div className="p-12 bg-brand-black text-brand-ivory space-y-6">
            <h3 className="text-2xl font-serif text-brand-gold">Visión</h3>
            <p className="text-sm text-brand-gray font-light leading-relaxed">
              Convertirnos en una referencia de agencia boutique para campañas, editoriales, eventos y colaboraciones de imagen.
            </p>
          </div>
          <div className="p-12 bg-white premium-shadow space-y-6">
            <h3 className="text-2xl font-serif text-brand-gold">Valores</h3>
            <ul className="text-sm text-brand-gray font-light space-y-2">
              <li>• Profesionalismo</li>
              <li>• Imagen cuidada</li>
              <li>• Seguimiento comercial</li>
              <li>• Calidad en cada contacto</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
