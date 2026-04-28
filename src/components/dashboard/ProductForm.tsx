import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import { Loader2, Upload, X, Image as ImageIcon, Plus, Package, Calendar, CornerDownRight, LayoutGrid, Tag, MapPin } from 'lucide-react';
import CustomSelect from '../ui/CustomSelect';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  warehouseStock: number;
  onShelfStock: number;
  image?: string | null;
  description?: string | null;
  categoryId?: string | null;
  locationId?: string | null;
}

interface Props {
  initialData?: Product;
  isEdit?: boolean;
}

export default function ProductForm({ initialData, isEdit }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [locations, setLocations] = useState<{id: string, name: string, capacity: number, products?: any[]}[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialData?.categoryId || '');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(initialData?.locationId || '');
  const [allocationAmount, setAllocationAmount] = useState<number>(initialData?.onShelfStock || 0);
  
  const [warehouseStock, setWarehouseStock] = useState<number>(initialData?.warehouseStock || 0);
  const [onShelfStock, setOnShelfStock] = useState<number>(initialData?.onShelfStock || 0);
  const [totalStock, setTotalStock] = useState<number>(initialData?.stock || 0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateUsage = (loc: any) => {
    return loc.products?.reduce((acc: number, p: any) => acc + (p.onShelfStock || 0), 0) || 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, locRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/locations')
        ]);
        if (catRes.ok) setCategories(await catRes.json());
        if (locRes.ok) setLocations(await locRes.json());
      } catch (err) {}
    };
    fetchData();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError('Ukuran file terlalu besar (maksimal 2MB)');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Capacity Check
    if (!isEdit && selectedLocationId && allocationAmount > 0) {
        const loc = locations.find(l => l.id === selectedLocationId);
        if (loc) {
            const used = calculateUsage(loc);
            const remaining = loc.capacity - used;
            if (allocationAmount > remaining) {
                setError(`Kapasitas tempat "${loc.name}" tidak mencukupi. Sisa ruang: ${remaining} unit.`);
                setLoading(false);
                return;
            }
        }
    }

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      price: parseFloat(formData.get('price') as string),
      // Logic: Total Stock = Warehouse + Allocation
      stock: !isEdit ? totalStock : undefined,
      warehouseStock: isEdit ? warehouseStock : (totalStock - allocationAmount),
      onShelfStock: isEdit ? onShelfStock : allocationAmount,
      image: imagePreview,
      description: formData.get('description'),
      categoryId: selectedCategoryId || null,
      locationId: selectedLocationId || null,
    };
    
    if (isEdit) {
      (data as any).id = initialData?.id;
    }

    try {
      const url = isEdit ? '/api/products/update' : '/api/products/create';
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Gagal menyimpan data');
      }

      window.location.href = '/dashboard/products';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
      <CardContent className="p-0">
        <div className="bg-slate-50 border-b border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            {isEdit ? 'Manajemen Inventaris Produk' : 'Registrasi Produk Baru'}
          </h3>
          <p className="text-xs text-slate-500">Kelola distribusi stok antara gudang dan rak pajangan.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
              <X className="w-5 h-5" />
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="space-y-4">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Visual Produk</Label>
              <div 
                className={`group relative aspect-square rounded-4xl border-2 border-dashed border-slate-200 transition-all flex flex-col items-center justify-center overflow-hidden bg-slate-50/50 hover:bg-white hover:border-blue-400 ${
                  !imagePreview && 'cursor-pointer'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                      <div className="flex gap-2 p-2 bg-white/90 backdrop-blur rounded-2xl shadow-xl">
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                          className="rounded-xl h-9 text-[10px] font-bold uppercase"
                        >
                          Ganti
                        </Button>
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); removeImage(); }}
                          className="rounded-xl h-9 text-[10px] font-bold uppercase"
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-blue-500 transition-colors">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-slate-100 mb-2 group-hover:scale-110 transition-transform">
                      <Plus className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Pilih Gambar</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />
              <div className="text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Format: JPG, PNG • Max 2MB</p>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nama Produk</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    defaultValue={initialData?.name} 
                    placeholder="Nama produk lengkap" 
                    className="rounded-xl border-slate-200 h-12 font-bold bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Harga Jual (Rp)</Label>
                  <Input 
                    id="price" 
                    name="price" 
                    type="number" 
                    defaultValue={initialData?.price} 
                    placeholder="0" 
                    className="rounded-xl border-slate-200 h-12 font-bold bg-white"
                    required 
                  />
                </div>
              </div>

              {!isEdit ? (
                <div className="space-y-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="space-y-2">
                    <Label htmlFor="totalStock" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest ml-1">Kuantitas Stok Awal</Label>
                    <Input 
                      id="totalStock" 
                      name="totalStock" 
                      type="number" 
                      value={totalStock}
                      onChange={(e) => setTotalStock(parseInt(e.target.value) || 0)}
                      placeholder="Masukkan jumlah stok..." 
                      className="rounded-xl border-blue-200 h-12 font-bold bg-white text-blue-700"
                      required 
                    />
                  </div>
                  <div className="flex items-start gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-tighter">
                    <Package className="w-4 h-4 shrink-0" />
                    <span>Barang akan secara otomatis berada pada bagian warehouse/gudang setelah ditambahkan.</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <div className="space-y-2 opacity-60">
                    <Label htmlFor="warehouseStock" className="text-[10px] font-bold text-amber-600 uppercase tracking-widest ml-1">Stok Gudang (Terkunci)</Label>
                    <Input 
                      id="warehouseStock" 
                      name="warehouseStock" 
                      type="number" 
                      value={warehouseStock}
                      readOnly
                      className="rounded-xl border-slate-200 h-12 font-bold bg-slate-100 text-amber-700 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2 opacity-60">
                    <Label htmlFor="onShelfStock" className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest ml-1">Stok di Rak (Terkunci)</Label>
                    <Input 
                      id="onShelfStock" 
                      name="onShelfStock" 
                      type="number" 
                      value={onShelfStock}
                      readOnly
                      className="rounded-xl border-slate-200 h-12 font-bold bg-slate-100 text-emerald-700 cursor-not-allowed"
                    />
                  </div>
                  <p className="col-span-2 text-[9px] text-slate-400 font-medium italic text-center">
                    Kuantitas total hanya dapat diatur saat penambahan produk baru. Gunakan menu logistik untuk memindahkan stok antar lokasi.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <CustomSelect 
                    label="Kategori Produk"
                    placeholder="Tanpa Kategori"
                    options={categories.map(c => ({ id: c.id, name: c.name }))}
                    value={selectedCategoryId}
                    onChange={setSelectedCategoryId}
                    icon={<Tag />}
                  />
                </div>
                <div className="space-y-2">
                  <CustomSelect 
                    label="Distribusi Lokasi Unit"
                    placeholder="Simpan dalam Gudang (Default)"
                    options={locations.map(loc => {
                        const used = calculateUsage(loc);
                        const remaining = loc.capacity - used;
                        return {
                            id: loc.id,
                            name: loc.name,
                            disabled: remaining <= 0,
                            meta: remaining <= 0 ? "RUANGAN PENUH" : `Sisa ${remaining} Unit`
                        };
                    })}
                    value={selectedLocationId}
                    onChange={(val) => {
                        setSelectedLocationId(val);
                        if (!val) setAllocationAmount(0);
                    }}
                    icon={<MapPin />}
                  />
                </div>
              </div>

              {!isEdit && selectedLocationId && (
                <div className="space-y-4 p-8 bg-emerald-50/50 rounded-[2.5rem] border-2 border-emerald-100 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between px-2">
                    <Label htmlFor="allocationAmount" className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Kuantitas untuk Dialokasikan</Label>
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 italic">
                        Sisanya ({totalStock - allocationAmount}) di Gudang
                    </span>
                  </div>
                  <div className="relative">
                    <Input 
                        id="allocationAmount" 
                        type="number" 
                        value={allocationAmount}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setAllocationAmount(Math.min(val, totalStock));
                        }}
                        max={totalStock}
                        min={0}
                        className="rounded-2xl border-none h-16 font-black text-2xl bg-white text-emerald-700 shadow-sm text-center focus:ring-emerald-500"
                        placeholder="0" 
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-300 uppercase">Unit</div>
                  </div>
                  <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest text-center flex items-center justify-center gap-2">
                    <LayoutGrid className="w-3 h-3" /> Barang akan langsung masuk ke rak jualan
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Catatan Produk</Label>
                <textarea 
                  id="description" 
                  name="description" 
                  defaultValue={initialData?.description || ''} 
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-4 text-xs font-bold bg-white resize-none focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                  placeholder="Opsional: Deskripsi atau catatan khusus..."
                />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex gap-4">
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 transition-all active:scale-[0.98] uppercase tracking-widest" disabled={loading}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ImageIcon className="w-5 h-5 mr-3" />}
              {isEdit ? 'Update Inventaris' : 'Daftarkan Produk'}
            </Button>
            <a href="/dashboard/products" className="contents">
              <Button type="button" variant="outline" className="h-14 rounded-2xl border-slate-200 text-slate-400 font-bold px-10 hover:bg-slate-50 uppercase text-[11px] tracking-widest">Batal</Button>
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

