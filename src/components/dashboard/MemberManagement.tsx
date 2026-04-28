import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  RefreshCcw, 
  ChevronRight, 
  History, 
  Star, 
  Ban,
  MoreVertical,
  Download,
  Calendar,
  CreditCard,
  Plus,
  Loader2,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { formatRupiah } from '../../lib/utils';

interface Member {
  id: string;
  phone: string;
  name: string | null;
  points: number;
  createdAt: string;
  totalTransactions: number;
  transactions: any[];
  lastTransaction: any;
  isSubscribed: boolean;
}

export function MemberManagement({ userRole }: { userRole: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (err) {
      toast.error('Gagal memuat data member');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    window.addEventListener('refresh-data', fetchMembers);
    return () => window.removeEventListener('refresh-data', fetchMembers);
  }, []);

  const filteredMembers = members.filter(m => 
    m.phone.includes(search) || (m.name?.toLowerCase().includes(search.toLowerCase()))
  );

  const isAdmin = userRole === 'ADMIN';

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      phone: formData.get('phone'),
      name: formData.get('name'),
    };

    try {
      const res = await fetch('/api/members/create', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        toast.success('Member berhasil ditambahkan');
        setShowAddModal(false);
        fetchMembers();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Gagal menambahkan member');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-200 bg-white">
            <div className="bg-blue-600 p-8 text-white relative">
              <button 
                onClick={() => setShowAddModal(false)}
                className="absolute right-6 top-6 h-8 w-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-xl font-bold">Member Baru</h3>
              <p className="text-xs text-blue-100 mt-1 uppercase tracking-widest font-medium">Daftarkan Loyalitas Pelanggan</p>
            </div>
            <CardContent className="p-8">
              <form onSubmit={handleAddMember} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nomor WhatsApp</Label>
                  <Input 
                    name="phone" 
                    placeholder="08xxxxxxxxxx" 
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</Label>
                  <Input 
                    name="name" 
                    placeholder="Contoh: Budi Santoso" 
                    className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 h-12 rounded-xl font-bold text-slate-400"
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-lg shadow-blue-100"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Daftarkan Member'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Member</h1>
          <p className="text-slate-500 text-sm">Pantau loyalitas dan riwayat belanja pelanggan setia Anda.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 h-11 rounded-xl px-6 font-bold shadow-lg shadow-blue-100 uppercase tracking-widest text-[10px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Member
          </Button>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari Nama/HP..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-slate-50/50 border-none rounded-xl"
            />
          </div>
          <Button onClick={fetchMembers} variant="ghost" size="icon" className="h-11 w-11 rounded-xl hover:bg-blue-50/50 hover:text-blue-600 transition-all border border-slate-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Member</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Poin</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMembers.map((m) => (
                    <tr 
                      key={m.id} 
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedMember?.id === m.id ? 'bg-blue-50/50' : ''}`}
                      onClick={() => setSelectedMember(m)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border",
                            m.isSubscribed ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-blue-50 text-blue-600 border-blue-100"
                          )}>
                             {m.name ? m.name[0].toUpperCase() : m.phone.slice(-1)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{m.name || 'Pelanggan'}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <CreditCard className="w-3 h-3" /> {m.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                           <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                           <p className="font-semibold text-slate-900">{m.points.toLocaleString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         {m.isSubscribed ? (
                           <Badge className="bg-amber-50 text-amber-700 border-none px-2 py-0.5 rounded text-[10px] uppercase font-bold">Premium</Badge>
                         ) : (
                           <Badge className="bg-slate-100 text-slate-500 border-none px-2 py-0.5 rounded text-[10px] uppercase font-bold">Standard</Badge>
                         )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className={cn("w-4 h-4 transition-all", selectedMember?.id === m.id ? "text-blue-600" : "text-slate-300")} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {selectedMember ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-28">
               <div className="h-24 bg-blue-600 flex items-center justify-center">
                  <p className="text-white font-semibold text-sm uppercase tracking-wider">Detail Loyalitas</p>
               </div>
               
                <div className="px-6 pb-6 -mt-8 relative z-10">
                  <div className="w-16 h-16 bg-white rounded-xl border-2 border-white shadow flex items-center justify-center font-bold text-2xl text-blue-600">
                     {selectedMember.name ? selectedMember.name[0].toUpperCase() : 'M'}
                  </div>
                  
                  <div className="mt-4">
                    <h2 className="text-lg font-bold text-slate-900">{selectedMember.name || 'Pelanggan'}</h2>
                    <p className="text-xs font-medium text-slate-500">{selectedMember.phone}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6">
                     <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Transaksi</p>
                        <p className="text-lg font-bold text-slate-900">{selectedMember.totalTransactions}</p>
                     </div>
                     <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Poin</p>
                        <p className="text-lg font-bold text-slate-900">{selectedMember.points}</p>
                     </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <h3 className="font-bold text-slate-900 text-sm">Riwayat Belanja</h3>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
                      {selectedMember.transactions && selectedMember.transactions.length > 0 ? (
                        selectedMember.transactions.map((tx: any) => (
                          <div key={tx.id} className="p-3 bg-white rounded-lg border border-slate-100 hover:border-blue-200 transition-all">
                            <div className="flex justify-between items-center mb-1">
                               <p className="text-[10px] text-slate-400">#{tx.id.slice(-8).toUpperCase()}</p>
                               <p className="text-[10px] text-slate-400">{new Date(tx.createdAt).toLocaleDateString('id-ID')}</p>
                            </div>
                            <p className="text-sm font-bold text-slate-900">{formatRupiah(tx.total)}</p>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 opacity-20">
                           <p className="text-xs font-semibold">Tidak ada riwayat</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-2">
                     {userRole === 'STAFF' && (
                       <Button 
                         className="col-span-2 h-11 rounded-xl bg-blue-600 text-white text-[11px] font-bold shadow-lg shadow-blue-100 uppercase tracking-wider mb-2"
                         onClick={() => window.location.href = `/dashboard/pos?memberPhone=${selectedMember.phone}`}
                       >
                         Pilih Member Ini
                       </Button>
                     )}
                     <Button variant="outline" className="h-9 rounded-lg text-[10px] font-bold">Reset</Button>
                     <Button className="h-9 rounded-lg bg-slate-900 text-white text-[10px] font-bold shadow-none">Export</Button>
                  </div>
               </div>
            </div>
          ) : (
            <div className="h-[400px] bg-slate-50 rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400 gap-2">
               <Users className="w-8 h-8 opacity-20" />
               <p className="text-xs font-medium">Pilih member untuk detail</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
