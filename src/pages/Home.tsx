import { motion } from 'framer-motion';
import React from 'react';
import { Button } from '@/components/ui/Button';
import { ModelCard } from '@/components/ui/ModelCard';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Home = () => {
  const featuredModels = [
    { id: '1', name: 'Amélie Laurent', city: 'Paris', category: 'High Fashion', image: 'https://picsum.photos/seed/model1/800/1200' },
    { id: '2', name: 'Isabella Rossi', city: 'Milan', category: 'Editorial', image: 'https://picsum.photos/seed/model2/800/1200' },
    { id: '3', name: 'Elena Vance', city: 'New York', category: 'Commercial', image: 'https://picsum.photos/seed/model3/800/1200' },
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
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
              L'art de la silhouette
            </span>
            <h1 className="text-5xl md:text-8xl text-brand-ivory font-serif leading-tight">
              Maison de Grâce
            </h1>
            <p className="text-brand-ivory/60 text-sm md:text-lg font-light tracking-widest mt-6 max-w-2xl mx-auto italic">
              Elevando el estándar del modelaje profesional con elegancia y exclusividad.
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

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-brand-ivory/30 flex flex-col items-center"
        >
          <span className="text-[8px] uppercase tracking-[0.4em] mb-2">Scroll</span>
          <div className="w-[1px] h-12 bg-brand-ivory/20" />
        </motion.div>
      </section>

      {/* Intro Section */}
      <section className="py-24 px-6 md:px-12 bg-brand-ivory">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-6xl leading-tight">
              Redefiniendo la <br />
              <span className="italic text-brand-gold">Excelencia Visual</span>
            </h2>
            <p className="text-brand-gray leading-relaxed text-lg font-light">
              En Maison de Grâce, no solo representamos talento; curamos una visión de lujo y profesionalismo. 
              Nuestra agencia se especializa en conectar marcas de alto nivel con perfiles que encarnan 
              la sofisticación y la versatilidad necesaria para el mercado global actual.
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

      {/* Featured Models */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex justify-between items-end">
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-[0.4em] text-brand-gold font-medium">Talento Destacado</span>
              <h2 className="text-4xl md:text-5xl">Nuestras Musas</h2>
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

      {/* Benefits */}
      <section className="py-24 px-6 md:px-12 bg-brand-black text-brand-ivory">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-6 text-center md:text-left">
            <div className="w-16 h-16 bg-brand-gold/20 flex items-center justify-center mx-auto md:mx-0">
              <Star className="w-8 h-8 text-brand-gold" />
            </div>
            <h3 className="text-2xl font-serif">Curaduría Exclusiva</h3>
            <p className="text-brand-gray text-sm font-light leading-relaxed">
              Seleccionamos meticulosamente cada perfil para asegurar que representen los valores de lujo y elegancia de nuestra agencia.
            </p>
          </div>
          <div className="space-y-6 text-center md:text-left">
            <div className="w-16 h-16 bg-brand-gold/20 flex items-center justify-center mx-auto md:mx-0">
              <Shield className="w-8 h-8 text-brand-gold" />
            </div>
            <h3 className="text-2xl font-serif">Profesionalismo Total</h3>
            <p className="text-brand-gray text-sm font-light leading-relaxed">
              Garantizamos puntualidad, compromiso y una ejecución impecable en cada proyecto comercial o editorial.
            </p>
          </div>
          <div className="space-y-6 text-center md:text-left">
            <div className="w-16 h-16 bg-brand-gold/20 flex items-center justify-center mx-auto md:mx-0">
              <Zap className="w-8 h-8 text-brand-gold" />
            </div>
            <h3 className="text-2xl font-serif">Gestión Ágil</h3>
            <p className="text-brand-gray text-sm font-light leading-relaxed">
              Nuestro sistema de booking permite una comunicación directa y eficiente para asegurar el talento ideal en tiempo récord.
            </p>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24 px-6 md:px-12 bg-brand-ivory">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <span className="text-xs uppercase tracking-[0.4em] text-brand-gold font-medium">Metodología</span>
            <h2 className="text-4xl md:text-5xl">Proceso de Contratación</h2>
          </div>

          <div className="space-y-12">
            {[
              { step: '01', title: 'Selección', desc: 'Explora nuestro catálogo exclusivo y selecciona los perfiles que mejor se alineen con tu marca.' },
              { step: '02', title: 'Solicitud', desc: 'Completa el formulario de booking detallando las necesidades de tu proyecto y fechas tentativas.' },
              { step: '03', title: 'Confirmación', desc: 'Nuestro equipo revisará la disponibilidad y coordinará los detalles logísticos en menos de 24 horas.' },
              { step: '04', title: 'Ejecución', desc: 'Talento profesional en set, listo para elevar la imagen de tu campaña al siguiente nivel.' },
            ].map((item, i) => (
              <motion.div 
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start space-x-8 border-b border-brand-black/5 pb-8"
              >
                <span className="text-4xl font-serif text-brand-gold/40">{item.step}</span>
                <div className="space-y-2">
                  <h4 className="text-xl font-medium tracking-tight">{item.title}</h4>
                  <p className="text-brand-gray font-light text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-24 bg-brand-ivory border-y border-brand-black/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <p className="text-[10px] uppercase tracking-[0.5em] text-brand-gray text-center mb-12">Nuestros Colaboradores</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale">
            {['VOGUE', 'CHANEL', 'GUCCI', 'PRADA', 'DIOR'].map(brand => (
              <span key={brand} className="text-2xl md:text-3xl font-serif tracking-widest">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 md:px-12 bg-brand-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img src="https://picsum.photos/seed/cta-bg/1920/1080" alt="CTA" className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-10">
          <h2 className="text-4xl md:text-7xl text-brand-ivory font-serif leading-tight">
            ¿Listo para elevar <br /> tu <span className="italic text-brand-gold">Próxima Campaña</span>?
          </h2>
          <p className="text-brand-ivory/60 text-lg font-light tracking-widest max-w-2xl mx-auto">
            Únete a las marcas más exclusivas que confían en nuestro talento para definir su identidad visual.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <Link to="/contacto">
              <Button size="lg" className="min-w-[240px]">Solicitar Booking</Button>
            </Link>
            <Link to="/catalogo">
              <Button variant="outline" size="lg" className="min-w-[240px] border-brand-ivory text-brand-ivory hover:bg-brand-ivory hover:text-brand-black">
                Ver Catálogo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
