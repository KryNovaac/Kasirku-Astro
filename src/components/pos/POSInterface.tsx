import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, LogOut, Package, Download, ChevronLeft, CheckCircle2, ShoppingCart, Loader2, Star } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Label } from '../ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { formatRupiah, cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image?: string | null;
  description?: string | null;
  isDiscounted?: boolean;
  discountPrice?: number | null;
}

interface Props {
  initialProducts: Product[];
  storeName: string;
  userName: string;
}

type POSStep = 'SELECTION' | 'CONFIRMATION' | 'RECEIPT';

export default function POSInterface({ initialProducts, storeName, userName }: Props) {
  const [products] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [step, setStep] = useState<POSStep>('SELECTION');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  
  // Member States
  const [isMember, setIsMember] = useState(false);
  const [memberPhone, setMemberPhone] = useState('');
  const [memberName, setMemberName] = useState('');
  const [isSearchingMember, setIsSearchingMember] = useState(false);
  const [showMemberReg, setShowMemberReg] = useState(false);
  const [memberPoints, setMemberPoints] = useState(0);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) setCategories(await res.json());
      } catch (err) {}
    };
    fetchCategories();
  }, []);

  const checkMember = async (phone: string) => {
    if (!phone || phone.length < 10) return;
    setIsSearchingMember(true);
    try {
      const res = await fetch(`/api/members?phone=${phone}`);
      if (res.ok) {
        const data = await res.json();
        const member = data.find((m: any) => m.phone === phone);
        if (member) {
          setMemberName(member.name || '');
          setMemberPoints(member.points || 0);
          setShowMemberReg(false);
          toast.success(`Member ditemukan: ${member.name || phone}`);
        } else {
          setShowMemberReg(true);
          setMemberName('');
          setMemberPoints(0);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingMember(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || (p as any).categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const updateQuantity = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setQuantities(prev => {
      const current = prev[productId] || 0;
      const next = Math.max(0, Math.min(current + delta, product.stock));
      return { ...prev, [productId]: next };
    });
  };

  const cartItems = useMemo(() => {
    return products
      .filter(p => (quantities[p.id] || 0) > 0)
      .map(p => ({ 
        ...p, 
        quantity: quantities[p.id],
        effectivePrice: p.isDiscounted && p.discountPrice ? p.discountPrice : p.price
      }));
  }, [products, quantities]);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.effectivePrice * item.quantity), 0);

  const handleNext = () => {
    if (cartItems.length === 0) {
      toast.error('Pilih minimal satu produk');
      return;
    }
    setStep('CONFIRMATION');
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount < subtotal) {
      toast.error('Jumlah bayar tidak mencukupi');
      return;
    }

    setIsProcessing(true);
    
    try {
      // If member needs registration, do it first or in the same flow
      if (isMember && showMemberReg) {
          const regRes = await fetch('/api/members/create', {
              method: 'POST',
              body: JSON.stringify({
                  phone: memberPhone,
                  name: memberName || 'Member Baru',
              }),
              headers: { 'Content-Type': 'application/json' }
          });
          if (!regRes.ok) toast.error('Gagal mendaftarkan member baru');
      }

      const res = await fetch('/api/transactions/create', {
        method: 'POST',
        body: JSON.stringify({
          items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.effectivePrice,
            quantity: item.quantity
          })),
          total: subtotal,
          isMember,
          memberPhone: isMember ? memberPhone : null,
          cashPaid: amount,
          change: amount - subtotal
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error('Gagal memproses transaksi');

      const result = await res.json();
      setLastTransaction(result);
      toast.success('Transaksi Berhasil!');
      setStep('RECEIPT');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPOS = () => {
    setQuantities({});
    setStep('SELECTION');
    setLastTransaction(null);
    setPaymentAmount('');
    setIsMember(false);
    setMemberPhone('');
    setSearch('');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (step === 'RECEIPT' && lastTransaction) {
    return (
      <div className="min-h-screen bg-white p-4 md:p-8 print:p-0 print:bg-white print:min-h-0">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; }
            @page { margin: 0; size: auto; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            .receipt-card { border: none !important; box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: none !important; }
          }
        `}} />
        <div className="max-w-3xl mx-auto space-y-6 print:space-y-0 print:max-w-none">
          <div className="flex items-center justify-between print:hidden">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              Transaksi Berhasil
            </h1>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 h-9 rounded-lg" onClick={() => window.print()}>
                <Download className="w-4 h-4" />
                Cetak / Simpan Struk
              </Button>
              <Button size="sm" className="h-9 rounded-lg px-6" onClick={resetPOS}>Kembali ke POS</Button>
            </div>
          </div>

          <Card className="shadow-sm border border-slate-200 rounded-2xl overflow-hidden bg-white receipt-card">
            <CardContent className="p-8 space-y-8 print:p-4 print:space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-100 pb-6 gap-4 print:border-slate-200">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-slate-800">Kasir<span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent bg-[length:200%_auto] animate-moving-gradient">Ku</span></h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{storeName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Invoice ID</p>
                  <p className="text-sm font-bold text-slate-900">#{lastTransaction.id.slice(-12).toUpperCase()}</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">{new Date(lastTransaction.createdAt).toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Petugas Kasir</p>
                  <p className="font-bold text-slate-800 text-sm">{userName}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Pelanggan</p>
                  <p className="font-bold text-slate-800">
                    {lastTransaction.isMember ? lastTransaction.memberPhone : 'Pelanggan Umum'}
                  </p>
                </div>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="border-b border-slate-100">
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase">Item</th>
                      <th className="text-center text-[10px] font-bold text-slate-500 uppercase">Harga</th>
                      <th className="text-center text-[10px] font-bold text-slate-500 uppercase">Qty</th>
                      <th className="text-right px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Subtotal</th>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-50">
                    {lastTransaction.items.map((item: any, i: number) => (
                      <TableRow key={i} className="hover:bg-transparent">
                        <TableCell className="px-6 py-3 font-bold text-slate-700">{item.name}</TableCell>
                        <TableCell className="text-center text-sm text-slate-500">{formatRupiah(item.price)}</TableCell>
                        <TableCell className="text-center text-sm font-bold text-slate-700">{item.quantity}</TableCell>
                        <TableCell className="text-right px-6 py-3 font-bold text-slate-900">{formatRupiah(item.price * item.quantity)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col items-end pt-4 space-y-2">
                <div className="flex justify-between w-64 text-sm font-bold text-slate-500 border-b border-slate-100 pb-2">
                  <span>Subtotal</span>
                  <span>{formatRupiah(lastTransaction.total)}</span>
                </div>
                <div className="flex justify-between w-64 pt-2">
                  <span className="text-lg font-bold text-slate-800">Total</span>
                  <span className="text-2xl font-bold text-blue-600 tracking-tight">{formatRupiah(lastTransaction.total)}</span>
                </div>
                <div className="flex justify-between w-64 text-sm text-slate-500 pt-1">
                  <span>Bayar</span>
                  <span>{formatRupiah(lastTransaction.cashPaid || lastTransaction.total)}</span>
                </div>
                <div className="flex justify-between w-64 p-3 bg-emerald-50 rounded-lg border border-emerald-100 mt-4">
                  <span className="text-emerald-700 text-sm font-bold">Kembalian</span>
                  <span className="text-xl font-bold text-emerald-600">{formatRupiah(lastTransaction.change || 0)}</span>
                </div>
              </div>

              <div className="text-center pt-8 border-t border-slate-100">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Terima kasih atas kunjungan Anda</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          {step === 'SELECTION' && (
            <div className="flex-1 max-w-2xl mx-8 flex gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input 
                  placeholder="Cari produk..." 
                  className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-blue-500 focus-visible:bg-white font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">Semua Kategori</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'SELECTION' ? (
            <div className="max-w-6xl mx-auto space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="border-b border-slate-100 uppercase text-slate-500">
                      <th className="px-6 py-4 text-left text-[10px] font-bold">Produk</th>
                      <th className="px-6 py-4 text-center text-[10px] font-bold">Harga</th>
                      <th className="px-6 py-4 text-center text-[10px] font-bold">Stok</th>
                      <th className="px-6 py-4 text-center text-[10px] font-bold w-40">Kuantitas</th>
                      <th className="px-6 py-4 text-right text-[10px] font-bold px-8">Total</th>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <Package className="w-6 h-6 text-slate-300" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{product.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">ID: {product.id.slice(-8).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {product.isDiscounted ? (
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 line-through">{formatRupiah(product.price)}</span>
                              <span className="text-blue-600 font-bold">{formatRupiah(product.discountPrice || 0)}</span>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-700">{formatRupiah(product.price)}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded font-bold uppercase border",
                            product.stock > 10 ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-rose-50 text-rose-600 border-rose-100"
                          )}>
                            {product.stock} Stok
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg bg-white active:scale-95 transition-transform"
                              onClick={() => updateQuantity(product.id, -1)}
                              disabled={!quantities[product.id]}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </Button>
                            <span className="text-sm font-bold w-6 text-center text-slate-900">{quantities[product.id] || 0}</span>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-lg bg-white active:scale-95 transition-transform"
                              onClick={() => updateQuantity(product.id, 1)}
                              disabled={(quantities[product.id] || 0) >= product.stock}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right px-8 font-bold text-blue-600">
                          {formatRupiah((product.isDiscounted && product.discountPrice ? product.discountPrice : product.price) * (quantities[product.id] || 0))}
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400">
                          <p className="text-sm font-medium">Produk tidak ditemukan</p>
                        </td>
                      </tr>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 space-y-6">
                <div className="flex items-center mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setStep('SELECTION')} className="rounded-lg text-slate-500 h-8">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Kembali Pilih Produk
                  </Button>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Review Pesanan</h2>
                <div className="space-y-3">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                          {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-slate-300" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{formatRupiah(item.price)} × {item.quantity}</p>
                        </div>
                      </div>
                      <p className="font-bold text-slate-900 text-base">{formatRupiah(item.price * item.quantity)}</p>
                    </div>
                  ))}
                  <div className="p-6 bg-blue-600 text-white rounded-2xl flex justify-between items-center shadow-lg shadow-blue-100 relative overflow-hidden group">
                    <ShoppingCart className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10" />
                    <div className="relative z-10 flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-100">Grand Total</span>
                      <span className="text-3xl font-bold tracking-tight">{formatRupiah(subtotal)}</span>
                    </div>
                    <CheckCircle2 className="w-10 h-10 text-blue-200/50 relative z-10" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-xl font-bold text-slate-800">Pembayaran</h2>
                <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tipe Pelanggan</label>
                      <div className="flex gap-2 p-1 bg-slate-50 border border-slate-200 rounded-lg">
                        <Button 
                          variant={!isMember ? "default" : "ghost"} 
                          className={cn("flex-1 rounded-md font-bold h-9 text-xs transition-all", !isMember && "bg-white text-blue-600 shadow-sm")}
                          onClick={() => setIsMember(false)}
                        >Umum</Button>
                        <Button 
                          variant={isMember ? "default" : "ghost"} 
                          className={cn("flex-1 rounded-md font-bold h-9 text-xs transition-all", isMember && "bg-white text-blue-600 shadow-sm")}
                          onClick={() => setIsMember(true)}
                        >Member</Button>
                      </div>
                      {isMember && (
                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase ml-1">No. HP (WA)</Label>
                            <div className="flex gap-2">
                                <Input 
                                placeholder="08xxxxxxxxxx" 
                                value={memberPhone}
                                onChange={(e) => setMemberPhone(e.target.value)}
                                className="h-10 rounded-lg border-slate-200 text-sm font-bold"
                                />
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-10 rounded-lg border-slate-200"
                                    onClick={() => checkMember(memberPhone)}
                                    disabled={isSearchingMember}
                                >
                                    {isSearchingMember ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cek'}
                                </Button>
                            </div>
                          </div>

                          {showMemberReg ? (
                              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                                  <p className="text-[10px] font-bold text-blue-600 uppercase">Member baru? Daftarkan Sekarang</p>
                                  <Input 
                                    placeholder="Nama Lengkap (Opsional)" 
                                    value={memberName}
                                    onChange={(e) => setMemberName(e.target.value)}
                                    className="h-10 rounded-lg border-blue-100 bg-white text-sm"
                                  />
                                  <div className="flex gap-2">
                                      <div className="flex-1 p-2 bg-white rounded-lg border border-blue-50 text-center">
                                          <p className="text-[8px] text-slate-400 uppercase font-bold">Poin Awal</p>
                                          <p className="text-sm font-bold text-blue-600">0</p>
                                      </div>
                                      <div className="flex-1 p-2 bg-white rounded-lg border border-blue-50 text-center">
                                          <p className="text-[8px] text-slate-400 uppercase font-bold">Status</p>
                                          <p className="text-sm font-bold text-emerald-600">Baru</p>
                                      </div>
                                  </div>
                              </div>
                          ) : memberName ? (
                               <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                                   <div>
                                       <p className="text-sm font-bold text-emerald-800">{memberName}</p>
                                       <p className="text-[10px] font-bold text-emerald-600 lowercase tracking-tight">{memberPoints} Puntos</p>
                                   </div>
                                   <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                       <Star className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                                   </div>
                               </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Uang Diterima</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                        <Input 
                          type="number" 
                          className="pl-10 h-14 text-2xl font-bold rounded-xl border-slate-200 bg-slate-50 focus:bg-white" 
                          placeholder="0"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                        />
                      </div>
                      {paymentAmount && parseFloat(paymentAmount) >= subtotal && (
                        <div className="p-4 bg-emerald-50 rounded-xl flex justify-between items-center border border-emerald-100">
                          <span className="text-[10px] text-emerald-600 font-bold uppercase">Kembalian</span>
                          <span className="font-bold text-emerald-600 text-xl tracking-tight">{formatRupiah(parseFloat(paymentAmount) - subtotal)}</span>
                        </div>
                      )}
                    </div>

                    <Button 
                      className="w-full h-14 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-100 uppercase" 
                      onClick={handleCheckout}
                      disabled={isProcessing || !paymentAmount || parseFloat(paymentAmount) < subtotal}
                    >
                      {isProcessing ? "Memproses..." : "Selesaikan Transaksi"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {step === 'SELECTION' && (
          <footer className="bg-white border-t border-slate-200 p-6 sticky bottom-0 z-10 shadow-sm">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Item Terpilih</span>
                  <span className="text-xl font-bold text-slate-800 tracking-tight">{cartItems.length} Produk</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Total Bayar</span>
                  <span className="text-3xl font-bold text-blue-600 tracking-tight">{formatRupiah(subtotal)}</span>
                </div>
              </div>
              <Button size="lg" className="h-14 px-12 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 uppercase tracking-wide" onClick={handleNext}>
                Konfirmasi Pembayaran
              </Button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
