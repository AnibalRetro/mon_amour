import { useState, useEffect } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  LogOut, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  CheckCircle, 
  Clock,
  Search,
  Filter
} from 'lucide-react';
import { auth, db } from '@/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

export const AdminPortal = () => {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'models' | 'leads'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        fetchData();
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchData = async () => {
    const modelsSnap = await getDocs(query(collection(db, 'models'), orderBy('created_at', 'desc')));
    setModels(modelsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    const leadsSnap = await getDocs(query(collection(db, 'leads'), orderBy('created_at', 'desc')));
    setLeads(leadsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const seedData = async () => {
    const sampleModels = [
      { name: 'Amélie Laurent', slug: 'amelie-laurent', city: 'Paris', category: 'High Fashion', cover: 'https://picsum.photos/seed/model1/800/1200', short_desc: 'Elegancia parisina pura.', full_desc: 'Amélie es una modelo de alta costura con experiencia en las pasarelas más importantes de Europa.', height: '178cm', active: true, tags: ['paris', 'fashion', 'runway'] },
      { name: 'Isabella Rossi', slug: 'isabella-rossi', city: 'Milan', category: 'Editorial', cover: 'https://picsum.photos/seed/model2/800/1200', short_desc: 'La esencia del estilo italiano.', full_desc: 'Isabella destaca por su versatilidad en sesiones editoriales y campañas de lujo.', height: '175cm', active: true, tags: ['milan', 'editorial', 'style'] },
      { name: 'Elena Vance', slug: 'elena-vance', city: 'New York', category: 'Commercial', cover: 'https://picsum.photos/seed/model3/800/1200', short_desc: 'Energía y carisma neoyorquino.', full_desc: 'Elena es la cara perfecta para marcas comerciales que buscan frescura y profesionalismo.', height: '172cm', active: true, tags: ['nyc', 'commercial', 'beauty'] },
    ];

    for (const model of sampleModels) {
      await addDoc(collection(db, 'models'), {
        ...model,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
    }
    fetchData();
    alert("Datos de muestra creados con éxito.");
  };

  const handleSaveModel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    const modelData = {
      ...data,
      active: true,
      gallery: [],
      tags: (data.tags as string).split(',').map(t => t.trim()),
      updated_at: serverTimestamp(),
    };

    try {
      if (editingModel) {
        await updateDoc(doc(db, 'models', editingModel.id), modelData);
      } else {
        await addDoc(collection(db, 'models'), {
          ...modelData,
          created_at: serverTimestamp(),
        });
      }
      setIsModelModalOpen(false);
      setEditingModel(null);
      fetchData();
    } catch (error) {
      console.error("Error saving model:", error);
    }
  };

  const handleDeleteModel = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este perfil?")) {
      await deleteDoc(doc(db, 'models', id));
      fetchData();
    }
  };

  const handleUpdateLeadStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, 'leads', id), { status });
    fetchData();
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-brand-ivory"><div className="w-12 h-12 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" /></div>;

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-brand-black p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-brand-ivory p-12 max-w-md w-full text-center space-y-8 premium-shadow"
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-serif">Acceso Administrativo</h1>
            <p className="text-brand-gray text-sm font-light">Inicia sesión para gestionar Maison de Grâce.</p>
          </div>
          <Button onClick={handleLogin} className="w-full" size="lg">Entrar con Google</Button>
          <p className="text-[10px] uppercase tracking-widest text-brand-gray">Solo personal autorizado</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-black text-brand-ivory flex flex-col shrink-0">
        <div className="p-8 border-b border-white/10">
          <h2 className="text-xl font-serif tracking-widest uppercase">Maison Admin</h2>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'models', icon: Users, label: 'Modelos' },
            { id: 'leads', icon: MessageSquare, label: 'Leads / Solicitudes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center space-x-4 px-4 py-3 text-sm transition-all",
                activeTab === tab.id ? "bg-brand-gold text-brand-black" : "hover:bg-white/5"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center space-x-4 text-brand-gray hover:text-brand-ivory transition-colors text-sm">
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-serif capitalize">{activeTab}</h1>
          <div className="flex items-center space-x-4">
            <Button onClick={seedData} variant="outline" size="sm">Seed Data</Button>
            <span className="text-xs text-brand-gray font-medium">{user.email}</span>
            <img src={user.photoURL} className="w-8 h-8 rounded-full border border-brand-gold" alt="Avatar" />
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Modelos Activas', value: models.length, icon: Users, color: 'text-blue-600' },
                { label: 'Leads Totales', value: leads.length, icon: MessageSquare, color: 'text-brand-gold' },
                { label: 'Nuevas Solicitudes', value: leads.filter(l => l.status === 'new').length, icon: Clock, color: 'text-orange-600' },
                { label: 'Bookings Cerrados', value: leads.filter(l => l.status === 'closed').length, icon: CheckCircle, color: 'text-green-600' },
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 premium-shadow space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                    <span className="text-3xl font-serif">{stat.value}</span>
                  </div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-gray font-semibold">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-white p-8 premium-shadow space-y-6">
                <h3 className="text-lg font-serif">Solicitudes Recientes</h3>
                <div className="space-y-4">
                  {leads.slice(0, 5).map((lead) => (
                    <div key={lead.id} className="flex justify-between items-center p-4 bg-brand-ivory/50 border border-brand-black/5">
                      <div>
                        <p className="text-sm font-medium">{lead.name}</p>
                        <p className="text-[10px] text-brand-gray uppercase tracking-widest">{lead.type}</p>
                      </div>
                      <span className={cn(
                        "text-[8px] uppercase tracking-widest px-2 py-1 rounded",
                        lead.status === 'new' ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
                      )}>
                        {lead.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white p-8 premium-shadow space-y-6">
                <h3 className="text-lg font-serif">Nuevos Talentos</h3>
                <div className="space-y-4">
                  {models.slice(0, 5).map((model) => (
                    <div key={model.id} className="flex items-center space-x-4 p-4 bg-brand-ivory/50 border border-brand-black/5">
                      <img src={model.cover} className="w-10 h-10 object-cover" alt={model.name} />
                      <div>
                        <p className="text-sm font-medium">{model.name}</p>
                        <p className="text-[10px] text-brand-gray uppercase tracking-widest">{model.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray" />
                <input type="text" placeholder="Buscar modelo..." className="w-full bg-white border border-brand-black/5 px-12 py-3 text-sm focus:outline-none" />
              </div>
              <Button onClick={() => { setEditingModel(null); setIsModelModalOpen(true); }} className="space-x-2">
                <Plus className="w-4 h-4" />
                <span>Agregar Modelo</span>
              </Button>
            </div>

            <div className="bg-white premium-shadow overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-brand-black text-brand-ivory text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="p-6">Modelo</th>
                    <th className="p-6">Categoría</th>
                    <th className="p-6">Ciudad</th>
                    <th className="p-6">Estado</th>
                    <th className="p-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-black/5">
                  {models.map((model) => (
                    <tr key={model.id} className="hover:bg-brand-ivory/50 transition-colors">
                      <td className="p-6 flex items-center space-x-4">
                        <img src={model.cover} className="w-12 h-16 object-cover" alt={model.name} />
                        <span className="font-medium">{model.name}</span>
                      </td>
                      <td className="p-6 text-sm text-brand-gray">{model.category}</td>
                      <td className="p-6 text-sm text-brand-gray">{model.city}</td>
                      <td className="p-6">
                        <span className="text-[10px] uppercase tracking-widest bg-green-100 text-green-600 px-2 py-1 rounded">Activo</span>
                      </td>
                      <td className="p-6 text-right space-x-4">
                        <button onClick={() => { setEditingModel(model); setIsModelModalOpen(true); }} className="text-brand-gray hover:text-brand-gold transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteModel(model.id)} className="text-brand-gray hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="flex space-x-4">
                <button className="bg-white px-4 py-2 text-[10px] uppercase tracking-widest border border-brand-black/5 hover:bg-brand-black hover:text-brand-ivory transition-all">Todos</button>
                <button className="bg-white px-4 py-2 text-[10px] uppercase tracking-widest border border-brand-black/5 hover:bg-brand-black hover:text-brand-ivory transition-all">Nuevos</button>
                <button className="bg-white px-4 py-2 text-[10px] uppercase tracking-widest border border-brand-black/5 hover:bg-brand-black hover:text-brand-ivory transition-all">Comercial</button>
                <button className="bg-white px-4 py-2 text-[10px] uppercase tracking-widest border border-brand-black/5 hover:bg-brand-black hover:text-brand-ivory transition-all">Aspirantes</button>
              </div>
            </div>

            <div className="bg-white premium-shadow overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-brand-black text-brand-ivory text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="p-6">Nombre / Empresa</th>
                    <th className="p-6">Tipo</th>
                    <th className="p-6">Fecha</th>
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
                        <span className="text-[10px] uppercase tracking-widest bg-brand-black/5 px-2 py-1">{lead.type}</span>
                      </td>
                      <td className="p-6 text-sm text-brand-gray">
                        {lead.created_at?.toDate().toLocaleDateString()}
                      </td>
                      <td className="p-6">
                        <select 
                          value={lead.status} 
                          onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                          className="text-[10px] uppercase tracking-widest bg-transparent border-b border-brand-black/10 focus:outline-none"
                        >
                          <option value="new">Nuevo</option>
                          <option value="contacted">Contactado</option>
                          <option value="follow-up">Seguimiento</option>
                          <option value="closed">Cerrado</option>
                        </select>
                      </td>
                      <td className="p-6 text-right">
                        <button className="text-brand-gray hover:text-brand-gold transition-colors"><Eye className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Model Editor Modal */}
      <Modal isOpen={isModelModalOpen} onClose={() => setIsModelModalOpen(false)}>
        <div className="p-12 space-y-8">
          <h2 className="text-3xl font-serif">{editingModel ? 'Editar Modelo' : 'Nueva Modelo'}</h2>
          <form onSubmit={handleSaveModel} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-brand-gray">Nombre</label>
              <input required name="name" defaultValue={editingModel?.name} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-brand-gray">Slug (URL)</label>
              <input required name="slug" defaultValue={editingModel?.slug} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-brand-gray">Ciudad</label>
              <input required name="city" defaultValue={editingModel?.city} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-brand-gray">Categoría</label>
              <input required name="category" defaultValue={editingModel?.category} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-brand-gray">Foto Portada (URL)</label>
              <input required name="cover" defaultValue={editingModel?.cover} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-brand-gray">Estatura</label>
              <input name="height" defaultValue={editingModel?.height} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-brand-gray">Descripción Corta</label>
              <input name="short_desc" defaultValue={editingModel?.short_desc} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-brand-gray">Descripción Completa</label>
              <textarea name="full_desc" defaultValue={editingModel?.full_desc} rows={3} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold resize-none" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-brand-gray">Etiquetas (separadas por coma)</label>
              <input name="tags" defaultValue={editingModel?.tags?.join(', ')} className="w-full border-b border-brand-black/10 py-2 focus:outline-none focus:border-brand-gold" />
            </div>
            <div className="md:col-span-2 pt-6">
              <Button type="submit" className="w-full" size="lg">Guardar Cambios</Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};
