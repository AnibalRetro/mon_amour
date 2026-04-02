
import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Edit2,
  FolderArchive,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { db } from '@/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  orderBy,
} from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

type AdminTab = 'reservations' | 'models' | 'contacts';

interface ModelRecord {
  id: string;
  name: string;
  slug?: string;
  city: string;
  category: string;
  cover: string;
  gallery?: string[];
  short_desc?: string;
  full_desc?: string;
  height?: string;
  experience?: string;
  languages?: string;
  availability?: boolean;
  tags?: string[];
  archived?: boolean;
}

interface ReservationRecord {
  id: string;
  modelId: string;
  modelName: string;
  reservationDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  status: 'active' | 'completed' | 'cancelled';
}

interface LeadRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  type?: string;
  stage?: string;
  status?: string;
  city?: string;
  archived?: boolean;
  message?: string;
  model_interest?: string;
  service_type?: string;
  portfolio_url?: string;
  created_at?: any;
}

const SESSION_KEY = 'mon-amour-admin-session';
const DEFAULT_USER = import.meta.env.VITE_ADMIN_USER || 'admin';
const DEFAULT_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'monamour2026';

const formatCalendarKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildCalendar = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const cursor = new Date(start);
  cursor.setDate(start.getDate() - start.getDay());
  const last = new Date(end);
  last.setDate(end.getDate() + (6 - end.getDay()));

  const days: Date[] = [];
  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

const emptyModel = {
  name: '',
  slug: '',
  city: '',
  category: '',
  cover: '',
  short_desc: '',
  full_desc: '',
  height: '',
  experience: '',
  languages: '',
  tags: '',
};

