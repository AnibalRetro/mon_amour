
import { motion } from 'framer-motion';
import React from 'react';
import { Button } from '@/components/ui/Button';
import { ModelCard } from '@/components/ui/ModelCard';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Zap } from 'lucide-react';

export const Home = () => {
  const featuredModels = [
    { id: '1', name: 'Amélie Laurent', city: 'Paris', category: 'High Fashion', image: 'https://picsum.photos/seed/model1/800/1200' },
    { id: '2', name: 'Isabella Rossi', city: 'Milan', category: 'Editorial', image: 'https://picsum.photos/seed/model2/800/1200' },
    { id: '3', name: 'Elena Vance', city: 'New York', category: 'Commercial', image: 'https://picsum.photos/seed/model3/800/1200' },
  ];

  return (
    <div className="overflow-hidden">
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-brand-black">
        <motion.div
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.4 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src="https://picsum.photos/seed/fashion-hero/1920/1080"
            alt="Hero"
            className="w-full h-full object-cover grayscale"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        <div className="relative z-10 text-center space-y-8 px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <span className="text-brand-gold text-xs md:text-sm uppercase tracking-[0.6em] font-medium block mb-4">
              Elegancia editorial
            </span>
            <h1 className="text-5xl md:text-8xl text-brand-ivory font-serif leading-tight">
              Mon Amour
            </h1>
            <p className="text-brand-ivory/60 text-sm md:text-lg font-light tracking-widest mt-6 max-w-2xl mx-auto italic">
              Agencia de modelaje profesional con una propuesta visual elegante, sofisticada y contemporánea.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8"
          >
            <Link to="/catalogo">
              <Button size="lg" className="min-w-[240px]">Explorar Catálogo</Button>
            </Link>
            <Link to="/contacto">
              <Button variant="outline" size="lg" className="min-w-[240px] border-brand-ivory text-brand-ivory hover:bg-brand-ivory hover:text-brand-black">
                Solicitar Booking
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6 md:px-12 bg-brand-ivory">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-6xl leading-tight">
              Presencia, imagen <br />
              <span className="italic text-brand-gold">y booking profesional</span>
            </h2>
            <p className="text-brand-gray leading-relaxed text-lg font-light">
              En Mon Amour conectamos marcas, campañas y producciones con talento cuidadosamente seleccionado.
              Nuestro enfoque combina estética, profesionalismo y atención comercial para convertir cada colaboración en una experiencia impecable.
            </p>
            <Link to="/nosotros" className="inline-flex items-center space-x-4 group text-brand-black font-medium tracking-widest text-sm uppercase">
              <span>Conoce nuestra historia</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-2" />
            </Link>
          </motion.div>
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="aspect-[4/5] bg-brand-black overflow-hidden"
            >
              <img
                src="https://picsum.photos/seed/fashion-intro/1000/1250"
                alt="Intro"
                className="w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-brand-gold/10 backdrop-blur-xl border border-brand-gold/20 hidden md:block" />
          </div>
        </div>
      </section>

      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex justify-between items-end">
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-[0.4em] text-brand-gold font-medium">Talento Destacado</span>
              <h2 className="text-4xl md:text-5xl">Perfiles destacados</h2>
            </div>
            <Link to="/catalogo" className="hidden md:block text-xs uppercase tracking-widest border-b border-brand-black pb-1 hover:text-brand-gold hover:border-brand-gold transition-colors">
              Ver catálogo completo
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {featuredModels.map((model, i) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
              >
                <ModelCard
                  image={model.image}
                  title={model.name}
                  subtitle={model.city}
                  category={model.category}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 md:px-12 bg-brand-black text-brand-ivory">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-6 text-center md:text-left">
            <div className="w-16 h-16 bg-brand-gold/20 flex items-center justify-center mx-auto md:mx-0">
              <Star className="w-8 h-8 text-brand-gold" />
            </div>
            <h3 className="text-2xl font-serif">Selección curada</h3>
            <p className="text-brand-gray text-sm font-light leading-relaxed">
              Perfiles listos para campañas, editoriales, activaciones y proyectos donde la imagen lo es todo.
            </p>
          </div>
          <div className="space-y-6 text-center md:text-left">
            <div className="w-16 h-16 bg-brand-gold/20 flex items-center justify-center mx-auto md:mx-0">
              <Shield className="w-8 h-8 text-brand-gold" />
            </div>
            <h3 className="text-2xl font-serif">Operación profesional</h3>
            <p className="text-brand-gray text-sm font-light leading-relaxed">
              Booking, seguimiento, disponibilidad y comunicación clara para clientes, marcas y nuevos talentos.
            </p>
          </div>
          <div className="space-y-6 text-center md:text-left">
            <div className="w-16 h-16 bg-brand-gold/20 flex items-center justify-center mx-auto md:mx-0">
              <Zap className="w-8 h-8 text-brand-gold" />
            </div>
            <h3 className="text-2xl font-serif">Respuesta ágil</h3>
            <p className="text-brand-gray text-sm font-light leading-relaxed">
              Un flujo diseñado para revisar disponibilidad, registrar reservas y mantener contacto comercial ordenado.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
