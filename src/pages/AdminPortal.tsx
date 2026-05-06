import { useEffect, useMemo, useState } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit2,
  FolderArchive,
  GripVertical,
  LayoutGrid,
  List,
  MessageSquare,
  Plus,
  Save,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { db } from '@/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { createLocalId, fileToDataUrl, mergeById, readLocalCollection, removeLocalRecord, upsertLocalRecord, writeLocalCollection } from '@/lib/localData';

type AdminTab = 'reservations' | 'models' | 'contacts' | 'pages' | 'users';
type UserRole = 'admin' | 'modelo' | 'marketing';
type ReservationStatus = 'new' | 'active' | 'completed' | 'cancelled';
type ReservationViewMode = 'list' | 'kanban';
type ReservationPeriod = 'all' | 'day' | 'month' | 'year';

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
  featured?: boolean;
  displayOrder?: number;
  created_at?: unknown;
  updated_at?: unknown;
}

interface ReservationRecord {
  id: string;
  modelId: string;
  modelName: string;
  reservationDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  status: ReservationStatus;
  income?: number;
  created_at?: unknown;
  updated_at?: unknown;
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
  created_at?: unknown;
}
interface UserRecord {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  fullName?: string;
  email?: string;
  phone?: string;
  modelId?: string;
  permissions?: string[];
}

const SESSION_KEY = 'mon-amour-admin-session';
const USERS_KEY = 'mon-amour-users';
const DEFAULT_USER = import.meta.env.VITE_ADMIN_USER || 'admin';
const DEFAULT_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'monamour2026';
const today = new Date();

