import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import React from 'react';
import { Button } from '@/components/ui/Button';
import { ModelCard } from '@/components/ui/ModelCard';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Zap } from 'lucide-react';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { mergeById, readLocalCollection } from '@/lib/localData';

interface HomeModel {
  id: string;
  name: string;
  city: string;
  category: string;
  cover?: string;
  image?: string;
  featured?: boolean;
  archived?: boolean;
  displayOrder?: number;
}

const sampleModels: HomeModel[] = [
  { id: 'sample-1', name: 'Amélie Laurent', city: 'Paris', category: 'High Fashion', image: 'https://picsum.photos/seed/model1/800/1200', featured: true, displayOrder: 1 },
  { id: 'sample-2', name: 'Isabella Rossi', city: 'Milan', category: 'Editorial', image: 'https://picsum.photos/seed/model2/800/1200', featured: true, displayOrder: 2 },
  { id: 'sample-3', name: 'Elena Vance', city: 'New York', category: 'Commercial', image: 'https://picsum.photos/seed/model3/800/1200', featured: true, displayOrder: 3 },
];

const sortModels = (items: HomeModel[]) =>
  [...items].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));

export const Home = () => {
  const [models, setModels] = useState<HomeModel[]>(sampleModels);

  useEffect(() => {
    const fetchModels = async () => {
      const localModels = readLocalCollection<HomeModel>('models');
      try {
        const snapshot = await getDocs(collection(db, 'models'));
        const remoteModels = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as HomeModel));
        const merged = sortModels(mergeById(remoteModels, localModels));
        setModels(merged.length ? merged : sampleModels);
      } catch (error) {
        console.error('Error fetching home models:', error);
        const merged = sortModels(mergeById([], localModels));
        setModels(merged.length ? merged : sampleModels);
      }
    };

    fetchModels();
  }, []);

  const featuredModels = useMemo(() => {
    const visible = models.filter((item) => !item.archived);
    const featured = visible.filter((item) => item.featured);
    const source = featured.length ? featured : visible;
    return sortModels(source).slice(0, 3).map((item) => ({
      ...item,
      image: item.cover || item.image || 'https://picsum.photos/seed/fallback/800/1200',
    }));
  }, [models]);

  return (
    <div className="overflow-hidden">
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-brand-black">
        <motion.div
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.42 }}
          transition={{ duration: 2, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <img
            src="https://picsum.photos/seed/fashion-hero/1920/1080"
            alt="Hero"
            className="w-full h-full object-cover grayscale"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(190,92,120,0.18),transparent_55%),linear-gradient(180deg,rgba(10,7,11,0.35),rgba(10,7,11,0.75))]" />
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
            <h1 className="text-5xl md:text-8xl text-brand-ivory font-serif leading-tight drop-shadow-[0_10px_35px_rgba(0,0,0,0.65)]">
              Mon Amour
            </h1>
            <p className="text-brand-ivory/80 text-sm md:text-lg font-light tracking-widest mt-6 max-w-2xl mx-auto italic">
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
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
              >
                <ModelCard image={model.image!} title={model.name} subtitle={model.city} category={model.category} />
              </motion.div>
            ))}
          </div>
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
