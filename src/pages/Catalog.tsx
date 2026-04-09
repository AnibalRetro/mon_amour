import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { ModelCard } from '@/components/ui/ModelCard';
import { Modal } from '@/components/ui/Modal';
import { db } from '@/firebase';
import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { createLocalId, mergeById, readLocalCollection, upsertLocalRecord } from '@/lib/localData';

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
  archived?: boolean;
  featured?: boolean;
  displayOrder?: number;
}

interface Reservation {
  id: string;
  modelId: string;
  modelName: string;
  reservationDate: string;
  status: 'new' | 'active' | 'completed' | 'cancelled';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  created_at?: unknown;
}

const formatCalendarKey = (date: Date) => `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;

const buildCalendar = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const calendarStart = new Date(start);
  calendarStart.setDate(start.getDate() - start.getDay());
  const calendarEnd = new Date(end);
  calendarEnd.setDate(end.getDate() + (6 - end.getDay()));

  const days: Date[] = [];
  const cursor = new Date(calendarStart);
  while (cursor <= calendarEnd) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

const sampleModels: Model[] = [
  {
    id: '1', name: 'Amélie Laurent', city: 'Paris', category: 'Fashion', cover: 'https://picsum.photos/seed/m1/800/1200',
    gallery: ['https://picsum.photos/seed/m1g1/800/1200', 'https://picsum.photos/seed/m1g2/800/1200'],
    short_desc: 'Elegancia parisina con visión editorial.', full_desc: 'Amélie ha trabajado con casas prestigiosas y aporta presencia sofisticada para campañas, editoriales y proyectos de lujo.',
    height: '178cm', experience: 'Vogue, Chanel, Dior', languages: 'Francés, Inglés', availability: true, tags: ['Editorial', 'Runway'], displayOrder: 1, featured: true,
  },
  {
    id: '2', name: 'Isabella Rossi', city: 'Milan', category: 'High Fashion', cover: 'https://picsum.photos/seed/m2/800/1200',
    gallery: ['https://picsum.photos/seed/m2g1/800/1200', 'https://picsum.photos/seed/m2g2/800/1200'],
    short_desc: 'Sofisticación italiana y versatilidad.', full_desc: 'Originaria de Milán, Isabella personifica el lujo moderno con experiencia en editoriales, pasarela y campañas premium.',
    height: '175cm', experience: 'Gucci, Prada', languages: 'Italiano, Inglés', availability: true, tags: ['Fashion', 'Beauty'], displayOrder: 2, featured: true,
  },
  {
    id: '3', name: 'Elena Vance', city: 'New York', category: 'Commercial', cover: 'https://picsum.photos/seed/m3/800/1200',
    gallery: ['https://picsum.photos/seed/m3g1/800/1200'],
    short_desc: 'Energía cosmopolita para marcas globales.', full_desc: 'Elena es ideal para campañas comerciales, activaciones, branding y producciones lifestyle con atención a detalle.',
    height: '172cm', experience: 'Nike, Apple', languages: 'Inglés, Español', availability: true, tags: ['Commercial', 'Lifestyle'], displayOrder: 3,
  },
];

const sortModels = (items: Model[]) => [...items].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
const sortReservations = (items: Reservation[]) => [...items].sort((a, b) => a.reservationDate.localeCompare(b.reservationDate));

export const Catalog = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [bookingForm, setBookingForm] = useState({ name: '', phone: '', email: '' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const localModels = readLocalCollection<Model>('models');
      const localReservations = readLocalCollection<Reservation>('reservations');

      try {
        const [modelsSnapshot, reservationsSnapshot] = await Promise.all([
          getDocs(collection(db, 'models')),
          getDocs(collection(db, 'reservations')),
        ]);

        const remoteModels = modelsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Model));
        const remoteReservations = reservationsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Reservation));
        const mergedModels = sortModels(mergeById(remoteModels, localModels)).filter((item) => !item.archived);
        const mergedReservations = sortReservations(mergeById(remoteReservations, localReservations));

        setModels(mergedModels.length ? mergedModels : sampleModels);
        setReservations(mergedReservations);
      } catch (error) {
        console.error('Error fetching catalog data:', error);
        const mergedModels = sortModels(mergeById([], localModels)).filter((item) => !item.archived);
        setModels(mergedModels.length ? mergedModels : sampleModels);
        setReservations(sortReservations(localReservations));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!models.length) return;
    const modelIdFromUrl = new URLSearchParams(window.location.search).get('model');
    if (!modelIdFromUrl) return;
    const targetModel = models.find((item) => item.id === modelIdFromUrl);
    if (targetModel) setSelectedModel(targetModel);
  }, [models]);

  useEffect(() => {
    setCurrentImageIndex(0);
    setSelectedDate('');
    setBookingMessage('');
    setBookingForm({ name: '', phone: '', email: '' });
    setCalendarMonth(new Date());
  }, [selectedModel]);

  const categories = ['All', 'Fashion', 'High Fashion', 'Commercial', 'Editorial', 'Beauty', 'Avant-Garde'];

  const filteredModels = useMemo(() => {
    let result = models;
    if (search) result = result.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'All') result = result.filter((m) => m.category === category);
    return result;
  }, [search, category, models]);

  const selectedImages = useMemo(() => {
    if (!selectedModel) return [];
    return [selectedModel.cover, ...(selectedModel.gallery || [])].filter(Boolean);
  }, [selectedModel]);

  const selectedModelReservations = useMemo(() => {
    if (!selectedModel) return [];
    return reservations.filter((reservation) => reservation.modelId === selectedModel.id && reservation.status !== 'cancelled');
  }, [reservations, selectedModel]);

  const reservedDates = useMemo(() => new Set(selectedModelReservations.map((reservation) => reservation.reservationDate)), [selectedModelReservations]);
  const calendarDays = useMemo(() => buildCalendar(calendarMonth), [calendarMonth]);

  const handleReservationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedModel || !selectedDate) return;

    setBookingLoading(true);
    setBookingMessage('');

    const reservation: Reservation = {
      id: createLocalId('reservation'),
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      reservationDate: selectedDate,
      customerName: bookingForm.name,
      customerPhone: bookingForm.phone,
      customerEmail: bookingForm.email,
      status: 'new',
      created_at: new Date().toISOString(),
    };

    try {
      try {
        const docRef = await addDoc(collection(db, 'reservations'), {
          ...reservation,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          source: 'catalog_modal',
        });
        reservation.id = docRef.id;
      } catch (firestoreError) {
        console.error('Firestore reservation fallback to local:', firestoreError);
      }

      upsertLocalRecord('reservations', reservation);
      setReservations((previous) => sortReservations(mergeById([reservation], previous)));
      setBookingMessage('Tu reserva fue realizada, nos pondremos en contacto contigo a la brevedad.');
      setBookingForm({ name: '', phone: '', email: '' });
      setSelectedDate('');
    } catch (error) {
      console.error('Error creating reservation:', error);
      setBookingMessage('No fue posible registrar la reserva. Intenta nuevamente.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 px-6 md:px-12 bg-brand-ivory min-h-screen">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="space-y-4">
          <span className="text-xs uppercase tracking-[0.4em] text-brand-gold font-medium">Nuestra Selección</span>
          <h1 className="text-5xl md:text-6xl">Catálogo Mon Amour</h1>
        </div>

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
                  'text-[10px] uppercase tracking-widest px-4 py-2 transition-all',
                  category === cat ? 'bg-brand-black text-brand-ivory' : 'bg-white text-brand-black hover:bg-brand-black/5',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {filteredModels.map((model, i) => (
              <motion.div key={model.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <ModelCard image={model.cover} title={model.name} subtitle={model.city} category={model.category} onClick={() => setSelectedModel(model)} />
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filteredModels.length === 0 && (
          <div className="text-center py-24 space-y-4">
            <p className="text-brand-gray font-light italic">No se encontraron modelos con estos criterios.</p>
            <button onClick={() => { setSearch(''); setCategory('All'); }} className="text-brand-gold uppercase text-xs tracking-widest border-b border-brand-gold">Limpiar filtros</button>
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedModel} onClose={() => setSelectedModel(null)} className="max-w-6xl">
        {selectedModel && (
          <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] min-h-[70vh]">
            <div className="bg-brand-black overflow-hidden relative group min-h-[420px]">
              <img src={selectedImages[currentImageIndex]} alt={selectedModel.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              {selectedImages.length > 1 && (
                <>
                  <button onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? selectedImages.length - 1 : prev - 1))} className="absolute left-5 top-1/2 -translate-y-1/2 bg-black/45 text-white p-3 rounded-full hover:bg-brand-wine/75 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setCurrentImageIndex((prev) => (prev === selectedImages.length - 1 ? 0 : prev + 1))} className="absolute right-5 top-1/2 -translate-y-1/2 bg-black/45 text-white p-3 rounded-full hover:bg-brand-wine/75 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              {selectedImages.length > 1 && (
                <div className="absolute bottom-6 left-6 right-6 flex gap-2 overflow-x-auto">
                  {selectedImages.map((img, i) => (
                    <button key={`${img}-${i}`} onClick={() => setCurrentImageIndex(i)} className={cn('w-14 h-18 border overflow-hidden shrink-0', currentImageIndex === i ? 'border-brand-gold' : 'border-white/20')}>
                      <img src={img} alt="Galería" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 md:p-12 space-y-8 overflow-y-auto max-h-[90vh] bg-white">
              <div className="space-y-4">
                <span className="text-xs uppercase tracking-[0.4em] text-brand-gold font-medium">{selectedModel.category}</span>
                <h2 className="text-4xl md:text-5xl">{selectedModel.name}</h2>
                <p className="text-brand-gray font-light italic tracking-wide">{selectedModel.city}</p>
              </div>

              <div className="grid grid-cols-2 gap-8 border-y border-brand-black/5 py-8">
                <div className="space-y-1"><span className="text-[10px] uppercase tracking-widest text-brand-gray">Estatura</span><p className="font-medium">{selectedModel.height}</p></div>
                <div className="space-y-1"><span className="text-[10px] uppercase tracking-widest text-brand-gray">Idiomas</span><p className="font-medium">{selectedModel.languages}</p></div>
                <div className="space-y-1"><span className="text-[10px] uppercase tracking-widest text-brand-gray">Experiencia</span><p className="font-medium text-sm">{selectedModel.experience}</p></div>
                <div className="space-y-1"><span className="text-[10px] uppercase tracking-widest text-brand-gray">Disponibilidad</span><p className="font-medium flex items-center space-x-2"><span className={cn('w-2 h-2 rounded-full', selectedModel.availability ? 'bg-green-500' : 'bg-red-500')} /><span>{selectedModel.availability ? 'Inmediata' : 'Consultar'}</span></p></div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-widest font-semibold">Biografía</h4>
                <p className="text-sm text-brand-gray leading-relaxed font-light">{selectedModel.full_desc}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedModel.tags.map((tag) => <span key={tag} className="text-[9px] uppercase tracking-widest bg-brand-black/5 px-3 py-1">#{tag}</span>)}
              </div>

              <div className="space-y-4 border border-brand-black/5 p-6 rounded-sm bg-brand-ivory/50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-brand-gold">Disponibilidad</p>
                    <h3 className="text-2xl font-serif mt-2">Reserva desde el calendario</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-brand-gray">
                    <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}><ChevronLeft className="w-4 h-4" /></button>
                    <span>{calendarMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</span>
                    <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase tracking-widest text-brand-gray">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((label) => <span key={label}>{label}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => {
                    const key = formatCalendarKey(day);
                    const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                    const isReserved = reservedDates.has(key);
                    const isSelected = selectedDate === key;
                    const isPast = key < formatCalendarKey(new Date());

                    return (
                      <button
                        type="button"
                        key={key}
                        disabled={!isCurrentMonth || isReserved || isPast}
                        onClick={() => setSelectedDate(key)}
                        className={cn(
                          'aspect-square border text-sm transition-all',
                          !isCurrentMonth && 'opacity-25 cursor-default',
                          isReserved && 'bg-brand-black text-brand-ivory border-brand-black cursor-not-allowed',
                          !isReserved && !isPast && isCurrentMonth && 'hover:border-brand-gold hover:text-brand-wine',
                          isSelected && 'border-brand-gold bg-brand-burgundy text-brand-ivory',
                          isPast && 'opacity-35 cursor-not-allowed',
                        )}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleReservationSubmit} className="space-y-4 pt-4">
                  <p className="text-xs uppercase tracking-widest text-brand-gray">Fecha seleccionada: <span className="text-brand-black">{selectedDate || 'Sin seleccionar'}</span></p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input required value={bookingForm.name} onChange={(e) => setBookingForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nombre completo" className="w-full border-b border-brand-black/10 py-3 focus:outline-none focus:border-brand-gold bg-transparent" />
                    <input required value={bookingForm.phone} onChange={(e) => setBookingForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Número de teléfono" className="w-full border-b border-brand-black/10 py-3 focus:outline-none focus:border-brand-gold bg-transparent" />
                    <input required type="email" value={bookingForm.email} onChange={(e) => setBookingForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Correo electrónico" className="w-full border-b border-brand-black/10 py-3 focus:outline-none focus:border-brand-gold bg-transparent" />
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={bookingLoading || !selectedDate}>
                    {bookingLoading ? 'Registrando reserva...' : 'Reservar fecha'}
                  </Button>
                  {bookingMessage && <p className={cn('text-sm', bookingMessage.startsWith('Tu reserva') ? 'text-green-700' : 'text-red-600')}>{bookingMessage}</p>}
                </form>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