const formatCalendarKey = (date: Date) => `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;

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

const sortModels = (items: ModelRecord[]) => [...items].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999));
const sortReservations = (items: ReservationRecord[]) => [...items].sort((a, b) => a.reservationDate.localeCompare(b.reservationDate));
const sortLeads = (items: LeadRecord[]) => [...items].sort((a, b) => String((b.created_at as any) || '').localeCompare(String((a.created_at as any) || '')));
const emptyModelForm = { name: '', slug: '', city: '', category: '', short_desc: '', full_desc: '', height: '', experience: '', languages: '', tags: '', featured: false };
const statusLabel: Record<ReservationStatus, string> = { new: 'Nuevas', active: 'Activas', completed: 'Pasadas', cancelled: 'Canceladas' };
const permissionOptions = ['reservations:view', 'models:view', 'contacts:view', 'pages:edit', 'users:manage'];

interface PageBlockDraft {
  id: string;
  title: string;
  text: string;
  image: string;
  alignment: 'left' | 'center' | 'right';
  position: string;
  layout: string;
}

interface PageDraft {
  id: string;
  slug: string;
  name: string;
  blocks: PageBlockDraft[];
  updatedAt?: string;
}

const defaultPageDrafts: PageDraft[] = [
  { id: 'home', slug: '/', name: 'Inicio', blocks: [{ id: 'home-hero', title: 'Hero', text: '', image: '', alignment: 'center', position: 'Superior', layout: 'Hero a pantalla completa' }] },
  { id: 'catalog', slug: '/catalogo', name: 'Catálogo', blocks: [{ id: 'catalog-grid', title: 'Listado principal', text: '', image: '', alignment: 'left', position: 'Centro', layout: 'Grid de modelos' }] },
  { id: 'about', slug: '/nosotros', name: 'Nosotros', blocks: [{ id: 'about-story', title: 'Historia', text: '', image: '', alignment: 'left', position: 'Centro', layout: 'Sección de contenido' }] },
  { id: 'contact', slug: '/contacto', name: 'Contacto', blocks: [{ id: 'contact-form', title: 'Formulario', text: '', image: '', alignment: 'left', position: 'Inferior', layout: 'Formulario + datos' }] },
];

export const AdminPortal = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(sessionStorage.getItem(SESSION_KEY) === 'true');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'modelo' as UserRole, fullName: '', email: '', phone: '', modelId: '', permissions: [] as string[] });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('reservations');
  const [loading, setLoading] = useState(true);

  const [models, setModels] = useState<ModelRecord[]>([]);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [pages, setPages] = useState<PageDraft[]>(readLocalCollection<PageDraft>('pagesDraft').length ? readLocalCollection<PageDraft>('pagesDraft') : defaultPageDrafts);
  const [selectedPageId, setSelectedPageId] = useState<string>(defaultPageDrafts[0].id);

  const [selectedModelId, setSelectedModelId] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [reservationView, setReservationView] = useState<ReservationViewMode>('list');
  const [reservationPeriod, setReservationPeriod] = useState<ReservationPeriod>('all');
  const [reservationDateFilter, setReservationDateFilter] = useState(formatCalendarKey(today));
  const [reservationMonthFilter, setReservationMonthFilter] = useState(`${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, '0')}`);
  const [reservationYearFilter, setReservationYearFilter] = useState(String(today.getFullYear()));

  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelRecord | null>(null);
  const [modelForm, setModelForm] = useState(emptyModelForm);
  const [coverPreview, setCoverPreview] = useState('');
  const [galleryDraft, setGalleryDraft] = useState<string[]>([]);
  const [draggedGalleryIndex, setDraggedGalleryIndex] = useState<number | null>(null);
  const [draggedModelId, setDraggedModelId] = useState<string | null>(null);

  const [editingLead, setEditingLead] = useState<LeadRecord | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  useEffect(() => {
    const seeded = readLocalCollection<UserRecord>('users');
    if (!seeded.length) {
      writeLocalCollection('users', [{ id: 'admin-default', username: DEFAULT_USER, password: DEFAULT_PASSWORD, role: 'admin', fullName: 'Administrador' }]);
    }
    setUsers(readLocalCollection<UserRecord>('users'));
    if (isAuthenticated) fetchData();
    else setLoading(false);
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    const localModels = readLocalCollection<ModelRecord>('models');
    const localReservations = readLocalCollection<ReservationRecord>('reservations');
    const localLeads = readLocalCollection<LeadRecord>('leads');

    try {
      const [modelsSnap, reservationsSnap, leadsSnap] = await Promise.all([
        getDocs(collection(db, 'models')),
        getDocs(collection(db, 'reservations')),
        getDocs(collection(db, 'leads')),
      ]);

      const remoteModels = modelsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as ModelRecord));
      const remoteReservations = reservationsSnap.docs.map((d) => ({ id: d.id, ...d.data(), income: Number(d.data().income || 0) } as ReservationRecord));
      const remoteLeads = leadsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as LeadRecord));

      const mergedModels = sortModels(mergeById(remoteModels, localModels));
      const mergedReservations = sortReservations(mergeById(remoteReservations, localReservations));
      const mergedLeads = sortLeads(mergeById(remoteLeads, localLeads));

      setModels(mergedModels);
      setReservations(mergedReservations);
      setLeads(mergedLeads);
      if (!selectedModelId && mergedModels.length) setSelectedModelId(mergedModels[0].id);
    } catch (error) {
      console.error('Error loading admin data:', error);
      const mergedModels = sortModels(localModels);
      setModels(mergedModels);
      setReservations(sortReservations(localReservations));
      setLeads(sortLeads(localLeads));
      if (!selectedModelId && mergedModels.length) setSelectedModelId(mergedModels[0].id);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const foundUser = users.find((user) => user.username === credentials.username && user.password === credentials.password);
    if (foundUser) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      sessionStorage.setItem(USERS_KEY, JSON.stringify(foundUser));
      setIsAuthenticated(true);
      setCurrentUser(foundUser);
      setLoginError('');
      return;
    }
    setLoginError('Usuario o contraseña incorrectos.');
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(USERS_KEY);
    setIsAuthenticated(false);
    setCredentials({ username: '', password: '' });
    window.location.href = '/?logout=1';
  };
  useEffect(() => {
    const raw = sessionStorage.getItem(USERS_KEY);
    if (raw) setCurrentUser(JSON.parse(raw) as UserRecord);
  }, []);
  const isAdmin = currentUser?.role === 'admin';
  const canSeeReservations = isAdmin || currentUser?.role === 'modelo';
  const canSeeModels = isAdmin || currentUser?.role === 'marketing';
  const canSeeContacts = isAdmin;
  useEffect(() => {
    if (canSeeReservations) return;
    if (canSeeModels) setActiveTab('models');
    else if (canSeeContacts) setActiveTab('contacts');
  }, [canSeeReservations, canSeeModels, canSeeContacts]);

  const persistModel = async (record: ModelRecord, isNew: boolean) => {
    upsertLocalRecord('models', record);
    setModels((prev) => sortModels(mergeById([record], prev)));

    try {
      if (isNew && record.id.startsWith('model-')) {
        const { id: _localId, ...payload } = record;
        const docRef = await addDoc(collection(db, 'models'), { ...payload, created_at: serverTimestamp(), updated_at: serverTimestamp() });
        removeLocalRecord<ModelRecord>('models', record.id);
        const synced = { ...record, id: docRef.id };
        upsertLocalRecord('models', synced);
        setModels((prev) => sortModels(mergeById([synced], prev.filter((item) => item.id !== record.id))));
      } else {
        await updateDoc(doc(db, 'models', record.id), { ...record, updated_at: serverTimestamp() });
      }
    } catch (error) {
      console.error('Firestore model sync fallback to local:', error);
    }
  };

  const saveModel = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const baseId = editingModel?.id || createLocalId('model');
    const displayOrder = editingModel?.displayOrder ?? models.length + 1;
    const record: ModelRecord = {
      id: baseId,
      name: modelForm.name,
      slug: modelForm.slug,
      city: modelForm.city,
      category: modelForm.category,
      cover: coverPreview,
      gallery: galleryDraft,
      short_desc: modelForm.short_desc,
      full_desc: modelForm.full_desc,
      height: modelForm.height,
      experience: modelForm.experience,
      languages: modelForm.languages,
      tags: modelForm.tags.split(',').map((item) => item.trim()).filter(Boolean),
      availability: true,
      archived: editingModel?.archived || false,
      featured: modelForm.featured,
      displayOrder,
      created_at: editingModel?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await persistModel(record, !editingModel);
    setIsModelModalOpen(false);
    setEditingModel(null);
  };

  const handleCoverUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setCoverPreview(await fileToDataUrl(file));
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const dataUrls = await Promise.all(Array.from(files).map(fileToDataUrl));
    setGalleryDraft((prev) => [...prev, ...dataUrls]);
  };

  const updateModelOrder = async (ordered: ModelRecord[]) => {
    const normalized = ordered.map((item, index) => ({ ...item, displayOrder: index + 1 }));
    setModels(normalized);
    writeLocalCollection('models', normalized);
    for (const model of normalized) {
      try {
        if (!model.id.startsWith('model-')) await updateDoc(doc(db, 'models', model.id), { displayOrder: model.displayOrder, updated_at: serverTimestamp() });
      } catch (error) {
        console.error('Error syncing display order:', error);
      }
    }
  };

  const handleModelDrop = async (targetId: string) => {
    if (!draggedModelId || draggedModelId === targetId) return;
    const reordered = [...models];
    const fromIndex = reordered.findIndex((item) => item.id === draggedModelId);
    const toIndex = reordered.findIndex((item) => item.id === targetId);
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setDraggedModelId(null);
    await updateModelOrder(reordered);
  };

  const toggleArchiveModel = async (model: ModelRecord) => {
    await persistModel({ ...model, archived: !model.archived, updated_at: new Date().toISOString() }, false);
  };

  const toggleFeaturedModel = async (model: ModelRecord) => {
    await persistModel({ ...model, featured: !model.featured, updated_at: new Date().toISOString() }, false);
  };

  const removeModel = async (model: ModelRecord) => {
    if (!confirm('¿Deseas eliminar esta modelo?')) return;
    removeLocalRecord<ModelRecord>('models', model.id);
    const next = models.filter((item) => item.id !== model.id);
    setModels(next);
    writeLocalCollection('models', next);
    try {
      if (!model.id.startsWith('model-')) await deleteDoc(doc(db, 'models', model.id));
    } catch (error) {
      console.error('Error deleting model from Firestore:', error);
    }
  };

  const persistReservation = async (record: ReservationRecord) => {
    upsertLocalRecord('reservations', record);
    setReservations((prev) => sortReservations(mergeById([record], prev)));
    try {
      if (!record.id.startsWith('reservation-')) await updateDoc(doc(db, 'reservations', record.id), { ...record, updated_at: serverTimestamp() });
    } catch (error) {
      console.error('Error syncing reservation:', error);
    }
  };

  const updateReservationStatus = async (reservation: ReservationRecord, status: ReservationStatus) => {
    await persistReservation({ ...reservation, status });
  };

  const updateReservationIncome = async (reservation: ReservationRecord, incomeValue: string) => {
    const parsed = Number(incomeValue);
    await persistReservation({ ...reservation, income: Number.isFinite(parsed) ? parsed : 0 });
  };

  const updateLeadStage = async (lead: LeadRecord, stage: string) => {
    const next = { ...lead, stage, status: stage, updated_at: new Date().toISOString() } as LeadRecord;
    upsertLocalRecord('leads', next);
    setLeads((prev) => sortLeads(mergeById([next], prev)));
    try {
      if (!lead.id.startsWith('lead-')) await updateDoc(doc(db, 'leads', lead.id), { stage, status: stage, updated_at: serverTimestamp() });
    } catch (error) {
      console.error('Error syncing lead stage:', error);
    }
  };

  const archiveLead = async (lead: LeadRecord) => {
    const next = { ...lead, archived: !lead.archived, updated_at: new Date().toISOString() } as LeadRecord;
    upsertLocalRecord('leads', next);
    setLeads((prev) => sortLeads(mergeById([next], prev)));
    try {
      if (!lead.id.startsWith('lead-')) await updateDoc(doc(db, 'leads', lead.id), { archived: next.archived, updated_at: serverTimestamp() });
    } catch (error) {
      console.error('Error archiving lead:', error);
    }
  };

  const saveLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingLead) return;
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    const next = { ...editingLead, ...payload, updated_at: new Date().toISOString() } as LeadRecord;
    upsertLocalRecord('leads', next);
    setLeads((prev) => sortLeads(mergeById([next], prev)));
    setIsLeadModalOpen(false);
    setEditingLead(null);
    try {
      if (!editingLead.id.startsWith('lead-')) await updateDoc(doc(db, 'leads', editingLead.id), { ...payload, updated_at: serverTimestamp() });
    } catch (error) {
      console.error('Error syncing edited lead:', error);
    }
  };

  const deleteLead = async (lead: LeadRecord) => {
    if (!confirm('¿Deseas eliminar este contacto?')) return;
    removeLocalRecord<LeadRecord>('leads', lead.id);
    setLeads((prev) => prev.filter((item) => item.id !== lead.id));
    try {
      if (!lead.id.startsWith('lead-')) await deleteDoc(doc(db, 'leads', lead.id));
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const openNewModel = () => {
    setEditingModel(null);
    setModelForm(emptyModelForm);
    setCoverPreview('');
    setGalleryDraft([]);
    setIsModelModalOpen(true);
  };

  const openEditModel = (model: ModelRecord) => {
    setEditingModel(model);
    setModelForm({
      name: model.name || '', slug: model.slug || '', city: model.city || '', category: model.category || '', short_desc: model.short_desc || '', full_desc: model.full_desc || '', height: model.height || '', experience: model.experience || '', languages: model.languages || '', tags: (model.tags || []).join(', '), featured: !!model.featured,
    });
    setCoverPreview(model.cover || '');
    setGalleryDraft(model.gallery || []);
    setIsModelModalOpen(true);
  };

  const selectedModel = useMemo(() => models.find((item) => item.id === selectedModelId) || null, [models, selectedModelId]);
  const saveUsers = (nextUsers: UserRecord[]) => {
    setUsers(nextUsers);
    writeLocalCollection('users', nextUsers);
    if (currentUser) {
      const refreshed = nextUsers.find((user) => user.id === currentUser.id);
      if (refreshed) {
        setCurrentUser(refreshed);
        sessionStorage.setItem(USERS_KEY, JSON.stringify(refreshed));
      }
    }
  };
  const upsertUser = () => {
    if (!newUser.username || !newUser.password) return;
    const record: UserRecord = {
      id: editingUserId || createLocalId('user'),
      username: newUser.username.trim(),
      password: newUser.password,
      role: newUser.role,
      fullName: newUser.fullName.trim(),
      email: newUser.email.trim(),
      phone: newUser.phone.trim(),
      modelId: newUser.modelId || undefined,
      permissions: newUser.permissions,
    };
    const next = editingUserId ? users.map((user) => user.id === editingUserId ? record : user) : [...users, record];
    saveUsers(next);
    setEditingUserId(null);
    setNewUser({ username: '', password: '', role: 'modelo', fullName: '', email: '', phone: '', modelId: '', permissions: [] });
  };
  const selectedModelReservations = useMemo(() => reservations.filter((reservation) => !selectedModelId || reservation.modelId === selectedModelId), [reservations, selectedModelId]);
  const reservedDates = useMemo(() => new Set(selectedModelReservations.filter((item) => item.status !== 'cancelled').map((item) => item.reservationDate)), [selectedModelReservations]);
  const todayKey = formatCalendarKey(today);
  const newReservations = useMemo(() => selectedModelReservations.filter((item) => item.status === 'new'), [selectedModelReservations]);
  const activeReservations = useMemo(() => selectedModelReservations.filter((item) => item.status === 'active'), [selectedModelReservations]);
  const pastReservations = useMemo(() => selectedModelReservations.filter((item) => item.status === 'completed' || (item.status !== 'cancelled' && item.reservationDate < todayKey)), [selectedModelReservations, todayKey]);
  const clients = useMemo(() => {
    const map = new Map<string, { name: string; email: string; phone?: string; reservations: number }>();
    reservations.forEach((reservation) => {
      const key = reservation.customerEmail || reservation.customerPhone;
      if (!key) return;
      const current = map.get(key) || { name: reservation.customerName, email: reservation.customerEmail, phone: reservation.customerPhone, reservations: 0 };
      current.reservations += 1;
      map.set(key, current);
    });
    return Array.from(map.values());
  }, [reservations]);
  const calendarDays = useMemo(() => buildCalendar(calendarMonth), [calendarMonth]);

  const visibleReservations = useMemo(() => {
    const base = reservations.filter((reservation) => (selectedModelId ? reservation.modelId === selectedModelId : true));
    const roleScoped = currentUser?.role === 'modelo'
      ? base.filter((reservation) => currentUser.modelId ? reservation.modelId === currentUser.modelId : reservation.modelName.toLowerCase().includes(currentUser.username.toLowerCase()))
      : base;
    return roleScoped.filter((reservation) => {
      if (reservationPeriod === 'day') return reservation.reservationDate === reservationDateFilter;
      if (reservationPeriod === 'month') return reservation.reservationDate.startsWith(reservationMonthFilter);
      if (reservationPeriod === 'year') return reservation.reservationDate.startsWith(reservationYearFilter);
      return true;
    });
  }, [reservations, selectedModelId, reservationPeriod, reservationDateFilter, reservationMonthFilter, reservationYearFilter, currentUser]);

  const reservationByStatus = useMemo(() => ({
    new: visibleReservations.filter((item) => item.status === 'new'),
    active: visibleReservations.filter((item) => item.status === 'active'),
    completed: visibleReservations.filter((item) => item.status === 'completed' || (item.status !== 'cancelled' && item.reservationDate < todayKey)),
    cancelled: visibleReservations.filter((item) => item.status === 'cancelled'),
  }), [visibleReservations, todayKey]);

  const reservationStatsByModel = useMemo(() => {
    return sortModels(models.filter((model) => !model.archived)).map((model) => ({
      modelId: model.id,
      modelName: model.name,
      total: visibleReservations.filter((reservation) => reservation.modelId === model.id).length,
    })).filter((item) => item.total > 0 || !selectedModelId);
  }, [models, visibleReservations, selectedModelId]);

  const incomeByModel = useMemo(() => {
    const map = new Map<string, { modelName: string; total: number; reservations: number }>();
    reservations.forEach((reservation) => {
      const current = map.get(reservation.modelId) || { modelName: reservation.modelName, total: 0, reservations: 0 };
      current.total += Number(reservation.income || 0);
      current.reservations += 1;
      map.set(reservation.modelId, current);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [reservations]);


  const selectedPage = useMemo(() => pages.find((page) => page.id === selectedPageId) || null, [pages, selectedPageId]);

  const savePages = (next: PageDraft[]) => {
    setPages(next);
    writeLocalCollection('pagesDraft', next);
  };

  const updatePageBlock = (pageId: string, blockId: string, field: keyof PageBlockDraft, value: string) => {
    const next = pages.map((page) => page.id !== pageId ? page : ({
      ...page,
      updatedAt: new Date().toISOString(),
      blocks: page.blocks.map((block) => block.id !== blockId ? block : { ...block, [field]: value }),
    }));
    savePages(next);
  };

  const addBlockToPage = (pageId: string) => {
    const next = pages.map((page) => page.id !== pageId ? page : ({
      ...page,
      updatedAt: new Date().toISOString(),
      blocks: [...page.blocks, { id: createLocalId('page-block'), title: 'Nuevo bloque', text: '', image: '', alignment: 'left', position: 'Centro', layout: 'Contenido libre' }],
    }));
    savePages(next);
  };

  const removeBlockFromPage = (pageId: string, blockId: string) => {
    const next = pages.map((page) => page.id !== pageId ? page : ({ ...page, updatedAt: new Date().toISOString(), blocks: page.blocks.filter((block) => block.id !== blockId) }));
    savePages(next);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-brand-ivory"><div className="w-12 h-12 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" /></div>;

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-brand-black p-6">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="bg-brand-ivory p-12 max-w-md w-full space-y-8 premium-shadow">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-serif">Acceso Mon Amour</h1>
            <p className="text-brand-gray text-sm font-light">Ingresa con tu usuario y contraseña para administrar reservas, modelos y contactos.</p>
          </div>
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-brand-gray">Usuario</label><input value={credentials.username} onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" /></div>
            <div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-brand-gray">Contraseña</label><input type="password" value={credentials.password} onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" /></div>
            {loginError && <p className="text-sm text-red-600">{loginError}</p>}
            <Button type="submit" className="w-full" size="lg">Entrar al panel</Button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6efe9] flex">
      <aside className="w-72 bg-brand-black text-brand-ivory flex flex-col shrink-0">
        <div className="p-8 border-b border-white/10"><p className="text-[10px] uppercase tracking-[0.45em] text-brand-gold mb-2">Administrador</p><h2 className="text-2xl font-serif tracking-[0.18em] uppercase">Mon Amour</h2></div>
        <nav className="flex-1 p-6 space-y-2">
          {[canSeeReservations && { id: 'reservations', icon: CalendarDays, label: 'Panel de Reservas' }, canSeeModels && { id: 'models', icon: Users, label: 'Panel de Modelos' }, canSeeModels && { id: 'pages', icon: Edit2, label: 'Editor de páginas' }, canSeeContacts && { id: 'contacts', icon: MessageSquare, label: 'Panel de Contacto' }, isAdmin && { id: 'users', icon: Users, label: 'Panel de Usuarios' }].filter(Boolean).map((tab: any) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as AdminTab)} className={cn('w-full flex items-center space-x-4 px-4 py-3 text-sm transition-all', activeTab === tab.id ? 'bg-brand-gold text-brand-black' : 'hover:bg-white/5')}><tab.icon className="w-4 h-4" /><span>{tab.label}</span></button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/10"><button onClick={handleLogout} className="text-sm text-brand-gray hover:text-brand-ivory transition-colors">Cerrar sesión</button></div>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10 gap-4 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">Backoffice</p>
            <h1 className="text-3xl font-serif mt-2">{activeTab === 'reservations' ? 'Reservas y clientes' : activeTab === 'models' ? 'Gestión de modelos' : activeTab === 'pages' ? 'Editor de páginas' : activeTab === 'contacts' ? 'Seguimiento de contactos' : 'Gestión de usuarios'}</h1>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white px-5 py-4 premium-shadow"><p className="text-[10px] uppercase tracking-widest text-brand-gray">Modelos</p><p className="text-2xl font-serif">{models.length}</p></div>
            <div className="bg-white px-5 py-4 premium-shadow"><p className="text-[10px] uppercase tracking-widest text-brand-gray">Reservas</p><p className="text-2xl font-serif">{reservations.length}</p></div>
            <div className="bg-white px-5 py-4 premium-shadow"><p className="text-[10px] uppercase tracking-widest text-brand-gray">Contactos</p><p className="text-2xl font-serif">{leads.length}</p></div>
          </div>
        </header>

        {activeTab === 'reservations' && (
          <div className="space-y-10">
            <div className="bg-white p-6 premium-shadow space-y-6">
              <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-brand-gold">Vista general</p>
                  <h3 className="text-2xl font-serif mt-2">Reservas por estado</h3>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <select value={selectedModelId} onChange={(e) => setSelectedModelId(e.target.value)} className="border border-brand-black/10 px-4 py-3 min-w-[230px] bg-transparent focus:outline-none focus:border-brand-gold">
                    <option value="">Todas las modelos</option>
                    {sortModels(models).map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
                  </select>
                  <select value={reservationPeriod} onChange={(e) => setReservationPeriod(e.target.value as ReservationPeriod)} className="border border-brand-black/10 px-4 py-3 bg-transparent focus:outline-none focus:border-brand-gold">
                    <option value="all">Todo</option>
                    <option value="day">Por día</option>
                    <option value="month">Por mes</option>
                    <option value="year">Por año</option>
                  </select>
                  {reservationPeriod === 'day' && <input type="date" value={reservationDateFilter} onChange={(e) => setReservationDateFilter(e.target.value)} className="border border-brand-black/10 px-4 py-3 bg-transparent focus:outline-none focus:border-brand-gold" />}
                  {reservationPeriod === 'month' && <input type="month" value={reservationMonthFilter} onChange={(e) => setReservationMonthFilter(e.target.value)} className="border border-brand-black/10 px-4 py-3 bg-transparent focus:outline-none focus:border-brand-gold" />}
                  {reservationPeriod === 'year' && <input type="number" min="2024" max="2099" value={reservationYearFilter} onChange={(e) => setReservationYearFilter(e.target.value)} className="border border-brand-black/10 px-4 py-3 bg-transparent focus:outline-none focus:border-brand-gold w-32" />}
                  <div className="flex border border-brand-black/10 overflow-hidden">
                    <button onClick={() => setReservationView('list')} className={cn('px-4 py-3', reservationView === 'list' ? 'bg-brand-black text-brand-ivory' : 'bg-white')}><List className="w-4 h-4" /></button>
                    <button onClick={() => setReservationView('kanban')} className={cn('px-4 py-3', reservationView === 'kanban' ? 'bg-brand-black text-brand-ivory' : 'bg-white')}><LayoutGrid className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(['new', 'active', 'completed', 'cancelled'] as ReservationStatus[]).map((status) => (
                  <div key={status} className="border border-brand-black/5 p-4">
                    <p className="text-[10px] uppercase tracking-widest text-brand-gray">{statusLabel[status]}</p>
                    <p className="text-3xl font-serif mt-2">{reservationByStatus[status].length}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-serif">Cantidad de reservas por modelo</h4>
                  <span className="text-[10px] uppercase tracking-widest text-brand-gray">{visibleReservations.length} reservas visibles</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {reservationStatsByModel.map((item) => (
                    <div key={item.modelId} className="border border-brand-black/5 p-4">
                      <p className="font-medium">{item.modelName}</p>
                      <p className="text-2xl font-serif mt-2">{item.total}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-xl font-serif">Dashboard de citas e ingresos promedio</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {incomeByModel.map((item) => (
                    <div key={item.modelName} className="border border-brand-black/5 p-4">
                      <p className="font-medium">{item.modelName}</p>
                      <p className="text-sm text-brand-gray">Promedio por cita: {(item.total / Math.max(item.reservations, 1)).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
                      <div className="mt-3 h-2 bg-brand-black/10"><div className="h-full bg-brand-gold" style={{ width: `${Math.min(100, item.reservations * 10)}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              {reservationView === 'list' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-brand-black text-brand-ivory text-[10px] uppercase tracking-widest"><tr><th className="p-4">Fecha</th><th className="p-4">Modelo</th><th className="p-4">Cliente</th><th className="p-4">Contacto</th><th className="p-4">Estado</th></tr></thead>
                    <tbody className="divide-y divide-brand-black/5 bg-white">
                      {visibleReservations.length === 0 && <tr><td className="p-6 text-sm text-brand-gray" colSpan={5}>No hay reservas con estos filtros.</td></tr>}
                      {visibleReservations.map((reservation) => (
                        <tr key={reservation.id}>
                          <td className="p-4 text-sm">{reservation.reservationDate}</td>
                          <td className="p-4 text-sm">{reservation.modelName}</td>
                          <td className="p-4 text-sm">{reservation.customerName}</td>
                          <td className="p-4 text-sm text-brand-gray">{reservation.customerEmail}<br />{reservation.customerPhone}</td>
                          <td className="p-4"><span className="text-[10px] uppercase tracking-widest bg-brand-black/5 px-2 py-1">{statusLabel[reservation.status]}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                  {(['new', 'active', 'completed', 'cancelled'] as ReservationStatus[]).map((status) => (
                    <div key={status} className="bg-[#faf6f1] border border-brand-black/5 p-4 space-y-4">
                      <div><p className="text-[10px] uppercase tracking-[0.35em] text-brand-gold">{statusLabel[status]}</p><h4 className="text-lg font-serif mt-2">{reservationByStatus[status].length} registros</h4></div>
                      <div className="space-y-3">
                        {reservationByStatus[status].map((reservation) => (
                          <div key={reservation.id} className="bg-white border border-brand-black/5 p-4 space-y-2">
                            <p className="font-medium">{reservation.customerName}</p>
                            <p className="text-xs text-brand-gray">{reservation.modelName}</p>
                            <p className="text-xs text-brand-gray">{reservation.reservationDate}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white p-6 premium-shadow flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-[0.4em] text-brand-gold">Calendario por modelo</p>
                <select value={selectedModelId} onChange={(e) => setSelectedModelId(e.target.value)} className="border border-brand-black/10 px-4 py-3 min-w-[260px] bg-transparent focus:outline-none focus:border-brand-gold">
                  {sortModels(models).map((model) => <option key={model.id} value={model.id}>{model.name}{model.archived ? ' (Archivada)' : ''}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-4 text-xs uppercase tracking-widest text-brand-gray">
                <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}><ChevronLeft className="w-4 h-4" /></button>
                <span>{calendarMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</span>
                <button type="button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.95fr] gap-8">
              <div className="bg-white p-6 premium-shadow space-y-4">
                <div className="grid grid-cols-7 gap-2 text-center text-[10px] uppercase tracking-widest text-brand-gray">{['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((label) => <span key={label}>{label}</span>)}</div>
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day) => {
                    const key = formatCalendarKey(day);
                    const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                    const reserved = reservedDates.has(key);
                    return <div key={key} className={cn('aspect-square border flex items-center justify-center text-sm', !isCurrentMonth && 'opacity-30', reserved ? 'bg-brand-burgundy text-brand-ivory border-brand-burgundy' : 'border-brand-black/10')}>{day.getDate()}</div>;
                  })}
                </div>
                {selectedModel && <p className="text-sm text-brand-gray font-light">Mostrando disponibilidad y reservas de <span className="font-medium text-brand-black">{selectedModel.name}</span>.</p>}
              </div>

              <div className="space-y-8">
                {[
                  ['Nuevas reservas', newReservations],
                  ['Reservas activas', activeReservations],
                  ['Reservas pasadas', pastReservations],
                ].map(([title, list]) => (
                  <div key={title as string} className="bg-white p-6 premium-shadow">
                    <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-serif">{title as string}</h3><span className="text-[10px] uppercase tracking-widest text-brand-gray">{(list as ReservationRecord[]).length} registros</span></div>
                    <div className="space-y-3">
                      {(list as ReservationRecord[]).length === 0 && <p className="text-sm text-brand-gray">Sin registros en esta sección.</p>}
                      {(list as ReservationRecord[]).map((reservation) => (
                        <div key={reservation.id} className="border border-brand-black/5 p-4 space-y-3">
                          <div className="flex justify-between items-center gap-4"><div><p className="font-medium">{reservation.customerName}</p><p className="text-xs text-brand-gray">{reservation.customerEmail} · {reservation.customerPhone}</p></div><p className="text-xs uppercase tracking-widest text-brand-gold">{reservation.reservationDate}</p></div>
                          <div className="flex flex-wrap gap-3">
                            {reservation.status !== 'new' && <button onClick={() => updateReservationStatus(reservation, 'new')} className="text-[10px] uppercase tracking-widest border border-brand-black/10 px-3 py-2 hover:bg-brand-black hover:text-brand-ivory transition-all">Marcar nueva</button>}
                            {reservation.status !== 'active' && <button onClick={() => updateReservationStatus(reservation, 'active')} className="text-[10px] uppercase tracking-widest border border-brand-black/10 px-3 py-2 hover:bg-brand-black hover:text-brand-ivory transition-all">Marcar activa</button>}
                            {reservation.status !== 'completed' && <button onClick={() => updateReservationStatus(reservation, 'completed')} className="text-[10px] uppercase tracking-widest border border-brand-black/10 px-3 py-2 hover:bg-brand-black hover:text-brand-ivory transition-all">Marcar pasada</button>}
                            {reservation.status !== 'cancelled' && <button onClick={() => updateReservationStatus(reservation, 'cancelled')} className="text-[10px] uppercase tracking-widest border border-red-200 px-3 py-2 hover:bg-red-600 hover:text-white transition-all">Cancelar</button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 premium-shadow">
              <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-serif">Clientes</h3><span className="text-[10px] uppercase tracking-widest text-brand-gray">{clients.length} contactos</span></div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {clients.map((client) => <div key={`${client.email}-${client.phone}`} className="border border-brand-black/5 p-4 space-y-2"><p className="font-medium">{client.name}</p><p className="text-xs text-brand-gray">{client.email || 'Sin correo'}</p><p className="text-xs text-brand-gray">{client.phone || 'Sin teléfono'}</p><p className="text-[10px] uppercase tracking-widest text-brand-gold">{client.reservations} reservas</p></div>)}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center"><p className="text-sm text-brand-gray">Arrastra las filas para cambiar el orden del catálogo y marca qué perfiles se mostrarán como destacados en inicio.</p><Button onClick={openNewModel} className="space-x-2"><Plus className="w-4 h-4" /><span>Agregar Modelo</span></Button></div>
            <div className="bg-white premium-shadow overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-brand-black text-brand-ivory text-[10px] uppercase tracking-widest"><tr><th className="p-6">Orden</th><th className="p-6">Modelo</th><th className="p-6">Categoría</th><th className="p-6">Destacada</th><th className="p-6">Estado</th><th className="p-6 text-right">Acciones</th></tr></thead>
                <tbody className="divide-y divide-brand-black/5">
                  {models.map((model, index) => (
                    <tr key={model.id} draggable onDragStart={() => setDraggedModelId(model.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleModelDrop(model.id)} className="hover:bg-brand-ivory/50 transition-colors">
                      <td className="p-6"><div className="flex items-center gap-3"><GripVertical className="w-4 h-4 text-brand-gray" /> <span>{index + 1}</span></div></td>
                      <td className="p-6 flex items-center space-x-4"><img src={model.cover} className="w-12 h-16 object-cover rounded-sm" alt={model.name} /><div><span className="font-medium block">{model.name}</span><span className="text-xs text-brand-gray">{model.city}</span></div></td>
                      <td className="p-6 text-sm text-brand-gray">{model.category}</td>
                      <td className="p-6"><button onClick={() => toggleFeaturedModel(model)} className={cn('text-[10px] uppercase tracking-widest px-3 py-2 border', model.featured ? 'bg-brand-gold text-brand-black border-brand-gold' : 'border-brand-black/10')}>{model.featured ? 'Destacada' : 'Normal'}</button></td>
                      <td className="p-6"><span className={cn('text-[10px] uppercase tracking-widest px-2 py-1 rounded', model.archived ? 'bg-brand-black/10 text-brand-gray' : 'bg-green-100 text-green-700')}>{model.archived ? 'Archivada' : 'Activa'}</span></td>
                      <td className="p-6 text-right space-x-4"><button onClick={() => openEditModel(model)} className="text-brand-gray hover:text-brand-gold transition-colors"><Edit2 className="w-4 h-4" /></button><button onClick={() => toggleArchiveModel(model)} className="text-brand-gray hover:text-brand-gold transition-colors"><FolderArchive className="w-4 h-4" /></button><button onClick={() => removeModel(model)} className="text-brand-gray hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'pages' && (
          <div className="space-y-6">
            <div className="bg-white p-6 premium-shadow space-y-3">
              <p className="text-sm text-brand-gray">Edita textos, ubicación, alineación, imágenes y estructura por bloque sin alterar la maquetación actual del sitio en producción.</p>
              <div className="flex flex-wrap gap-3">
                {pages.map((page) => (
                  <button key={page.id} onClick={() => setSelectedPageId(page.id)} className={cn('px-4 py-2 border text-sm', selectedPageId === page.id ? 'bg-brand-black text-brand-ivory border-brand-black' : 'border-brand-black/10')}>
                    {page.name}
                  </button>
                ))}
              </div>
            </div>
            {selectedPage && (
              <div className="bg-white p-6 premium-shadow space-y-5">
                <div className="flex items-center justify-between">
                  <div><h3 className="text-2xl font-serif">{selectedPage.name}</h3><p className="text-xs text-brand-gray">Ruta: {selectedPage.slug}</p></div>
                  <Button onClick={() => addBlockToPage(selectedPage.id)} className="space-x-2"><Plus className="w-4 h-4" /><span>Agregar bloque</span></Button>
                </div>
                <div className="space-y-4">
                  {selectedPage.blocks.map((block) => (
                    <div key={block.id} className="border border-brand-black/10 p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input value={block.title} onChange={(e) => updatePageBlock(selectedPage.id, block.id, 'title', e.target.value)} placeholder="Título del bloque" className="border border-brand-black/10 px-3 py-2" />
                        <input value={block.image} onChange={(e) => updatePageBlock(selectedPage.id, block.id, 'image', e.target.value)} placeholder="URL de imagen" className="border border-brand-black/10 px-3 py-2" />
                        <input value={block.position} onChange={(e) => updatePageBlock(selectedPage.id, block.id, 'position', e.target.value)} placeholder="Ubicación" className="border border-brand-black/10 px-3 py-2" />
                        <input value={block.layout} onChange={(e) => updatePageBlock(selectedPage.id, block.id, 'layout', e.target.value)} placeholder="Estructura del bloque" className="border border-brand-black/10 px-3 py-2" />
                        <select value={block.alignment} onChange={(e) => updatePageBlock(selectedPage.id, block.id, 'alignment', e.target.value)} className="border border-brand-black/10 px-3 py-2">
                          <option value="left">Alineación izquierda</option><option value="center">Alineación centro</option><option value="right">Alineación derecha</option>
                        </select>
                        <button onClick={() => removeBlockFromPage(selectedPage.id, block.id)} className="border border-red-200 text-red-600 px-3 py-2 text-sm">Eliminar bloque</button>
                      </div>
                      <textarea value={block.text} onChange={(e) => updatePageBlock(selectedPage.id, block.id, 'text', e.target.value)} rows={4} placeholder="Texto del bloque" className="w-full border border-brand-black/10 px-3 py-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-8">
            <div className="bg-white premium-shadow overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-brand-black text-brand-ivory text-[10px] uppercase tracking-widest"><tr><th className="p-6">Nombre / Empresa</th><th className="p-6">Tipo</th><th className="p-6">Interés</th><th className="p-6">Etapa</th><th className="p-6">Estado</th><th className="p-6 text-right">Acciones</th></tr></thead>
                <tbody className="divide-y divide-brand-black/5">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-brand-ivory/50 transition-colors">
                      <td className="p-6"><p className="font-medium">{lead.name}</p><p className="text-xs text-brand-gray">{lead.company || lead.email}</p></td>
                      <td className="p-6"><span className="text-[10px] uppercase tracking-widest bg-brand-black/5 px-2 py-1">{lead.type || 'contacto'}</span></td>
                      <td className="p-6 text-sm text-brand-gray">{lead.model_interest || lead.service_type || 'General'}</td>
                      <td className="p-6"><select value={lead.stage || 'new'} onChange={(e) => updateLeadStage(lead, e.target.value)} className="text-[10px] uppercase tracking-widest bg-transparent border-b border-brand-black/10 focus:outline-none"><option value="new">Nuevo</option><option value="contacted">Contactado</option><option value="follow-up">Seguimiento</option><option value="qualified">Calificado</option><option value="closed">Cerrado</option></select></td>
                      <td className="p-6"><span className={cn('text-[10px] uppercase tracking-widest px-2 py-1 rounded', lead.archived ? 'bg-brand-black/10 text-brand-gray' : 'bg-green-100 text-green-700')}>{lead.archived ? 'Archivado' : 'Activo'}</span></td>
                      <td className="p-6 text-right space-x-4"><button onClick={() => { setEditingLead(lead); setIsLeadModalOpen(true); }} className="text-brand-gray hover:text-brand-gold transition-colors"><Edit2 className="w-4 h-4" /></button><button onClick={() => archiveLead(lead)} className="text-brand-gray hover:text-brand-gold transition-colors"><FolderArchive className="w-4 h-4" /></button><button onClick={() => deleteLead(lead)} className="text-brand-gray hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white p-6 premium-shadow space-y-6">
              <div className="flex items-center justify-between">
                <div><p className="text-[10px] uppercase tracking-[0.35em] text-brand-gold">Ingresos</p><h3 className="text-2xl font-serif mt-2">Panel de ingresos por reserva</h3></div>
                <span className="text-[10px] uppercase tracking-widest text-brand-gray">{incomeByModel.reduce((sum, item) => sum + item.total, 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} total</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {incomeByModel.map((item) => (
                  <div key={item.modelName} className="border border-brand-black/5 p-4 space-y-2">
                    <p className="font-medium">{item.modelName}</p>
                    <p className="text-2xl font-serif">{item.total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</p>
                    <p className="text-xs text-brand-gray">{item.reservations} reservas registradas</p>
                  </div>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-brand-black text-brand-ivory text-[10px] uppercase tracking-widest"><tr><th className="p-4">Fecha</th><th className="p-4">Modelo</th><th className="p-4">Cliente</th><th className="p-4">Estado</th><th className="p-4">Ingreso</th></tr></thead>
                  <tbody className="divide-y divide-brand-black/5">
                    {reservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td className="p-4 text-sm">{reservation.reservationDate}</td>
                        <td className="p-4 text-sm">{reservation.modelName}</td>
                        <td className="p-4 text-sm">{reservation.customerName}</td>
                        <td className="p-4"><span className="text-[10px] uppercase tracking-widest bg-brand-black/5 px-2 py-1">{statusLabel[reservation.status]}</span></td>
                        <td className="p-4"><input type="number" step="0.01" defaultValue={reservation.income || 0} onBlur={(e) => updateReservationIncome(reservation, e.target.value)} className="border border-brand-black/10 px-3 py-2 w-40 focus:outline-none focus:border-brand-gold" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'users' && isAdmin && (
          <div className="space-y-6">
            <div className="bg-white p-6 premium-shadow space-y-4">
              <h3 className="text-2xl font-serif">{editingUserId ? 'Editar usuario' : 'Crear usuario'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input value={newUser.username} onChange={(e) => setNewUser((prev) => ({ ...prev, username: e.target.value }))} placeholder="Usuario" className="border border-brand-black/10 px-4 py-3" />
                <input value={newUser.password} onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))} placeholder="Contraseña" className="border border-brand-black/10 px-4 py-3" />
                <select value={newUser.role} onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as UserRole }))} className="border border-brand-black/10 px-4 py-3"><option value="admin">admin</option><option value="modelo">modelo</option><option value="marketing">marketing</option></select>
                <Button onClick={upsertUser}>{editingUserId ? 'Guardar' : 'Crear'}</Button>
                <input value={newUser.fullName} onChange={(e) => setNewUser((prev) => ({ ...prev, fullName: e.target.value }))} placeholder="Nombre completo" className="border border-brand-black/10 px-4 py-3 md:col-span-2" />
                <input value={newUser.email} onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))} placeholder="Correo" className="border border-brand-black/10 px-4 py-3" />
                <input value={newUser.phone} onChange={(e) => setNewUser((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Teléfono" className="border border-brand-black/10 px-4 py-3" />
                <select value={newUser.modelId} onChange={(e) => setNewUser((prev) => ({ ...prev, modelId: e.target.value }))} className="border border-brand-black/10 px-4 py-3 md:col-span-2">
                  <option value="">Sin vincular modelo</option>
                  {models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                {permissionOptions.map((permission) => (
                  <button key={permission} type="button" onClick={() => setNewUser((prev) => ({ ...prev, permissions: prev.permissions.includes(permission) ? prev.permissions.filter((item) => item !== permission) : [...prev.permissions, permission] }))} className={cn('px-3 py-2 text-[10px] uppercase tracking-widest border', newUser.permissions.includes(permission) ? 'bg-brand-black text-brand-ivory border-brand-black' : 'border-brand-black/10')}>
                    {permission}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 premium-shadow overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-brand-black text-brand-ivory text-[10px] uppercase tracking-widest"><tr><th className="p-4">Usuario</th><th className="p-4">Nombre</th><th className="p-4">Contacto</th><th className="p-4">Rol</th><th className="p-4">Modelo vinculada</th><th className="p-4">Permisos</th><th className="p-4 text-right">Acciones</th></tr></thead>
                <tbody className="divide-y divide-brand-black/5">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="p-4 text-sm">{user.username}</td><td className="p-4 text-sm">{user.fullName || '-'}</td><td className="p-4 text-sm">{user.email || '-'}<br />{user.phone || '-'}</td><td className="p-4 text-sm">{user.role}</td>
                      <td className="p-4 text-sm">{models.find((model) => model.id === user.modelId)?.name || '-'}</td><td className="p-4 text-xs">{(user.permissions || []).join(', ') || '-'}</td>
                      <td className="p-4 text-right space-x-3"><button onClick={() => { setEditingUserId(user.id); setNewUser({ username: user.username, password: user.password, role: user.role, fullName: user.fullName || '', email: user.email || '', phone: user.phone || '', modelId: user.modelId || '', permissions: user.permissions || [] }); }} className="text-brand-gray hover:text-brand-gold transition-colors"><Edit2 className="w-4 h-4" /></button><button onClick={() => saveUsers(users.filter((item) => item.id !== user.id))} className="text-brand-gray hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
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
              {[['name', 'Nombre'], ['slug', 'Slug'], ['city', 'Ciudad'], ['category', 'Categoría'], ['height', 'Estatura'], ['experience', 'Experiencia'], ['languages', 'Idiomas']].map(([key, label]) => (
                <div className="space-y-2" key={key}><label className="text-[10px] uppercase tracking-widest text-brand-gray">{label}</label><input required={['name', 'slug', 'city', 'category'].includes(key)} value={(modelForm as any)[key]} onChange={(e) => setModelForm((prev) => ({ ...prev, [key]: e.target.value }))} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" /></div>
              ))}
              <label className="space-y-3 block md:col-span-2">
                <span className="text-[10px] uppercase tracking-widest text-brand-gray">Foto portada</span>
                <div className="border border-dashed border-brand-black/15 p-5 flex flex-col gap-4 items-start">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-[10px] uppercase tracking-widest border border-brand-black/10 px-4 py-3 hover:bg-brand-black hover:text-brand-ivory transition-all"><Upload className="w-4 h-4" />Agregar portada<input type="file" accept="image/*" className="hidden" onChange={(e) => handleCoverUpload(e.target.files)} /></label>
                  {coverPreview && <img src={coverPreview} alt="Portada" className="w-32 h-44 object-cover rounded-sm border border-brand-black/10" />}
                </div>
              </label>
              <div className="space-y-2 md:col-span-2"><label className="text-[10px] uppercase tracking-widest text-brand-gray">Descripción corta</label><input value={modelForm.short_desc} onChange={(e) => setModelForm((prev) => ({ ...prev, short_desc: e.target.value }))} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" /></div>
              <div className="space-y-2 md:col-span-2"><label className="text-[10px] uppercase tracking-widest text-brand-gray">Descripción completa</label><textarea value={modelForm.full_desc} onChange={(e) => setModelForm((prev) => ({ ...prev, full_desc: e.target.value }))} rows={4} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold resize-none" /></div>
              <div className="space-y-2 md:col-span-2"><label className="text-[10px] uppercase tracking-widest text-brand-gray">Etiquetas (separadas por coma)</label><input value={modelForm.tags} onChange={(e) => setModelForm((prev) => ({ ...prev, tags: e.target.value }))} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" /></div>
              <label className="inline-flex items-center gap-3 text-sm md:col-span-2"><input type="checkbox" checked={modelForm.featured} onChange={(e) => setModelForm((prev) => ({ ...prev, featured: e.target.checked }))} /> Mostrar como modelo destacada en inicio</label>
            </div>

            <div className="space-y-4 border border-brand-black/5 p-6">
              <div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-[0.35em] text-brand-gold">Carrusel</p><h3 className="text-xl font-serif mt-2">Orden de fotos</h3><p className="text-sm text-brand-gray mt-2">Arrastra y suelta para cambiar el orden.</p></div><label className="inline-flex items-center gap-2 cursor-pointer text-[10px] uppercase tracking-widest border border-brand-black/10 px-3 py-2 hover:bg-brand-black hover:text-brand-ivory transition-all"><Upload className="w-4 h-4" />Agregar foto<input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleGalleryUpload(e.target.files)} /></label></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {galleryDraft.length === 0 && <p className="text-sm text-brand-gray">Aún no hay fotos adicionales. La portada será la primera imagen del popup.</p>}
                {galleryDraft.map((image, index) => (
                  <div key={`gallery-${index}`} draggable onDragStart={() => setDraggedGalleryIndex(index)} onDragOver={(e) => e.preventDefault()} onDrop={() => {
                    if (draggedGalleryIndex === null || draggedGalleryIndex === index) return;
                    const next = [...galleryDraft];
                    const [moved] = next.splice(draggedGalleryIndex, 1);
                    next.splice(index, 0, moved);
                    setGalleryDraft(next);
                    setDraggedGalleryIndex(null);
                  }} className="border border-brand-black/10 p-3 flex gap-3 items-center bg-white">
                    <GripVertical className="w-4 h-4 text-brand-gray shrink-0" />
                    <img src={image} alt={`Galería ${index + 1}`} className="w-20 h-28 object-cover rounded-sm border border-brand-black/10" />
                    <div className="space-y-2 flex-1"><p className="text-xs uppercase tracking-widest text-brand-gray">Foto {index + 1}</p><button type="button" onClick={() => setGalleryDraft((prev) => prev.filter((_, itemIndex) => itemIndex !== index))} className="border border-red-200 text-red-600 px-3 py-2 text-xs">Eliminar</button></div>
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg"><Save className="w-4 h-4 mr-2" />Guardar modelo</Button>
          </form>
        </div>
      </Modal>

      <Modal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)}>
        {editingLead && (
          <div className="p-10 space-y-8">
            <h2 className="text-3xl font-serif">Editar contacto</h2>
            <form onSubmit={saveLead} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-brand-gray">Nombre</label><input name="name" defaultValue={editingLead.name} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" /></div>
              <div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-brand-gray">Email</label><input name="email" defaultValue={editingLead.email} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" /></div>
              <div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-brand-gray">Teléfono</label><input name="phone" defaultValue={editingLead.phone} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" /></div>
              <div className="space-y-2"><label className="text-[10px] uppercase tracking-widest text-brand-gray">Empresa</label><input name="company" defaultValue={editingLead.company} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" /></div>
              <div className="space-y-2 md:col-span-2"><label className="text-[10px] uppercase tracking-widest text-brand-gray">Mensaje</label><textarea name="message" defaultValue={editingLead.message} rows={4} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold resize-none" /></div>
              <div className="md:col-span-2"><Button type="submit" className="w-full" size="lg">Guardar cambios</Button></div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};