export const AdminPortal = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(sessionStorage.getItem(SESSION_KEY) === 'true');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('reservations');
  const [loading, setLoading] = useState(true);

  const [models, setModels] = useState<ModelRecord[]>([]);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);

  const [selectedModelId, setSelectedModelId] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelRecord | null>(null);
  const [galleryDraft, setGalleryDraft] = useState<string[]>([]);
  const [modelForm, setModelForm] = useState(emptyModel);

  const [editingLead, setEditingLead] = useState<LeadRecord | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [modelsSnap, reservationsSnap, leadsSnap] = await Promise.all([
        getDocs(query(collection(db, 'models'), orderBy('created_at', 'desc'))),
        getDocs(query(collection(db, 'reservations'), orderBy('reservationDate', 'asc'))),
        getDocs(query(collection(db, 'leads'), orderBy('created_at', 'desc'))),
      ]);

      const modelRows = modelsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ModelRecord));
      const reservationRows = reservationsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ReservationRecord));
      const leadRows = leadsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as LeadRecord));

      setModels(modelRows);
      setReservations(reservationRows);
      setLeads(leadRows);
      if (!selectedModelId && modelRows.length > 0) {
        setSelectedModelId(modelRows[0].id);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (credentials.username === DEFAULT_USER && credentials.password === DEFAULT_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setIsAuthenticated(true);
      setLoginError('');
      return;
    }
    setLoginError('Usuario o contraseña incorrectos.');
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    setCredentials({ username: '', password: '' });
  };

  const openNewModel = () => {
    setEditingModel(null);
    setModelForm(emptyModel);
    setGalleryDraft([]);
    setIsModelModalOpen(true);
  };

  const openEditModel = (model: ModelRecord) => {
    setEditingModel(model);
    setModelForm({
      name: model.name || '',
      slug: model.slug || '',
      city: model.city || '',
      category: model.category || '',
      cover: model.cover || '',
      short_desc: model.short_desc || '',
      full_desc: model.full_desc || '',
      height: model.height || '',
      experience: model.experience || '',
      languages: model.languages || '',
      tags: (model.tags || []).join(', '),
    });
    setGalleryDraft(model.gallery || []);
    setIsModelModalOpen(true);
  };

  const saveModel = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = {
      ...modelForm,
      tags: modelForm.tags.split(',').map((item) => item.trim()).filter(Boolean),
      gallery: galleryDraft.filter(Boolean),
      archived: editingModel?.archived || false,
      availability: true,
      updated_at: serverTimestamp(),
    };

    try {
      if (editingModel) {
        await updateDoc(doc(db, 'models', editingModel.id), payload);
      } else {
        await addDoc(collection(db, 'models'), {
          ...payload,
          created_at: serverTimestamp(),
        });
      }
      setIsModelModalOpen(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving model:', error);
    }
  };

  const toggleArchiveModel = async (model: ModelRecord) => {
    await updateDoc(doc(db, 'models', model.id), {
      archived: !model.archived,
      updated_at: serverTimestamp(),
    });
    fetchData();
  };

  const removeModel = async (id: string) => {
    if (confirm('¿Deseas eliminar esta modelo?')) {
      await deleteDoc(doc(db, 'models', id));
      fetchData();
    }
  };

  const updateReservationStatus = async (id: string, status: ReservationRecord['status']) => {
    await updateDoc(doc(db, 'reservations', id), { status, updated_at: serverTimestamp() });
    fetchData();
  };

  const updateLeadStage = async (id: string, stage: string) => {
    await updateDoc(doc(db, 'leads', id), { stage, status: stage, updated_at: serverTimestamp() });
    fetchData();
  };

  const archiveLead = async (lead: LeadRecord) => {
    await updateDoc(doc(db, 'leads', lead.id), { archived: !lead.archived, updated_at: serverTimestamp() });
    fetchData();
  };

  const saveLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingLead) return;

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    await updateDoc(doc(db, 'leads', editingLead.id), {
      ...payload,
      updated_at: serverTimestamp(),
    });

    setIsLeadModalOpen(false);
    setEditingLead(null);
    fetchData();
  };

  const deleteLead = async (leadId: string) => {
    if (confirm('¿Deseas eliminar este contacto?')) {
      await deleteDoc(doc(db, 'leads', leadId));
      fetchData();
    }
  };

  const selectedModel = useMemo(
    () => models.find((item) => item.id === selectedModelId) || null,
    [models, selectedModelId],
  );

  const selectedModelReservations = useMemo(
    () => reservations.filter((reservation) => !selectedModelId || reservation.modelId === selectedModelId),
    [reservations, selectedModelId],
  );

  const reservedDates = useMemo(
    () => new Set(selectedModelReservations.filter((item) => item.status !== 'cancelled').map((item) => item.reservationDate)),
    [selectedModelReservations],
  );

  const activeReservations = useMemo(
    () => selectedModelReservations.filter((item) => item.status === 'active'),
    [selectedModelReservations],
  );

  const pastReservations = useMemo(
    () => selectedModelReservations.filter((item) => item.status === 'completed' || item.reservationDate < formatCalendarKey(new Date())),
    [selectedModelReservations],
  );

  const clients = useMemo(() => {
    const byEmail = new Map<string, { name: string; email: string; phone?: string; reservations: number }>();

    reservations.forEach((reservation) => {
      const key = reservation.customerEmail || reservation.customerPhone;
      if (!key) return;

      const existing = byEmail.get(key) || {
        name: reservation.customerName,
        email: reservation.customerEmail,
        phone: reservation.customerPhone,
        reservations: 0,
      };
      existing.reservations += 1;
      byEmail.set(key, existing);
    });

    leads
      .filter((lead) => !!lead.email || !!lead.phone)
      .forEach((lead) => {
        const key = lead.email || lead.phone || lead.id;
        if (!byEmail.has(key)) {
          byEmail.set(key, {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            reservations: 0,
          });
        }
      });

    return Array.from(byEmail.values());
  }, [leads, reservations]);

  const calendarDays = useMemo(() => buildCalendar(calendarMonth), [calendarMonth]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-brand-ivory"><div className="w-12 h-12 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-brand-black p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-brand-ivory p-12 max-w-md w-full space-y-8 premium-shadow"
        >
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-serif">Acceso Mon Amour</h1>
            <p className="text-brand-gray text-sm font-light">Ingresa con tu usuario y contraseña para administrar reservas, modelos y contactos.</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-brand-gray">Usuario</label>
              <input
                value={credentials.username}
                onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))}
                className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-brand-gray">Contraseña</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold"
              />
            </div>

            {loginError && <p className="text-sm text-red-600">{loginError}</p>}

            <Button type="submit" className="w-full" size="lg">Entrar al panel</Button>
            <p className="text-[10px] uppercase tracking-widest text-brand-gray text-center">Configurable con VITE_ADMIN_USER y VITE_ADMIN_PASSWORD</p>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1EA] flex">
      <aside className="w-72 bg-brand-black text-brand-ivory flex flex-col shrink-0">
        <div className="p-8 border-b border-white/10">
          <p className="text-[10px] uppercase tracking-[0.45em] text-brand-gold mb-2">Administrador</p>
          <h2 className="text-2xl font-serif tracking-[0.18em] uppercase">Mon Amour</h2>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: 'reservations', icon: CalendarDays, label: 'Panel de Reservas' },
            { id: 'models', icon: Users, label: 'Panel de Modelos' },
            { id: 'contacts', icon: MessageSquare, label: 'Panel de Contacto' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={cn(
                'w-full flex items-center space-x-4 px-4 py-3 text-sm transition-all',
                activeTab === tab.id ? 'bg-brand-gold text-brand-black' : 'hover:bg-white/5',
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/10">
          <button onClick={handleLogout} className="text-sm text-brand-gray hover:text-brand-ivory transition-colors">Cerrar sesión</button>
        </div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">Backoffice</p>
            <h1 className="text-3xl font-serif mt-2">
              {activeTab === 'reservations' && 'Reservas y clientes'}
              {activeTab === 'models' && 'Gestión de modelos'}
              {activeTab === 'contacts' && 'Seguimiento de contactos'}
            </h1>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white px-5 py-4 premium-shadow">
              <p className="text-[10px] uppercase tracking-widest text-brand-gray">Modelos</p>
              <p className="text-2xl font-serif">{models.length}</p>
            </div>
            <div className="bg-white px-5 py-4 premium-shadow">
              <p className="text-[10px] uppercase tracking-widest text-brand-gray">Reservas</p>
              <p className="text-2xl font-serif">{reservations.length}</p>
            </div>
            <div className="bg-white px-5 py-4 premium-shadow">
              <p className="text-[10px] uppercase tracking-widest text-brand-gray">Contactos</p>
              <p className="text-2xl font-serif">{leads.length}</p>
            </div>
          </div>
        </header>

        {activeTab === 'reservations' && (
          <div className="space-y-10">
            <div className="bg-white p-6 premium-shadow flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">Calendario por modelo</p>
                <select
                  value={selectedModelId}
                  onChange={(e) => setSelectedModelId(e.target.value)}
                  className="border border-brand-black/10 px-4 py-3 min-w-[260px] bg-transparent focus:outline-none focus:border-brand-gold"
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}{model.archived ? ' (Archivada)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-brand-gray">
                <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>{calendarMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</span>
                <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.95fr] gap-8">
              <div className="bg-white p-6 premium-shadow space-y-4">
                <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase tracking-widest text-brand-gray">
                  {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((label) => <span key={label}>{label}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => {
                    const key = formatCalendarKey(day);
                    const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                    const reserved = reservedDates.has(key);

                    return (
                      <div
                        key={key}
                        className={cn(
                          'aspect-square border flex items-center justify-center text-sm',
                          !isCurrentMonth && 'opacity-30',
                          reserved ? 'bg-brand-black text-brand-ivory border-brand-black' : 'border-brand-black/10',
                        )}
                      >
                        {day.getDate()}
                      </div>
                    );
                  })}
                </div>
                {selectedModel && (
                  <p className="text-sm text-brand-gray font-light">
                    Mostrando disponibilidad y reservas de <span className="font-medium text-brand-black">{selectedModel.name}</span>.
                  </p>
                )}
              </div>

              <div className="space-y-8">
                <div className="bg-white p-6 premium-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-serif">Reservas activas</h3>
                    <span className="text-[10px] uppercase tracking-widest text-brand-gray">{activeReservations.length} registros</span>
                  </div>
                  <div className="space-y-3">
                    {activeReservations.length === 0 && <p className="text-sm text-brand-gray">Sin reservas activas para esta modelo.</p>}
                    {activeReservations.map((reservation) => (
                      <div key={reservation.id} className="border border-brand-black/5 p-4 space-y-3">
                        <div className="flex justify-between items-center gap-4">
                          <div>
                            <p className="font-medium">{reservation.customerName}</p>
                            <p className="text-xs text-brand-gray">{reservation.customerEmail} · {reservation.customerPhone}</p>
                          </div>
                          <p className="text-xs uppercase tracking-widest text-brand-gold">{reservation.reservationDate}</p>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => updateReservationStatus(reservation.id, 'completed')} className="text-[10px] uppercase tracking-widest border border-brand-black/10 px-3 py-2 hover:bg-brand-black hover:text-brand-ivory transition-all">Marcar pasada</button>
                          <button onClick={() => updateReservationStatus(reservation.id, 'cancelled')} className="text-[10px] uppercase tracking-widest border border-brand-black/10 px-3 py-2 hover:bg-red-600 hover:text-white transition-all">Cancelar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 premium-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-serif">Reservas pasadas</h3>
                    <span className="text-[10px] uppercase tracking-widest text-brand-gray">{pastReservations.length} registros</span>
                  </div>
                  <div className="space-y-3">
                    {pastReservations.length === 0 && <p className="text-sm text-brand-gray">Sin historial todavía.</p>}
                    {pastReservations.map((reservation) => (
                      <div key={reservation.id} className="border border-brand-black/5 p-4 flex justify-between items-center gap-4">
                        <div>
                          <p className="font-medium">{reservation.customerName}</p>
                          <p className="text-xs text-brand-gray">{reservation.customerEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-widest text-brand-gray">{reservation.reservationDate}</p>
                          <p className="text-[10px] uppercase tracking-widest text-brand-gold">{reservation.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 premium-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-serif">Clientes</h3>
                <span className="text-[10px] uppercase tracking-widest text-brand-gray">{clients.length} contactos</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {clients.map((client) => (
                  <div key={`${client.email}-${client.phone}`} className="border border-brand-black/5 p-4 space-y-2">
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-brand-gray">{client.email || 'Sin correo'}</p>
                    <p className="text-xs text-brand-gray">{client.phone || 'Sin teléfono'}</p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-gold">{client.reservations} reservas</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray" />
                <input type="text" placeholder="El filtrado puede agregarse después" className="w-full bg-white border border-brand-black/5 px-12 py-3 text-sm focus:outline-none" />
              </div>
              <Button onClick={openNewModel} className="space-x-2">
                <Plus className="w-4 h-4" />
                <span>Nueva modelo</span>
              </Button>
            </div>

            <div className="bg-white premium-shadow overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-brand-black text-brand-ivory text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="p-6">Modelo</th>
                    <th className="p-6">Categoría</th>
                    <th className="p-6">Ciudad</th>
                    <th className="p-6">Carrusel</th>
                    <th className="p-6">Estado</th>
                    <th className="p-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-black/5">
                  {models.map((model) => (
                    <tr key={model.id} className="hover:bg-brand-ivory/50 transition-colors">
                      <td className="p-6 flex items-center space-x-4">
                        <img src={model.cover} className="w-12 h-16 object-cover" alt={model.name} />
                        <div>
                          <p className="font-medium">{model.name}</p>
                          <p className="text-xs text-brand-gray">{model.slug}</p>
                        </div>
                      </td>
                      <td className="p-6 text-sm text-brand-gray">{model.category}</td>
                      <td className="p-6 text-sm text-brand-gray">{model.city}</td>
                      <td className="p-6 text-sm text-brand-gray">{model.gallery?.length || 0} fotos</td>
                      <td className="p-6">
                        <span className={cn('text-[10px] uppercase tracking-widest px-2 py-1 rounded', model.archived ? 'bg-brand-black/10 text-brand-gray' : 'bg-green-100 text-green-700')}>
                          {model.archived ? 'Archivada' : 'Activa'}
                        </span>
                      </td>
                      <td className="p-6 text-right space-x-4">
                        <button onClick={() => openEditModel(model)} className="text-brand-gray hover:text-brand-gold transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => toggleArchiveModel(model)} className="text-brand-gray hover:text-brand-gold transition-colors"><FolderArchive className="w-4 h-4" /></button>
                        <button onClick={() => removeModel(model.id)} className="text-brand-gray hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-8">
            <div className="bg-white premium-shadow overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-brand-black text-brand-ivory text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="p-6">Nombre / Empresa</th>
                    <th className="p-6">Tipo</th>
                    <th className="p-6">Modelo / Servicio</th>
                    <th className="p-6">Etapa</th>
                    <th className="p-6">Estado</th>
                    <th className="p-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-black/5">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-brand-ivory/50 transition-colors">
                      <td className="p-6">
                        <p className="font-medium">{lead.name}</p>
                        <p className="text-xs text-brand-gray">{lead.company || lead.email}</p>
                      </td>
                      <td className="p-6">
                        <span className="text-[10px] uppercase tracking-widest bg-brand-black/5 px-2 py-1">{lead.type || 'contacto'}</span>
                      </td>
                      <td className="p-6 text-sm text-brand-gray">{lead.model_interest || lead.service_type || 'General'}</td>
                      <td className="p-6">
                        <select
                          value={lead.stage || 'new'}
                          onChange={(e) => updateLeadStage(lead.id, e.target.value)}
                          className="text-[10px] uppercase tracking-widest bg-transparent border-b border-brand-black/10 focus:outline-none"
                        >
                          <option value="new">Nuevo</option>
                          <option value="contacted">Contactado</option>
                          <option value="follow-up">Seguimiento</option>
                          <option value="qualified">Calificado</option>
                          <option value="closed">Cerrado</option>
                        </select>
                      </td>
                      <td className="p-6">
                        <span className={cn('text-[10px] uppercase tracking-widest px-2 py-1 rounded', lead.archived ? 'bg-brand-black/10 text-brand-gray' : 'bg-green-100 text-green-700')}>
                          {lead.archived ? 'Archivado' : 'Activo'}
                        </span>
                      </td>
                      <td className="p-6 text-right space-x-4">
                        <button onClick={() => { setEditingLead(lead); setIsLeadModalOpen(true); }} className="text-brand-gray hover:text-brand-gold transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => archiveLead(lead)} className="text-brand-gray hover:text-brand-gold transition-colors"><FolderArchive className="w-4 h-4" /></button>
                        <button onClick={() => deleteLead(lead.id)} className="text-brand-gray hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Modal isOpen={isModelModalOpen} onClose={() => setIsModelModalOpen(false)} className="max-w-5xl">
        <div className="p-10 space-y-8">
          <h2 className="text-3xl font-serif">{editingModel ? 'Editar modelo' : 'Nueva modelo'}</h2>
          <form onSubmit={saveModel} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                ['name', 'Nombre'],
                ['slug', 'Slug'],
                ['city', 'Ciudad'],
                ['category', 'Categoría'],
                ['cover', 'Foto portada (URL)'],
                ['height', 'Estatura'],
                ['experience', 'Experiencia'],
                ['languages', 'Idiomas'],
              ].map(([key, label]) => (
                <div className="space-y-2" key={key}>
                  <label className="text-[10px] uppercase tracking-widest text-brand-gray">{label}</label>
                  <input
                    required={['name', 'slug', 'city', 'category', 'cover'].includes(key)}
                    value={(modelForm as any)[key]}
                    onChange={(e) => setModelForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold"
                  />
                </div>
              ))}
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-gray">Descripción corta</label>
                <input value={modelForm.short_desc} onChange={(e) => setModelForm((prev) => ({ ...prev, short_desc: e.target.value }))} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-gray">Descripción completa</label>
                <textarea value={modelForm.full_desc} onChange={(e) => setModelForm((prev) => ({ ...prev, full_desc: e.target.value }))} rows={4} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold resize-none" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-gray">Etiquetas (separadas por coma)</label>
                <input value={modelForm.tags} onChange={(e) => setModelForm((prev) => ({ ...prev, tags: e.target.value }))} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" />
              </div>
            </div>

            <div className="space-y-4 border border-brand-black/5 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-brand-gold">Carrusel</p>
                  <h3 className="text-xl font-serif mt-2">Orden de fotos</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setGalleryDraft((prev) => [...prev, ''])}
                  className="text-[10px] uppercase tracking-widest border border-brand-black/10 px-3 py-2 hover:bg-brand-black hover:text-brand-ivory transition-all"
                >
                  Agregar foto
                </button>
              </div>

              <div className="space-y-4">
                {galleryDraft.length === 0 && <p className="text-sm text-brand-gray">Aún no hay fotos adicionales. La portada seguirá siendo la primera imagen del popup.</p>}
                {galleryDraft.map((image, index) => (
                  <div key={`gallery-${index}`} className="grid grid-cols-[1fr_auto] gap-4 items-center">
                    <input
                      value={image}
                      onChange={(e) => {
                        const next = [...galleryDraft];
                        next[index] = e.target.value;
                        setGalleryDraft(next);
                      }}
                      placeholder={`URL de foto ${index + 1}`}
                      className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (index === 0) return;
                          const next = [...galleryDraft];
                          [next[index - 1], next[index]] = [next[index], next[index - 1]];
                          setGalleryDraft(next);
                        }}
                        className="border border-brand-black/10 px-3 py-2 text-xs"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (index === galleryDraft.length - 1) return;
                          const next = [...galleryDraft];
                          [next[index], next[index + 1]] = [next[index + 1], next[index]];
                          setGalleryDraft(next);
                        }}
                        className="border border-brand-black/10 px-3 py-2 text-xs"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => setGalleryDraft((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                        className="border border-red-200 text-red-600 px-3 py-2 text-xs"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              <Save className="w-4 h-4 mr-2" />
              Guardar modelo
            </Button>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)}>
        {editingLead && (
          <div className="p-10 space-y-8">
            <h2 className="text-3xl font-serif">Editar contacto</h2>
            <form onSubmit={saveLead} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-gray">Nombre</label>
                <input name="name" defaultValue={editingLead.name} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-gray">Email</label>
                <input name="email" defaultValue={editingLead.email} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-gray">Teléfono</label>
                <input name="phone" defaultValue={editingLead.phone} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-gray">Empresa</label>
                <input name="company" defaultValue={editingLead.company} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] uppercase tracking-widest text-brand-gray">Mensaje</label>
                <textarea name="message" defaultValue={editingLead.message} rows={4} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold resize-none" />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" className="w-full" size="lg">Guardar cambios</Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};
