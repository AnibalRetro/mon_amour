import { motion } from 'framer-motion';
import React from 'react';

export const About = () => {
  return (
    <div className="pt-32 pb-24 px-6 md:px-12">
      <div className="max-w-7xl mx-auto space-y-24">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <span className="text-xs uppercase tracking-[0.4em] text-brand-gold font-medium">Nuestra Esencia</span>
            <h1 className="text-5xl md:text-7xl leading-tight">Maison de Grâce</h1>
            <p className="text-brand-gray text-lg font-light leading-relaxed">
              Fundada en el corazón de la elegancia, Maison de Grâce nació con la misión de redefinir 
              el modelaje profesional. No somos solo una agencia; somos un santuario para el talento 
              excepcional y un socio estratégico para las marcas que buscan trascender lo ordinario.
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

        {/* Mission/Vision */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="p-12 bg-white premium-shadow space-y-6">
            <h3 className="text-2xl font-serif text-brand-gold">Misión</h3>
            <p className="text-sm text-brand-gray font-light leading-relaxed">
              Descubrir y potenciar talento único, proporcionando una plataforma de excelencia 
              que conecte la belleza sofisticada con las demandas creativas de la industria global del lujo.
            </p>
          </div>
          <div className="p-12 bg-brand-black text-brand-ivory space-y-6">
            <h3 className="text-2xl font-serif text-brand-gold">Visión</h3>
            <p className="text-sm text-brand-gray font-light leading-relaxed">
              Consolidarnos como la agencia de referencia internacional en modelaje premium, 
              siendo reconocidos por nuestra integridad, curaduría impecable y visión artística.
            </p>
          </div>
          <div className="p-12 bg-white premium-shadow space-y-6">
            <h3 className="text-2xl font-serif text-brand-gold">Valores</h3>
            <ul className="text-sm text-brand-gray font-light space-y-2">
              <li>• Elegancia Atemporal</li>
              <li>• Profesionalismo Riguroso</li>
              <li>• Diversidad Sofisticada</li>
              <li>• Compromiso con la Calidad</li>
            </ul>
          </div>
        </div>

        {/* Philosophy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div className="order-2 md:order-1">
            <img 
              src="https://picsum.photos/seed/philosophy/1000/1200" 
              alt="Philosophy" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="space-y-8 order-1 md:order-2">
            <h2 className="text-4xl md:text-5xl">Filosofía de Selección</h2>
            <p className="text-brand-gray font-light leading-relaxed">
              Nuestra selección de talento no se basa únicamente en la estética superficial. 
              Buscamos "Grâce" — esa mezcla intangible de presencia, inteligencia y versatilidad. 
              Cada modelo en nuestro catálogo ha pasado por un proceso de curaduría exhaustivo 
              para asegurar que no solo luzcan bien, sino que aporten valor real a cada producción.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-brand-gold rounded-full" />
                <span className="text-sm uppercase tracking-widest font-medium">Puntualidad y Disciplina</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-brand-gold rounded-full" />
                <span className="text-sm uppercase tracking-widest font-medium">Imagen y Cuidado Personal</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-brand-gold rounded-full" />
                <span className="text-sm uppercase tracking-widest font-medium">Adaptabilidad Creativa</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
