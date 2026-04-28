import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { 
  Box, 
  Plus, 
  Search, 
  Trash2, 
  Loader2, 
  ArrowLeft, 
  ArrowLeftRight,
  Package,
  MoveRight,
  MoveLeft
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  image: string | null;
  warehouseStock: number;
  onShelfStock: number;
  category: { name: string } | null;
  locationId: string | null;
}

interface Location {
  id: string;
  name: string;
  capacity: number;
  _count: {
    products: number;
  };
}

export default function LocationDetail({ locationId }: { locationId: string }) {
  const [location, setLocation] = useState<Location | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showTransfer, setShowTransfer] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const [locRes, prodRes, allLocsRes] = await Promise.all([
        fetch(`/api/locations/get?id=${locationId}`),
        fetch(`/api/products?locationId=${locationId}`),
        fetch('/api/locations')
      ]);

      if (locRes.ok) setLocation(await locRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (allLocsRes.ok) setAllLocations(await allLocsRes.json());
    } catch (err) {
      toast.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [locationId]);

  const calculateUsage = (loc: any) => {
    // This would ideally come from the API as a summary
    // For now we use the data we have or fetch it
    return 0; // Simplified for now
  };

  const handleTransfer = async (productId: string, direction: 'TO_SHELF' | 'TO_WAREHOUSE', amount: number, targetLocId?: string) => {
    if (amount <= 0) return toast.error('Jumlah harus lebih dari 0');
    setSubmitting(true);
    try {
      const res = await fetch('/api/locations/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          locationId: targetLocId || locationId,
          amount,
          direction
        })
      });

      if (res.ok) {
        toast.success('Stok berhasil dipindahkan');
        fetchData();
        setShowTransfer(false);
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

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-400 font-bold animate-pulse">Menghubungkan ke Rak...</p>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="text-center py-20">
        <p className="text-xl font-bold text-slate-800">Lokasi tidak ditemukan</p>
        <Button onClick={() => window.location.href = '/dashboard/locations'} className="mt-4">Kembali</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <a href="/dashboard/locations">
          <Button variant="ghost" className="rounded-xl h-12 w-12 p-0 bg-white shadow-sm hover:shadow-md transition-all">
            <ArrowLeft className="w-6 h-6" />
          </Button>
        </a>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{location.name}</h2>
          <p className="text-sm text-slate-500 font-medium">Monitoring stok dan alokasi unit pada rak ini.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-none text-white rounded-[2rem] shadow-xl overflow-hidden relative">
          <div className="absolute right-0 top-0 p-8 opacity-10">
            <Box className="w-24 h-24" />
          </div>
          <CardContent className="p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Jenis Produk</p>
            <h3 className="text-4xl font-black mt-2">{products.length}</h3>
            <p className="text-sm text-slate-400 mt-2">Item Terdisplay</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 rounded-[2rem] shadow-sm">
          <CardContent className="p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Kapasitas Rak</p>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm font-bold">
                <span className="text-slate-800">{products.reduce((acc, p) => acc + p.onShelfStock, 0)} Unit</span>
                <span className="text-slate-400">/ {location.capacity} Unit</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-1000" 
                  style={{ width: `${Math.min(100, (products.reduce((acc, p) => acc + p.onShelfStock, 0) / location.capacity) * 100)}%` }} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 rounded-[2rem] shadow-sm">
          <CardContent className="p-8 flex flex-col justify-center h-full">
            <a href="/dashboard/locations?tab=warehouse">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-50">
                <Plus className="w-4 h-4 mr-2" /> Alokasi Baru
                </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-slate-200 shadow-sm overflow-hidden bg-white">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
          <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Produk dalam Rak</h4>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk..." 
                className="pl-10 h-11 rounded-xl border-slate-200 bg-white" 
            />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5">Produk</th>
                  <th className="px-8 py-5 text-center">Stok Display</th>
                  <th className="px-8 py-5 text-center">Stok Gudang</th>
                  <th className="px-8 py-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
                          {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <Package className="w-7 h-7 text-slate-200" />}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{p.category?.name || 'Tanpa Kategori'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <div className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-black text-sm border border-blue-100">
                        {p.onShelfStock} Unit
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center text-xs font-bold text-slate-400">
                      {p.warehouseStock} Unit
                    </td>
                    <td className="px-8 py-4 text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl h-10 px-4 font-bold text-[10px] uppercase tracking-widest gap-2 border-slate-200 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                        onClick={() => { setSelectedProduct(p); setShowTransfer(true); }}
                      >
                        <ArrowLeftRight className="w-4 h-4" /> Atur Stok
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showTransfer && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <Card className="w-full max-w-lg border-none shadow-3xl rounded-[3rem] overflow-hidden animate-in zoom-in-95 duration-200 bg-white">
            <div className="bg-slate-900 p-8 text-white relative">
              <h3 className="text-xl font-black tracking-tight uppercase">Transfer Stok</h3>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Produk: {selectedProduct.name}</p>
            </div>
            <CardContent className="p-8 space-y-8">
              <div className="flex justify-between items-center p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gudang Utama</p>
                  <p className="text-2xl font-black text-slate-800">{selectedProduct.warehouseStock}</p>
                </div>
                <ArrowLeftRight className="w-6 h-6 text-slate-200 animate-pulse" />
                <div className="text-center space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{location.name}</p>
                  <p className="text-2xl font-black text-blue-600">{selectedProduct.onShelfStock}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4 p-6 border-2 border-blue-50 rounded-3xl hover:border-blue-200 transition-all text-center group">
                  <div className="flex items-center justify-center gap-2 text-blue-600 mb-2 group-hover:scale-110 transition-transform">
                    <MoveRight className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase">Pindah ke Rak</span>
                  </div>
                  
                  <div className="space-y-3">
                    {allLocations.length > 1 && (
                        <select 
                            id="transferLocId"
                            defaultValue={locationId}
                            className="w-full h-11 rounded-xl border-2 border-slate-100 bg-white px-3 text-xs font-bold outline-none focus:border-blue-600"
                        >
                            {allLocations.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    )}
                    <Input type="number" id="toShelfAmt" placeholder="Unit" className="h-11 rounded-xl font-black text-center bg-slate-50 border-none" />
                  </div>

                  <Button 
                    onClick={() => handleTransfer(selectedProduct.id, 'TO_SHELF', Number((document.getElementById('toShelfAmt') as HTMLInputElement)?.value || 0), (document.getElementById('transferLocId') as HTMLSelectElement)?.value || locationId)}
                    className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-11 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-100"
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Transfer'}
                  </Button>
                </div>

                <div className="space-y-4 p-6 border-2 border-slate-50 rounded-3xl hover:border-slate-200 transition-all text-center group">
                  <div className="flex items-center justify-center gap-2 text-slate-400 mb-2 group-hover:scale-110 transition-transform">
                    <MoveLeft className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-tight">Balik ke Gudang</span>
                  </div>
                  <Input type="number" id="toWhAmt" placeholder="Unit" className="h-11 rounded-xl font-black text-center bg-slate-50 border-none" />
                  <Button 
                    onClick={() => handleTransfer(selectedProduct.id, 'TO_WAREHOUSE', Number((document.getElementById('toWhAmt') as HTMLInputElement)?.value || 0))} 
                    variant="outline" 
                    className="w-full border-slate-200 hover:border-slate-900 hover:bg-slate-900 hover:text-white rounded-xl h-11 font-black uppercase text-[10px] tracking-widest"
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Kembalikan'}
                  </Button>
                </div>
              </div>

              <Button variant="ghost" onClick={() => setShowTransfer(false)} className="w-full h-12 rounded-xl text-slate-400 font-bold uppercase text-[10px]">Tutup Jendela</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
