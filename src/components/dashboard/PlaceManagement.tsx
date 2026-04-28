import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Warehouse, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Loader2, 
  LayoutGrid, 
  ChevronRight,
  PackageCheck,
  Activity,
  AlertTriangle,
  MoveRight,
  MoveLeft,
  ArrowLeftRight,
  Package,
  ArrowLeft,
  Box,
  CornerDownRight
} from 'lucide-react';
import { cn, formatRupiah } from '@/lib/utils';
import { toast } from 'sonner';
import CustomSelect from '../ui/CustomSelect';

interface Location {
  id: string;
  name: string;
  capacity: number;
  _count: {
    products: number;
  };
  products: {
    onShelfStock: number;
    categoryId: string | null;
  }[];
}

export default function PlaceManagement() {
  const [activeTab, setActiveTab] = useState<'LOCATIONS' | 'WAREHOUSE'>('WAREHOUSE');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Detail View States
  const [viewingLoc, setViewingLoc] = useState<Location | null>(null);
  const [locProducts, setLocProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Warehouse States
  const [warehouseProducts, setWarehouseProducts] = useState<any[]>([]);
  const [allocatingProduct, setAllocatingProduct] = useState<any>(null);
  const [targetLocId, setTargetLocId] = useState<string>('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'LOCATION' | 'PRODUCT' | null>(null);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) setLocations(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocProducts = async (locId: string) => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/products?locationId=${locId}`);
      if (res.ok) setLocProducts(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchWarehouseProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products?onlyWarehouse=true');
      if (res.ok) setWarehouseProducts(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    // Deep linking support
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
        setSearch(searchParam);
        setActiveTab('LOCATIONS');
    }

    fetchLocations();
    if (activeTab === 'WAREHOUSE') fetchWarehouseProducts();
  }, [activeTab]);

  const handleViewDetail = (loc: Location) => {
    window.location.href = `/dashboard/locations/${loc.id}`;
  };

  const handleTransfer = async (productId: string, direction: 'TO_SHELF' | 'TO_WAREHOUSE', amount: number, locId?: string) => {
    if (amount <= 0) return toast.error('Jumlah harus lebih dari 0');
    if (direction === 'TO_SHELF' && !locId) return toast.error('Pilih lokasi tujuan');

    // Capacity Check
    if (direction === 'TO_SHELF') {
      const targetLoc = locations.find(l => l.id === locId);
      if (targetLoc) {
        const { used } = calculateUsage(targetLoc);
        const remaining = targetLoc.capacity - used;
        if (amount > remaining) {
          return toast.error(`Kapasitas tidak mencukupi. Sisa ruang: ${remaining} unit.`);
        }
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/locations/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          locationId: locId,
          amount,
          direction
        })
      });
      if (res.ok) {
        toast.success('Stok berhasil dipindahkan');
        if (viewingLoc) fetchLocProducts(viewingLoc.id);
        if (activeTab === 'WAREHOUSE') fetchWarehouseProducts();
        fetchLocations();
        setShowTransfer(false);
        setAllocatingProduct(null);
        setTargetLocId('');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Gagal memindahkan stok');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteWarehouseProduct = (productId: string) => {
      setDeleteId(productId);
      setDeleteType('PRODUCT');
  };

  const confirmDelete = async () => {
    if (!deleteId || !deleteType) return;
    setSubmitting(true);
    try {
        const url = deleteType === 'PRODUCT' ? `/api/products/delete?id=${deleteId}` : '/api/locations/delete';
        const method = deleteType === 'PRODUCT' ? 'DELETE' : 'POST';
        const body = deleteType === 'LOCATION' ? JSON.stringify({ id: deleteId }) : null;

        const res = await fetch(url, {
            method,
            ...(body && { body, headers: { 'Content-Type': 'application/json' } })
        });

        if (res.ok) {
            toast.success(deleteType === 'PRODUCT' ? 'Produk dihapus' : 'Lokasi dihapus');
            if (deleteType === 'LOCATION') fetchLocations();
            else fetchWarehouseProducts();
            setDeleteId(null);
            setDeleteType(null);
        } else {
            const err = await res.json();
            toast.error(err.message || 'Gagal menghapus');
        }
    } catch (err) {
        toast.error('Terjadi kesalahan');
    } finally {
        setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      capacity: formData.get('capacity'),
    };

    try {
      const url = editingLoc ? '/api/locations/update' : '/api/locations/create';
      const body = editingLoc ? { ...data, id: editingLoc.id } : data;
      
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        setShowModal(false);
        setEditingLoc(null);
        fetchLocations();
        toast.success('Lokasi berhasil disimpan');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setDeleteType('LOCATION');
  };

  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(search.toLowerCase())
  );

  const calculateUsage = (loc: Location) => {
    const used = loc.products?.reduce((acc, curr) => acc + (curr.onShelfStock || 0), 0) || 0;
    const percentage = Math.min(Math.round((used / loc.capacity) * 100), 100);
    return { used, percentage };
  };

  return (
    <div className="space-y-8">
      {/* Header & View Switcher */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-2 border-b border-slate-100">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-blue-100">
              <Warehouse className="w-7 h-7" />
            </div>
            Manajemen Logistik
          </h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 ml-1">Flow: Warehouse <ArrowLeftRight className="w-3 h-3 inline mx-1" /> Rack Space</p>
        </div>

        <div className="bg-slate-100 p-1.5 rounded-3xl flex gap-1 w-full lg:w-auto shadow-inner">
            <Button 
                variant={activeTab === 'LOCATIONS' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('LOCATIONS')}
                className={cn(
                    "flex-1 lg:flex-none rounded-xl h-12 px-8 font-black text-[10px] uppercase tracking-[2px] transition-all",
                    activeTab === 'LOCATIONS' ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-900"
                )}
            >
                <LayoutGrid className="w-4 h-4 mr-2" /> Tempat & Rak
            </Button>
            <Button 
                variant={activeTab === 'WAREHOUSE' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('WAREHOUSE')}
                className={cn(
                    "flex-1 lg:flex-none rounded-xl h-12 px-8 font-black text-[10px] uppercase tracking-[2px] transition-all",
                    activeTab === 'WAREHOUSE' ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-900"
                )}
            >
                <Warehouse className="w-4 h-4 mr-2" /> Gudang Utama
            </Button>
        </div>
      </div>

      {activeTab === 'LOCATIONS' ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-slate-900 border-none text-white rounded-[2.5rem] shadow-2xl shadow-slate-200 overflow-hidden relative col-span-1 md:col-span-2">
                    <div className="absolute right-0 top-0 p-8 opacity-10">
                        <LayoutGrid className="w-40 h-40" />
                    </div>
                    <CardContent className="p-12">
                        <p className="text-[10px] font-black uppercase tracking-[4px] text-blue-400">Total Unit Terdisplay</p>
                        <h3 className="text-6xl font-black mt-6 tracking-tighter flex items-end gap-3">
                            {locations.reduce((acc, loc) => acc + calculateUsage(loc).used, 0)}
                            <span className="text-lg font-black text-slate-500 uppercase tracking-widest pb-2">Unit</span>
                        </h3>
                        <p className="text-sm text-slate-400 mt-6 font-bold leading-relaxed max-w-sm opacity-80 uppercase tracking-tighter">Produk yang telah dialokasikan ke rak jualan.</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none rounded-[2.5rem] shadow-sm col-span-1 border-2 border-slate-50">
                    <CardContent className="p-10 flex flex-col justify-center h-full text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Ruangan</p>
                        <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{locations.length}</h4>
                        <p className="text-[9px] font-black text-blue-600 uppercase mt-4 tracking-[3px]">Active Space</p>
                    </CardContent>
                </Card>

                <Card className="bg-blue-600 border-none text-white rounded-[2.5rem] shadow-2xl shadow-blue-200 flex items-center justify-center cursor-pointer hover:bg-slate-900 transition-all duration-500 group" onClick={() => setShowModal(true)}>
                    <CardContent className="p-0 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-90 transition-all duration-500">
                            <Plus className="w-8 h-8" />
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-[3px]">Tambah Space</span>
                    </CardContent>
                </Card>
              </div>

              <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="relative flex-1 group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                      <Input 
                          placeholder="Cari nama rak, tempat, atau ruangan jualan..." 
                          className="pl-16 h-16 rounded-[2rem] border-2 border-slate-100 bg-white shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 text-sm font-bold transition-all placeholder:text-slate-300"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                      />
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredLocations.map(loc => {
                  const { used, percentage } = calculateUsage(loc);
                  const isFull = percentage >= 90;
                  return (
                    <Card key={loc.id} className="bg-white border-2 border-slate-100 rounded-[3rem] hover:border-blue-600 transition-all group overflow-hidden shadow-sm hover:shadow-2xl relative">
                      <CardContent className="p-0">
                        <div className="p-10 space-y-8">
                            <div className="flex items-start justify-between">
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 group-hover:scale-110",
                                    isFull ? "bg-rose-50 text-rose-500" : "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600"
                                )}>
                                    <Box className="w-8 h-8" />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingLoc(loc); setShowModal(true); }} className="h-10 w-10 rounded-xl hover:bg-blue-50 text-slate-200 hover:text-blue-600">
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-10 w-10 rounded-xl hover:bg-rose-50 text-slate-200 hover:text-rose-600"
                                        onClick={(e) => { e.stopPropagation(); handleDelete(loc.id); }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-tight tracking-tight">{loc.name}</h4>
                                <div className="flex items-center gap-2 mt-3">
                                    <div className={cn("w-2 h-2 rounded-full", isFull ? "bg-rose-500" : "bg-emerald-500 animate-pulse")} />
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-widest",
                                        isFull ? "text-rose-500" : "text-emerald-600"
                                    )}>
                                        {isFull ? "Penuh / Kritis" : "Slot Tersedia"}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Okupansi Rak Display</span>
                                    <span className="text-base font-black text-slate-900 tracking-tighter">{used} <span className="text-[9px] text-slate-400 uppercase tracking-widest ml-1">Limit {loc.capacity}</span></span>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/50">
                                    <div 
                                        className={cn("h-full rounded-full transition-all duration-1000", isFull ? 'bg-rose-500 shadow-lg shadow-rose-200' : 'bg-blue-600 shadow-lg shadow-blue-200')}
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50/50 p-6 border-t border-slate-100">
                            <Button 
                                onClick={() => handleViewDetail(loc)}
                                className="w-full bg-white text-slate-900 border-2 border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 rounded-[1.5rem] h-14 font-black uppercase text-[10px] tracking-[2px] transition-all"
                            >
                                Detail Inventaris <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between p-12 bg-slate-900 rounded-[3rem] text-white overflow-hidden relative shadow-2xl shadow-slate-200">
                <div className="z-10">
                    <p className="text-[10px] font-black uppercase tracking-[5px] text-blue-500 mb-2">Transit Inventory</p>
                    <h3 className="text-4xl font-black tracking-tighter">Gudang Utama</h3>
                    <p className="text-slate-400 font-medium mt-4 max-w-md text-sm leading-relaxed">Produk baru masuk. Lakukan alokasi unit dari sini ke rak-rak spesifik untuk mulai melayani transaksi penjualan.</p>
                </div>
                <div className="z-10">
                    <a href="/dashboard/products/add">
                        <Button className="bg-blue-600 hover:bg-blue-700 h-16 rounded-4xl px-10 font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-blue-500/20">
                            <Plus className="w-5 h-5 mr-3" /> Tambah Baru
                        </Button>
                    </a>
                </div>
                <PackageCheck className="w-56 h-56 absolute -right-10 -top-10 text-white/5 rotate-12" />
            </div>

            <Card className="rounded-[3rem] border-none shadow-sm overflow-hidden bg-white border-2 border-slate-100">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-slate-100">
                                <tr>
                                    <th className="px-12 py-8">Identitas Produk</th>
                                    <th className="px-10 py-8 text-center">Stok Belum Terbagi</th>
                                    <th className="px-10 py-8 text-center">Default Slot</th>
                                    <th className="px-12 py-8 text-right">Manajemen Alur</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadingProducts ? (
                                    <tr><td colSpan={4} className="py-24 text-center"><Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" /></td></tr>
                                ) : warehouseProducts.map(p => (
                                    <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-12 py-8">
                                            <div className="flex items-center gap-6">
                                                <div className="w-20 h-20 rounded-[2rem] bg-white border-2 border-slate-50 shadow-sm flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                                                    {p.image ? <img src={p.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Box className="w-10 h-10 text-slate-100" />}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 text-xl tracking-tight">{p.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[2px] mt-2 bg-slate-100 px-3 py-1 rounded-full inline-block">{p.category?.name || 'UMKM Inventory'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className="text-3xl font-black text-slate-900 tracking-tighter">{p.warehouseStock}</span>
                                                <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest mt-1">Units In Warehouse</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                                                {p.location?.name || <span className="text-slate-300 italic">No Target</span>}
                                            </span>
                                        </td>
                                        <td className="px-12 py-8 text-right">
                                            <div className="flex justify-end gap-3">
                                                <Button 
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteWarehouseProduct(p.id)}
                                                    className="h-14 w-14 rounded-[1.5rem] hover:bg-rose-50 text-slate-200 hover:text-rose-600 transition-all border-2 border-transparent"
                                                >
                                                    <Trash2 className="w-6 h-6" />
                                                </Button>
                                                <Button 
                                                    onClick={() => setAllocatingProduct(p)}
                                                    className="bg-slate-900 hover:bg-blue-600 rounded-[1.5rem] h-14 px-10 font-black uppercase text-[10px] tracking-[2px] shadow-2xl shadow-slate-200 transition-all group/btn"
                                                >
                                                    <CornerDownRight className="w-4 h-4 mr-3 group-hover/btn:translate-x-1 group-hover/btn:translate-y-1 transition-transform" /> Distribusikan
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {warehouseProducts.length === 0 && !loadingProducts && (
                                    <tr>
                                        <td colSpan={4} className="py-32 text-center">
                                            <div className="opacity-20 flex flex-col items-center">
                                                <PackageCheck className="w-24 h-24 mb-6" />
                                                <p className="font-black uppercase tracking-[4px] text-xs">Gudang Kosong / Bersih</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Allocation Modal */}
      {allocatingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
          <Card className="w-full max-w-xl border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] rounded-[4rem] overflow-hidden animate-in zoom-in-95 duration-500 bg-white">
            <div className="bg-slate-900 p-12 text-white relative overflow-hidden">
              <h3 className="text-3xl font-black tracking-tight relative z-10">Alokasi Stok</h3>
              <p className="text-slate-400 font-bold mt-3 text-sm relative z-10 uppercase tracking-widest opacity-80">Distribusikan <span className="text-blue-500">{allocatingProduct.name}</span></p>
              <Box className="w-40 h-40 absolute right-[-20px] bottom-[-20px] text-white/5 rotate-12" />
            </div>
            <CardContent className="p-12 space-y-10">
              <div className="grid grid-cols-1 gap-10">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[3px] text-slate-400 ml-2">Pilih Rak / Ruangan Display</Label>
                  <CustomSelect 
                    placeholder="Pilih lokasi tujuan..."
                    options={locations.map(l => {
                      const { used } = calculateUsage(l);
                      const remaining = l.capacity - used;
                      return {
                        id: l.id,
                        name: l.name,
                        meta: remaining <= 0 ? 'Penuh' : `Tersedia ${remaining} unit`
                      };
                    })}
                    value={targetLocId}
                    onChange={setTargetLocId}
                    icon={<LayoutGrid />}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center ml-2">
                    <Label className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Jumlah Unit Transfer</Label>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Gudang: {allocatingProduct.warehouseStock}</span>
                  </div>
                  <Input 
                    type="number" 
                    id="allocAmt" 
                    defaultValue={allocatingProduct.warehouseStock} 
                    className="h-20 rounded-[2rem] font-black text-3xl bg-slate-50 border-none focus:ring-4 focus:ring-blue-500/5 text-center shadow-inner tracking-tighter" 
                  />
                </div>
              </div>

              <div className="flex gap-6">
                <Button variant="ghost" onClick={() => { setAllocatingProduct(null); setTargetLocId(''); }} className="flex-1 h-16 rounded-[2rem] font-black uppercase tracking-[2px] text-[10px] text-slate-400 hover:bg-slate-50">Batal</Button>
                <Button 
                  onClick={() => handleTransfer(allocatingProduct.id, 'TO_SHELF', Number((document.getElementById('allocAmt') as HTMLInputElement)?.value || 0), targetLocId)}
                  className="flex-2 bg-blue-600 hover:bg-blue-700 h-16 rounded-[2rem] px-10 font-black uppercase tracking-[3px] text-[11px] shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="animate-spin w-5 h-5" /> : (
                    <>
                      Proses Distribusi <CornerDownRight className="w-5 h-5 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md">
          <Card className="w-full max-w-sm border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] rounded-[3.5rem] overflow-hidden bg-white animate-in zoom-in-95 duration-300">
            <div className="bg-rose-600 p-10 text-white text-center relative overflow-hidden">
              <div className="w-20 h-20 bg-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-4 border-rose-400/50 shadow-xl relative z-10">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-[3px] relative z-10">Konfirmasi Hapus</h3>
              <p className="text-rose-100 text-[10px] font-black mt-4 uppercase tracking-[2px] relative z-10 leading-relaxed opacity-80">
                {deleteType === 'LOCATION' 
                  ? 'Space / Rak ini akan dihapus. Hubungan produk dengan lokasi ini akan terputus.' 
                  : 'Produk akan dihapus permanen dari seluruh sistem gudang & rak.'}
              </p>
              <Trash2 className="w-40 h-40 absolute right-[-40px] bottom-[-40px] text-white/5 rotate-12" />
            </div>
            <CardContent className="p-10 flex flex-col gap-3">
              <Button variant="ghost" onClick={() => { setDeleteId(null); setDeleteType(null); }} className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-[2px] text-slate-400">Batalkan Saja</Button>
              <Button 
                onClick={confirmDelete}
                className="h-14 rounded-2xl bg-slate-900 hover:bg-rose-600 font-black uppercase text-[10px] tracking-[2px] text-white shadow-2xl shadow-slate-200 transition-all active:scale-[0.98]"
                disabled={submitting}
              >
                {submitting ? <Loader2 className="animate-spin w-5 h-5 mx-auto" /> : 'Ya, Hapus Sekarang'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Location Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-lg">
          <Card className="w-full max-w-lg border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] rounded-[4rem] overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="bg-blue-600 p-12 text-white relative">
              <h3 className="text-3xl font-black tracking-tighter">{editingLoc ? 'Update Space' : 'New Custom Space'}</h3>
              <p className="text-[10px] text-blue-100 mt-3 uppercase tracking-[4px] font-black opacity-80">Konfigurasi Unit Penyimpanan</p>
              <Box className="w-32 h-32 absolute right-[-10px] bottom-[-10px] text-white/5 -rotate-12" />
            </div>
            <CardContent className="p-12 bg-white space-y-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-2">Display Name / Label</Label>
                  <Input 
                    name="name" 
                    defaultValue={editingLoc?.name} 
                    placeholder="Contoh: Showcase Depan / Rak A" 
                    className="h-16 rounded-[1.5rem] bg-slate-50 border-none focus:ring-4 focus:ring-blue-500/5 font-black text-lg px-6"
                    required 
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] ml-2">Limit Kapasitas Point (Unit)</Label>
                  <Input 
                    name="capacity" 
                    type="number" 
                    defaultValue={editingLoc?.capacity} 
                    placeholder="100" 
                    className="h-16 rounded-[1.5rem] bg-slate-50 border-none focus:ring-4 focus:ring-blue-500/5 font-black text-lg px-6"
                    required 
                  />
                </div>
                <div className="flex gap-6 pt-6">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => { setShowModal(false); setEditingLoc(null); }}
                    className="flex-1 h-16 rounded-[1.5rem] font-black uppercase tracking-[2px] text-[10px] text-slate-400"
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={submitting}
                    className="flex-1 h-16 rounded-[1.5rem] bg-slate-900 border-none hover:bg-blue-600 font-black uppercase tracking-[2px] text-[10px] text-white shadow-2xl shadow-blue-100 transition-all"
                  >
                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Simpan Data'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )}
</div>
  );
}
