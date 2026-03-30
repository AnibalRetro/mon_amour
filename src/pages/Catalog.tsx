import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, ChevronRight } from 'lucide-react';
import { ModelCard } from '@/components/ui/ModelCard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface Model {
  id: string;
  name: string;
  city: string;
  category: string;
  cover: string;
  gallery: string[];
  short_desc: string;
  full_desc: string;
  height: string;
  experience: string;
  languages: string;
  availability: boolean;
  tags: string[];
}

import { cn } from '@/lib/utils';

export const Catalog = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  // Sample data for initial render if DB is empty
  const sampleModels: Model[] = [
    { 
      id: '1', name: 'Amélie Laurent', city: 'Paris', category: 'Fashion', cover: 'https://picsum.photos/seed/m1/800/1200',
      gallery: ['https://picsum.photos/seed/m1g1/800/1200', 'https://picsum.photos/seed/m1g2/800/1200'],
      short_desc: 'Elegancia parisina con visión editorial.', full_desc: 'Amélie ha trabajado con las casas más prestigiosas de París...',
      height: '178cm', experience: 'Vogue, Chanel, Dior', languages: 'Francés, Inglés', availability: true, tags: ['Editorial', 'Runway']
    },
    { 
      id: '2', name: 'Isabella Rossi', city: 'Milan', category: 'High Fashion', cover: 'https://picsum.photos/seed/m2/800/1200',
      gallery: ['https://picsum.photos/seed/m2g1/800/1200'],
      short_desc: 'Sofisticación italiana y versatilidad.', full_desc: 'Originaria de Milán, Isabella personifica el lujo moderno...',
      height: '175cm', experience: 'Gucci, Prada', languages: 'Italiano, Inglés', availability: true, tags: ['Fashion', 'Beauty']
    },
    { 
      id: '3', name: 'Elena Vance', city: 'New York', category: 'Commercial', cover: 'https://picsum.photos/seed/m3/800/1200',
      gallery: [],
      short_desc: 'Energía cosmopolita para marcas globales.', full_desc: 'Elena es la cara perfecta para campañas de lifestyle...',
      height: '172cm', experience: 'Nike, Apple', languages: 'Inglés, Español', availability: true, tags: ['Commercial', 'Lifestyle']
    },
    { 
      id: '4', name: 'Sofia Mendez', city: 'Madrid', category: 'Editorial', cover: 'https://picsum.photos/seed/m4/800/1200',
      gallery: [],
      short_desc: 'Belleza clásica con un toque contemporáneo.', full_desc: 'Sofia destaca por su capacidad de contar historias...',
      height: '176cm', experience: 'Zara, Mango', languages: 'Español, Inglés', availability: true, tags: ['Editorial']
    },
    { 
      id: '5', name: 'Yuki Tanaka', city: 'Tokyo', category: 'Avant-Garde', cover: 'https://picsum.photos/seed/m5/800/1200',
      gallery: [],
      short_desc: 'Minimalismo y precisión artística.', full_desc: 'Yuki es conocida por su expresión única en pasarela...',
      height: '177cm', experience: 'Kenzo, Issey Miyake', languages: 'Japonés, Inglés', availability: true, tags: ['Runway', 'Art']
    },
    { 
      id: '6', name: 'Chloe Dubois', city: 'Lyon', category: 'Beauty', cover: 'https://picsum.photos/seed/m6/800/1200',
      gallery: [],
      short_desc: 'La esencia de la belleza natural.', full_desc: 'Chloe se especializa en campañas de cosmética de lujo...',
      height: '170cm', experience: 'L\'Oréal, Lancôme', languages: 'Francés', availability: true, tags: ['Beauty', 'Skincare']
    },
  ];

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'models'));
        const modelsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Model));
        if (modelsData.length > 0) {
          setModels(modelsData);
        } else {
          setModels(sampleModels);
        }
      } catch (error) {
        console.error("Error fetching models:", error);
        setModels(sampleModels);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  useEffect(() => {
    let result = models;
    if (search) {
      result = result.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (category !== 'All') {
      result = result.filter(m => m.category === category);
    }
    setFilteredModels(result);
  }, [search, category, models]);

  const categories = ['All', 'Fashion', 'High Fashion', 'Commercial', 'Editorial', 'Beauty', 'Avant-Garde'];

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 bg-brand-ivory min-h-screen">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <span className="text-xs uppercase tracking-[0.4em] text-brand-gold font-medium">Nuestra Selección</span>
          <h1 className="text-5xl md:text-6xl">Catálogo de Musas</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-brand-black/10 pb-8">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-brand-black/5 px-12 py-3 text-sm focus:outline-none focus:border-brand-gold transition-colors"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "text-[10px] uppercase tracking-widest px-4 py-2 transition-all",
                  category === cat 
                    ? "bg-brand-black text-brand-ivory" 
                    : "bg-white text-brand-black hover:bg-brand-black/5"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredModels.map((model, i) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <ModelCard
                  image={model.cover}
                  title={model.name}
                  subtitle={model.city}
                  category={model.category}
                  onClick={() => setSelectedModel(model)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredModels.length === 0 && (
          <div className="text-center py-24 space-y-4">
            <p className="text-brand-gray font-light italic">No se encontraron modelos con estos criterios.</p>
            <button onClick={() => { setSearch(''); setCategory('All'); }} className="text-brand-gold uppercase text-xs tracking-widest border-b border-brand-gold">Limpiar filtros</button>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <Modal isOpen={!!selectedModel} onClose={() => setSelectedModel(null)}>
        {selectedModel && (
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Left: Images */}
            <div className="h-[500px] md:h-auto bg-brand-black overflow-hidden relative group">
              <img 
                src={selectedModel.cover} 
                alt={selectedModel.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {selectedModel.gallery.length > 0 && (
                <div className="absolute bottom-6 left-6 flex space-x-2">
                  {selectedModel.gallery.map((img, i) => (
                    <div key={i} className="w-12 h-16 border border-white/20 overflow-hidden cursor-pointer hover:border-brand-gold transition-colors">
                      <img src={img} alt="Gallery" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Info */}
            <div className="p-10 md:p-16 space-y-10 overflow-y-auto max-h-[90vh]">
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-[0.4em] text-brand-gold font-medium">{selectedModel.category}</span>
                <h2 className="text-4xl md:text-5xl">{selectedModel.name}</h2>
                <p className="text-brand-gray font-light italic tracking-wide">{selectedModel.city}</p>
              </div>

              <div className="grid grid-cols-2 gap-8 border-y border-brand-black/5 py-8">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-brand-gray">Estatura</span>
                  <p className="font-medium">{selectedModel.height}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-brand-gray">Idiomas</span>
                  <p className="font-medium">{selectedModel.languages}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-brand-gray">Experiencia</span>
                  <p className="font-medium text-sm">{selectedModel.experience}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-widest text-brand-gray">Disponibilidad</span>
                  <p className="font-medium flex items-center space-x-2">
                    <span className={cn("w-2 h-2 rounded-full", selectedModel.availability ? "bg-green-500" : "bg-red-500")} />
                    <span>{selectedModel.availability ? 'Inmediata' : 'Consultar'}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-widest font-semibold">Biografía</h4>
                <p className="text-sm text-brand-gray leading-relaxed font-light">
                  {selectedModel.full_desc}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedModel.tags.map(tag => (
                  <span key={tag} className="text-[9px] uppercase tracking-widest bg-brand-black/5 px-3 py-1">#{tag}</span>
                ))}
              </div>

              <div className="pt-6 space-y-4">
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => window.location.href = `/contacto?type=booking&model=${selectedModel.id}`}
                >
                  Solicitar Booking
                </Button>
                <p className="text-[10px] text-center text-brand-gray uppercase tracking-widest">
                  Respuesta garantizada en menos de 24h
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
