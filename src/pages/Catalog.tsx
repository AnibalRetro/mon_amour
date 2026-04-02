
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, CalendarDays, Phone, Mail } from 'lucide-react';
import { ModelCard } from '@/components/ui/ModelCard';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { db } from '@/firebase';
import { addDoc, collection, getDocs, query, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

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
}

interface Reservation {
  id: string;
  modelId: string;
  modelName: string;
  reservationDate: string;
  status: 'active' | 'completed' | 'cancelled';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

const formatCalendarKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const buildCalendar = (date: Date) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
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

export const Catalog = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const sampleModels: Model[] = [
    {
      id: '1', name: 'Amélie Laurent', city: 'Paris', category: 'Fashion', cover: 'https://picsum.photos/seed/m1/800/1200',
      gallery: ['https://picsum.photos/seed/m1g1/800/1200', 'https://picsum.photos/seed/m1g2/800/1200'],
      short_desc: 'Elegancia parisina con visión editorial.', full_desc: 'Amélie ha trabajado con las casas más prestigiosas de París y se distingue por su presencia sofisticada, su adaptabilidad en set y su facilidad para campañas editoriales y de lujo.',
      height: '178cm', experience: 'Vogue, Chanel, Dior', languages: 'Francés, Inglés', availability: true, tags: ['Editorial', 'Runway']
    },
    {
      id: '2', name: 'Isabella Rossi', city: 'Milan', category: 'High Fashion', cover: 'https://picsum.photos/seed/m2/800/1200',
      gallery: ['https://picsum.photos/seed/m2g1/800/1200', 'https://picsum.photos/seed/m2g2/800/1200'],
      short_desc: 'Sofisticación italiana y versatilidad.', full_desc: 'Originaria de Milán, Isabella personifica el lujo moderno con experiencia en sesiones de moda, campañas de belleza y apariciones para marcas premium.',
      height: '175cm', experience: 'Gucci, Prada', languages: 'Italiano, Inglés', availability: true, tags: ['Fashion', 'Beauty']
    },
    {
      id: '3', name: 'Elena Vance', city: 'New York', category: 'Commercial', cover: 'https://picsum.photos/seed/m3/800/1200',
      gallery: ['https://picsum.photos/seed/m3g1/800/1200'],
      short_desc: 'Energía cosmopolita para marcas globales.', full_desc: 'Elena es una opción ideal para campañas de lifestyle y contenido comercial, combinando una imagen pulida con un perfil profesional de alto rendimiento.',
      height: '172cm', experience: 'Nike, Apple', languages: 'Inglés, Español', availability: true, tags: ['Commercial', 'Lifestyle']
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [modelsSnapshot, reservationsSnapshot] = await Promise.all([
          getDocs(collection(db, 'models')),
          getDocs(query(collection(db, 'reservations'))),
        ]);

        const modelsData = modelsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Model));
        const reservationsData = reservationsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Reservation));

        setModels(modelsData.length > 0 ? modelsData.filter((item) => !item.archived) : sampleModels);
        setReservations(reservationsData);
      } catch (error) {
        console.error('Error fetching catalog data:', error);
        setModels(sampleModels);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let result = models;
    if (search) {
      result = result.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (category !== 'All') {
      result = result.filter((m) => m.category === category);
    }
    setFilteredModels(result);
  }, [search, category, models]);

  useEffect(() => {
    setCurrentImageIndex(0);
    setSelectedDate('');
    setBookingSuccess('');
    setBookingForm({ name: '', phone: '', email: '' });
    setCalendarMonth(new Date());
  }, [selectedModel]);

  const categories = ['All', 'Fashion', 'High Fashion', 'Commercial', 'Editorial', 'Beauty', 'Avant-Garde'];

  const selectedImages = useMemo(() => {
    if (!selectedModel) {
      return [];
    }
    return [selectedModel.cover, ...(selectedModel.gallery || [])].filter(Boolean);
  }, [selectedModel]);

  const selectedModelReservations = useMemo(() => {
    if (!selectedModel) {
      return [];
    }

    return reservations.filter((reservation) => reservation.modelId === selectedModel.id && reservation.status !== 'cancelled');
  }, [reservations, selectedModel]);

  const reservedDates = useMemo(() => {
    return new Set(selectedModelReservations.map((reservation) => reservation.reservationDate));
  }, [selectedModelReservations]);

  const calendarDays = useMemo(() => buildCalendar(calendarMonth), [calendarMonth]);

  const handleReservationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedModel || !selectedDate) {
      return;
    }

    setBookingLoading(true);
    setBookingSuccess('');

    try {
      await addDoc(collection(db, 'reservations'), {
        modelId: selectedModel.id,
        modelName: selectedModel.name,
        reservationDate: selectedDate,
        customerName: bookingForm.name,
        customerPhone: bookingForm.phone,
        customerEmail: bookingForm.email,
        status: 'active',
        created_at: serverTimestamp(),
        source: 'catalog_modal',
      });

      const nextReservation: Reservation = {
        id: `local-${Date.now()}`,
        modelId: selectedModel.id,
        modelName: selectedModel.name,
        reservationDate: selectedDate,
        customerName: bookingForm.name,
        customerPhone: bookingForm.phone,
        customerEmail: bookingForm.email,
        status: 'active',
      };

      setReservations((previous) => [nextReservation, ...previous]);
      setBookingSuccess('Tu reserva fue realizada, nos pondremos en contacto contigo a la brevedad.');
      setBookingForm({ name: '', phone: '', email: '' });
      setSelectedDate('');
    } catch (error) {
      console.error('Error creating reservation:', error);
      setBookingSuccess('No fue posible registrar la reserva. Intenta nuevamente.');
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
                  category === cat
                    ? 'bg-brand-black text-brand-ivory'
                    : 'bg-white text-brand-black hover:bg-brand-black/5',
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

        {!loading && filteredModels.length === 0 && (
          <div className="text-center py-24 space-y-4">
            <p className="text-brand-gray font-light italic">No se encontraron modelos con estos criterios.</p>
            <button onClick={() => { setSearch(''); setCategory('All'); }} className="text-brand-gold uppercase text-xs tracking-widest border-b border-brand-gold">Limpiar filtros</button>
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedModel} onClose={() => setSelectedModel(null)} className="max-w-6xl">
        {selectedModel && (
          <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="bg-brand-black overflow-hidden relative min-h-[520px]">
              {selectedImages.length > 0 && (
                <>
                  <img
                    src={selectedImages[currentImageIndex]}
                    alt={selectedModel.name}
                    className="w-full h-full min-h-[520px] object-cover"
                    referrerPolicy="no-referrer"
                  />

                  {selectedImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? selectedImages.length - 1 : prev - 1))}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-brand-black/50 text-brand-ivory p-3 rounded-full hover:bg-brand-black/70 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentImageIndex((prev) => (prev === selectedImages.length - 1 ? 0 : prev + 1))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-brand-black/50 text-brand-ivory p-3 rounded-full hover:bg-brand-black/70 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  <div className="absolute bottom-6 left-6 right-6 flex gap-2 overflow-x-auto">
                    {selectedImages.map((img, i) => (
                      <button
                        key={`${img}-${i}`}
                        type="button"
                        onClick={() => setCurrentImageIndex(i)}
                        className={cn(
                          'w-14 h-20 border overflow-hidden shrink-0 transition-all',
                          currentImageIndex === i ? 'border-brand-gold scale-105' : 'border-white/25 hover:border-brand-gold/70',
                        )}
                      >
                        <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-8 md:p-12 space-y-8 overflow-y-auto max-h-[90vh]">
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
                    <span className={cn('w-2 h-2 rounded-full', selectedModel.availability ? 'bg-green-500' : 'bg-red-500')} />
                    <span>{selectedModel.availability ? 'Disponible' : 'Consultar'}</span>
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
                {selectedModel.tags.map((tag) => (
                  <span key={tag} className="text-[9px] uppercase tracking-widest bg-brand-black/5 px-3 py-1">#{tag}</span>
                ))}
              </div>

              <div className="space-y-5 border border-brand-black/5 p-6 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-brand-gold font-medium">Disponibilidad</p>
                    <h4 className="text-2xl font-serif mt-2 flex items-center gap-3">
                      <CalendarDays className="w-5 h-5 text-brand-gold" />
                      Agenda tu reserva
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-brand-gray">
                    <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="min-w-[130px] text-center">
                      {calendarMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                    </span>
                    <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase tracking-widest text-brand-gray">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => {
                    const dayKey = formatCalendarKey(day);
                    const isReserved = reservedDates.has(dayKey);
                    const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                    const isSelected = selectedDate === dayKey;
                    const isPast = dayKey < formatCalendarKey(new Date());

                    return (
                      <button
                        key={dayKey}
                        type="button"
                        disabled={!isCurrentMonth || isReserved || isPast}
                        onClick={() => setSelectedDate(dayKey)}
                        className={cn(
                          'aspect-square border text-sm transition-all',
                          !isCurrentMonth && 'opacity-30',
                          isReserved && 'bg-brand-black text-brand-ivory line-through cursor-not-allowed',
                          isPast && 'opacity-40 cursor-not-allowed',
                          isSelected && 'border-brand-gold bg-brand-gold/15',
                          !isReserved && isCurrentMonth && !isPast && 'hover:border-brand-gold',
                        )}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-4 text-[10px] uppercase tracking-widest text-brand-gray">
                  <span className="flex items-center gap-2"><span className="w-3 h-3 border border-brand-black/20" /> Disponible</span>
                  <span className="flex items-center gap-2"><span className="w-3 h-3 bg-brand-black" /> Reservado</span>
                  <span className="flex items-center gap-2"><span className="w-3 h-3 bg-brand-gold/25 border border-brand-gold" /> Seleccionado</span>
                </div>

                <form className="space-y-4 pt-2" onSubmit={handleReservationSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      required
                      value={bookingForm.name}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Nombre"
                      className="w-full border border-brand-black/10 px-4 py-3 text-sm focus:outline-none focus:border-brand-gold"
                    />
                    <input
                      required
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Número de teléfono"
                      className="w-full border border-brand-black/10 px-4 py-3 text-sm focus:outline-none focus:border-brand-gold"
                    />
                    <input
                      required
                      type="email"
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="Correo"
                      className="w-full border border-brand-black/10 px-4 py-3 text-sm focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <p className="text-xs text-brand-gray font-light">
                      {selectedDate ? `Fecha seleccionada: ${new Date(`${selectedDate}T12:00:00`).toLocaleDateString('es-MX', { dateStyle: 'full' })}` : 'Selecciona una fecha disponible en el calendario.'}
                    </p>
                    <Button type="submit" disabled={bookingLoading || !selectedDate} className="md:min-w-[240px]">
                      {bookingLoading ? 'Procesando...' : 'Reservar fecha'}
                    </Button>
                  </div>

                  {bookingSuccess && (
                    <p className="text-sm text-center text-brand-gray border-t border-brand-black/5 pt-4">{bookingSuccess}</p>
                  )}
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a
                  href={`/contacto?type=commercial&model=${selectedModel.id}`}
                  className="border border-brand-black/10 px-5 py-4 text-sm uppercase tracking-widest text-center hover:bg-brand-black hover:text-brand-ivory transition-all flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Contacto comercial
                </a>
                <a
                  href={`/contacto?type=booking&model=${selectedModel.id}`}
                  className="border border-brand-black/10 px-5 py-4 text-sm uppercase tracking-widest text-center hover:bg-brand-black hover:text-brand-ivory transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Contacto directo
                </a>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
