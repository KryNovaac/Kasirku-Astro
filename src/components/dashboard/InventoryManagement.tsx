import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Box, 
  Package, 
  Plus, 
  Archive, 
  ArrowLeftRight, 
  ChevronRight, 
  Loader2, 
  MoveRight, 
  MoveLeft,
  LayoutGrid,
  Info
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { cn, formatRupiah } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: number;
  warehouseStock: number;
  onShelfStock: number;
  image: string | null;
  category: { name: string } | null;
  allocations: {
    id: string;
    quantity: number;
    locationId: string;
    location: {
      id: string;
      name: string;
      capacity: number;
      _count?: { products: number };
    };
  }[];
}

interface Location {
  id: string;
  name: string;
  capacity: number;
}

export default function InventoryManagement({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refillAmount, setRefillAmount] = useState(0);

  const fetchData = async () => {
    try {
      const [prodRes, locRes] = await Promise.all([
        fetch(`/api/products/${productId}`),
        fetch('/api/locations')
      ]);
      if (prodRes.ok) setProduct(await prodRes.json());
      if (locRes.ok) setLocations(await locRes.json());
    } catch (err) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [productId]);

  const handleUpdateStock = async (newWhStock: number, isRefill: boolean) => {
    if (!product) return;
    setSubmitting(true);
    try {
        const res = await fetch('/api/products/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: product.id, 
                warehouseStock: isRefill ? (product.warehouseStock + refillAmount) : newWhStock 
            })
        });
        if (res.ok) {
            toast.success(isRefill ? 'Stok refill berhasil' : 'Stok gudang diperbarui');
            setRefillAmount(0);
            fetchData();
        }
    } catch (err) {
        toast.error('Gagal memperbarui stok');
    } finally {
        setSubmitting(false);
    }
  };

  const handleTransfer = async (direction: 'TO_SHELF' | 'TO_WAREHOUSE', amount: number, locId: string) => {
    if (amount <= 0) return toast.error('Jumlah harus lebih dari 0');
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
        toast.success('Transfer berhasil');
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.message || 'Transfer gagal');
      }
    } catch (err) {
      toast.error('Kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Mempersiapkan Inventaris...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-xl font-black text-slate-800">Produk Tidak Ditemukan</p>
        <Button onClick={() => window.history.back()} className="mt-4">Kembali</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Page */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/dashboard/products'} 
            className="rounded-2xl h-14 w-14 p-0 bg-white shadow-sm border border-slate-100 hover:shadow-md transition-all sm:flex"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-full tracking-widest border border-blue-100">Inventaris</span>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.category?.name || 'Tanpa Kategori'}</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{product.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-8 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
            <div className="text-center group">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-600 transition-colors">Total Stok</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">{product.warehouseStock + product.onShelfStock}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Unit</span>
                </div>
            </div>
            <div className="h-10 w-px bg-slate-100" />
            <div className="text-center group">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-emerald-600 transition-colors">Nilai Inventaris</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
                        {formatRupiah((product.warehouseStock + product.onShelfStock) * product.price).replace('Rp', '')}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">IDR</span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Warehouse Section */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-slate-900 border-none text-white rounded-[3rem] shadow-2xl overflow-hidden relative group">
                <div className="absolute right-0 top-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Archive className="w-40 h-40" />
                </div>
                <CardContent className="p-10 relative z-10 space-y-8">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-amber-400 shadow-inner">
                                <Archive className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black tracking-tight uppercase">Gudang Utama</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Pusat Stok & Restock</p>
                            </div>
                        </div>
                        
                        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kuantitas Saat Ini</p>
                                <p className="text-5xl font-black text-white leading-none">{product.warehouseStock}</p>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Input 
                                    type="number" 
                                    defaultValue={product.warehouseStock}
                                    onBlur={(e) => {
                                        const v = parseInt(e.target.value);
                                        if (!isNaN(v) && v !== product.warehouseStock) {
                                            handleUpdateStock(v, false);
                                        }
                                    }}
                                    className="h-12 w-20 bg-white/10 border-white/20 text-white font-black text-center rounded-xl text-lg focus:ring-amber-500"
                                />
                                <span className="text-[8px] text-center text-slate-500 font-bold uppercase">Sudur Koreksi</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Plus className="w-3 h-3 text-emerald-400" /> Refill Kuantitas
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Input 
                                type="number" 
                                value={refillAmount || ''}
                                onChange={(e) => setRefillAmount(parseInt(e.target.value) || 0)}
                                placeholder="Jumlah unit baru..."
                                className="h-14 bg-white/5 border-white/10 text-white font-black rounded-2xl placeholder:text-slate-600 focus:ring-blue-500"
                            />
                            <Button 
                                onClick={() => handleUpdateStock(0, true)}
                                disabled={submitting || refillAmount <= 0}
                                className="h-14 px-8 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                            >
                                {submitting ? <Loader2 className="animate-spin" /> : 'REFILL'}
                            </Button>
                        </div>
                        <p className="text-[9px] text-slate-500 font-medium leading-relaxed">
                            <Info className="w-3 h-3 inline mr-1 opacity-50" />
                            Semua stok hasil refill akan otomatis masuk ke Gudang Utama.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardContent className="p-8">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-blue-600" /> Ringkasan Distribusi
                    </h4>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Di Gudang</span>
                           <span className="text-xl font-black text-slate-900">{product.warehouseStock} Unit</span>
                        </div>
                        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl border border-blue-100">
                           <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Di Rak Display</span>
                           <span className="text-xl font-black text-blue-700">{product.onShelfStock} Unit</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </div>

          {/* Display Racks Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                        <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Custom Room / Rak Display</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total {product.allocations.length} Ruangan Terdaftar</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {product.allocations.map(alloc => (
                    <Card key={alloc.id} className="rounded-[2.5rem] border-2 border-slate-100 bg-white hover:border-blue-500 transition-all group shadow-sm overflow-hidden flex flex-col h-full">
                        <CardContent className="p-8 flex-1 flex flex-col justify-between space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <Box className="w-7 h-7" />
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stok Produk Ini</p>
                                    <p className="text-3xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">{alloc.quantity}</p>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">{alloc.location.name}</h4>
                                <div className="mt-4 space-y-3">
                                    <div className="flex justify-between items-baseline text-[9px] font-black uppercase tracking-widest text-slate-400 px-1">
                                        <span>Okupansi Rak</span>
                                        <span>Kapasitas {alloc.location.capacity} Unit</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full border border-slate-200/50 p-0.5 overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (alloc.quantity / alloc.location.capacity) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 pt-6 border-t border-slate-100">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Input 
                                            type="number" 
                                            placeholder="Unit" 
                                            className="h-10 text-[11px] font-black text-center rounded-xl border-slate-100 bg-slate-50 border-none"
                                            id={`toWh-${alloc.locationId}`}
                                        />
                                        <Button 
                                            variant="outline" 
                                            onClick={() => handleTransfer('TO_WAREHOUSE', Number((document.getElementById(`toWh-${alloc.locationId}`) as HTMLInputElement)?.value || 0), alloc.locationId)}
                                            className="w-full h-10 rounded-xl font-black uppercase text-[9px] tracking-widest border-slate-200 hover:bg-slate-900 hover:text-white transition-colors"
                                        >
                                            <MoveLeft className="w-3.5 h-3.5 mr-2" /> Ke Gudang
                                        </Button>
                                    </div>
                                    <div className="space-y-1">
                                        <Input 
                                            type="number" 
                                            placeholder="Unit" 
                                            className="h-10 text-[11px] font-black text-center rounded-xl border-slate-100 bg-slate-50 border-none"
                                            id={`toShelf-${alloc.locationId}`}
                                        />
                                        <Button 
                                            onClick={() => handleTransfer('TO_SHELF', Number((document.getElementById(`toShelf-${alloc.locationId}`) as HTMLInputElement)?.value || 0), alloc.locationId)}
                                            className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 font-black uppercase text-[9px] tracking-widest text-white shadow-lg shadow-blue-100"
                                        >
                                            RE-STOCK <MoveRight className="w-3.5 h-3.5 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                                <a href={`/dashboard/locations/${alloc.locationId}`} className="block">
                                    <Button variant="ghost" className="w-full h-11 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all">
                                        Menuju Custom Room <ChevronRight className="w-3.5 h-3.5 ml-2" />
                                    </Button>
                                </a>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Empty State / Add to New Room */}
                <Card className="rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-400 transition-all flex flex-col items-center justify-center p-10 gap-4 text-center cursor-pointer group" onClick={() => window.location.href = '/dashboard/locations?tab=warehouse'}>
                    <div className="w-16 h-16 bg-white rounded-[1.5rem] border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-110 transition-all shadow-sm">
                        <Plus className="w-8 h-8" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-600 group-hover:text-blue-600 transition-colors uppercase tracking-tight">Alokasikan ke Ruangan Baru</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">Pindahkan stok gudang ke rak jualan lain</p>
                    </div>
                </Card>
            </div>
          </div>
      </div>
    </div>
  );
}
