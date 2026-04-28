import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, LayoutGrid, Archive, ShoppingBag, AlertCircle, Box, X, ChevronRight, ListFilter, SortAsc } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRupiah, cn } from '@/lib/utils';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { toast } from 'sonner';
import CustomSelect from '../ui/CustomSelect';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  warehouseStock: number;
  onShelfStock: number;
  expiryDate?: string | null;
  locationId?: string | null;
  location?: { name: string } | null;
  allocations?: {
    id: string;
    quantity: number;
    location: { name: string; id: string };
  }[];
  categoryId?: string | null;
  category?: { name: string } | null;
  image?: string | null;
  description?: string | null;
  createdAt: string;
}

interface Props {
  initialProducts: Product[];
}

export default function ProductList({ initialProducts }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.addEventListener('refresh-data', fetchProducts);
    return () => window.removeEventListener('refresh-data', fetchProducts);
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.location?.name && p.location.name.toLowerCase().includes(search.toLowerCase())) ||
    (p.category?.name && p.category.name.toLowerCase().includes(search.toLowerCase()))
  ).sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    if (sortBy === 'newest') return dateB - dateA;
    return dateA - dateB;
  });

  const stats = {
      totalSKU: products.length,
      totalWarehouse: products.reduce((acc, p) => acc + (p.warehouseStock || 0), 0),
      totalRacks: products.reduce((acc, p) => acc + (p.onShelfStock || 0), 0),
      lowStock: products.filter(p => (p.warehouseStock + p.onShelfStock) < 10).length
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch(`/api/products/delete?id=${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus produk');
      setProducts(products.filter(p => p.id !== deleteId));
      toast.success('Produk berhasil dihapus');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                      <LayoutGrid className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total SKU Item</p>
                      <p className="text-xl font-black text-slate-800">{stats.totalSKU}</p>
                  </div>
              </CardContent>
          </Card>
          
          <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                      <Archive className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stok Gudang (Box)</p>
                      <p className="text-xl font-black text-slate-800">{stats.totalWarehouse}</p>
                  </div>
              </CardContent>
          </Card>
          
          <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stok Di Rak (Ready)</p>
                      <p className="text-xl font-black text-slate-800">{stats.totalRacks}</p>
                  </div>
              </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
              <CardContent className="p-6 flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stats.lowStock > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400")}>
                      <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stok Menipis</p>
                      <p className={cn("text-xl font-black", stats.lowStock > 0 ? "text-rose-600" : "text-slate-800")}>{stats.lowStock}</p>
                  </div>
              </CardContent>
          </Card>
      </div>

      <DeleteConfirmDialog 
        open={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Hapus Produk?"
        description="Produk ini akan dihapus secara permanen dari inventaris Anda."
      />
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="flex flex-col sm:flex-row flex-1 w-full gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
            <Input 
              placeholder="Cari Nama Produk, Rak, atau Kategori..." 
              className="pl-14 h-16 rounded-4xl border-2 border-slate-100 bg-white shadow-sm focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 text-sm font-bold transition-all placeholder:text-slate-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="w-full sm:w-60">
            <CustomSelect 
              placeholder="Urutkan"
              options={[
                { id: 'newest', name: 'Terbaru', meta: 'Item baru ditambahkan' },
                { id: 'oldest', name: 'Terlama', meta: 'Item lama ditambahkan' }
              ]}
              value={sortBy}
              onChange={setSortBy}
              icon={<SortAsc />}
            />
          </div>
        </div>

        <a href="/dashboard/products/add" className="w-full lg:w-auto">
          <Button className="w-full lg:w-auto h-16 rounded-4xl px-10 font-black bg-slate-900 border-none hover:bg-blue-600 shadow-2xl shadow-blue-200/20 active:scale-[0.98] transition-all uppercase tracking-[2px] text-[11px] text-white">
            <Plus className="w-5 h-5 mr-3" />
            Tambah Produk Baru
          </Button>
        </a>
      </div>

      <Card className="border-slate-200 shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
              <TableRow className="hover:bg-transparent">
                <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Identitas Produk</th>
                <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Penyimpanan Utama</th>
                <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Total Unit</th>
                <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Distribusi Stok</th>
                <th className="px-6 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Nilai Satuan</th>
                <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Aksi</th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                return (
                  <tr 
                    key={product.id} 
                    className="group hover:bg-blue-50/30 transition-colors border-b border-slate-100 cursor-pointer"
                    onClick={() => window.location.href = `/dashboard/products/inventory/${product.id}`}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm group-hover:scale-105 transition-transform">
                          {product.image ? (
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Package className="w-7 h-7 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{product.name || '-'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{product.category?.name || 'Tanpa Kategori'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        <span className={cn(
                          "text-[9px] px-3 py-1 rounded-full font-black uppercase border tracking-widest",
                          product.locationId ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-amber-50 text-amber-600 border-amber-100"
                        )}>
                          {product.location?.name || 'Gudang Utama'}
                        </span>
                        {product.locationId && product.warehouseStock > 0 && (
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter opacity-60">Multi-Lokasi Aktif</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={cn(
                          "text-base font-black tracking-tighter",
                          (product.warehouseStock + product.onShelfStock) < 10 ? "text-rose-600" : "text-slate-900"
                        )}>
                          {product.warehouseStock + product.onShelfStock}
                        </span>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Qty Unit</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <div className="flex justify-center gap-2.5">
                          <div className="flex flex-col items-center group/dist">
                            <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1 group-hover/dist:text-amber-600 transition-colors">Warehouse</span>
                            <span className="bg-white text-slate-800 px-3 py-1 text-xs font-black rounded-xl border border-slate-200 group-hover/dist:border-amber-400 group-hover/dist:bg-amber-50 transition-all">{product.warehouseStock}</span>
                          </div>
                          <div className="flex flex-col items-center group/dist">
                            <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1 group-hover/dist:text-emerald-600 transition-colors">Rack</span>
                            <span className="bg-white text-slate-800 px-3 py-1 text-xs font-black rounded-xl border border-slate-200 group-hover/dist:border-emerald-400 group-hover/dist:bg-emerald-50 transition-all">{product.onShelfStock}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm font-black text-slate-900">
                          {formatRupiah(product.price)}
                        </span>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Per Unit</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-3 translate-x-2 group-hover:translate-x-0 transition-transform">
                        <a href={`/dashboard/products/edit/${product.id}`}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                            <Edit2 className="w-5 h-5" />
                          </Button>
                        </a>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          onClick={() => setDeleteId(product.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center opacity-30">
                        <Search className="w-16 h-16 mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs">Produk tidak ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
