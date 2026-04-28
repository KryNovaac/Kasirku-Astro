import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { 
  LogOut, 
  User, 
  Shield, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Globe
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';

interface SettingsProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export default function SettingsContent({ user }: SettingsProps) {
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [timezone, setTimezone] = useState(localStorage.getItem('timezone') || 'Asia/Jakarta');

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoadingProfile(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name');

    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        body: JSON.stringify({ name }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        toast.success('Profil berhasil diperbarui');
        // Refresh page to update name in layout
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const error = await res.json();
        toast.error(error.message || 'Gagal memperbarui profil');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoadingPassword(true);
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');

    if (newPassword !== confirmPassword) {
      toast.error('Kata sandi baru tidak cocok');
      setIsLoadingPassword(false);
      return;
    }

    try {
      const res = await fetch('/api/user/update-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        toast.success('Kata sandi berhasil diperbarui');
        (e.target as HTMLFormElement).reset();
      } else {
        const error = await res.json();
        toast.error(error.message || 'Gagal memperbarui kata sandi');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
    localStorage.setItem('timezone', value);
    window.dispatchEvent(new Event('timezone-changed'));
    toast.success('Zona waktu berhasil diubah');
  };

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      window.location.href = '/';
    }
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-xl w-full justify-start border border-slate-200">
          <TabsTrigger value="profile" className="gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-bold text-[10px] text-slate-500 uppercase">
            <User className="h-3.5 w-3.5" /> Profil
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-bold text-[10px] text-slate-500 uppercase">
            <Clock className="h-3.5 w-3.5" /> Preferensi
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-bold text-[10px] text-slate-500 uppercase">
            <Shield className="h-3.5 w-3.5" /> Keamanan
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PROFILE */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="name" className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nama Lengkap</Label>
                <Input 
                    id="name" 
                    name="name" 
                    defaultValue={user?.name || ''} 
                    placeholder="Nama..." 
                    required
                    className="h-10 rounded-lg border-slate-200 font-bold"
                />
              </div>
              <div className="grid gap-1.5">
                 <Label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Email</Label>
                 <Input value={user?.email || ''} disabled className="h-10 rounded-lg bg-slate-50 border-slate-200 text-slate-400 font-medium" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isLoadingProfile} className="h-10 px-8 rounded-lg bg-blue-600 text-white font-bold text-[11px] uppercase tracking-wide">
                {isLoadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* TAB 2: PREFERENCES */}
        <TabsContent value="preferences" className="mt-6 space-y-3">
             <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white">
                 <div>
                    <span className="font-bold text-slate-800 text-sm block">Waktu Operasional</span>
                    <span className="text-[10px] text-slate-400 font-bold">Zona waktu sistem anda</span>
                 </div>
                 <Select value={timezone} onValueChange={handleTimezoneChange}>
                   <SelectTrigger className="w-32 h-9 rounded-lg border-slate-200 text-[11px] font-bold">
                     <SelectValue placeholder="Zona" />
                   </SelectTrigger>
                   <SelectContent className="rounded-lg">
                     <SelectItem value="Asia/Jakarta" className="text-[11px] font-bold">WIB (GMT+7)</SelectItem>
                     <SelectItem value="Asia/Makassar" className="text-[11px] font-bold">WITA (GMT+8)</SelectItem>
                     <SelectItem value="Asia/Jayapura" className="text-[11px] font-bold">WIT (GMT+9)</SelectItem>
                   </SelectContent>
                 </Select>
             </div>
        </TabsContent>

        {/* TAB 3: ACCOUNT & SECURITY */}
        <TabsContent value="account" className="mt-6 space-y-6">
            <div className="rounded-xl border border-slate-200 p-6 bg-white space-y-6">
                <div>
                   <h3 className="font-bold text-slate-800">Ganti Password</h3>
                   <p className="text-[10px] font-bold text-slate-400">Pastikan password baru Anda aman.</p>
                </div>
                
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="grid gap-1.5">
                        <Label htmlFor="currentPassword" className="text-[10px] font-bold text-slate-500 uppercase ml-1">Password Sekarang</Label>
                        <Input id="currentPassword" name="currentPassword" type="password" required className="h-10 rounded-lg border-slate-200 bg-slate-50 font-bold" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="newPassword" className="text-[10px] font-bold text-slate-500 uppercase ml-1">Password Baru</Label>
                            <Input id="newPassword" name="newPassword" type="password" required minLength={6} className="h-10 rounded-lg border-slate-200 bg-white font-bold" />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="confirmPassword" className="text-[10px] font-bold text-slate-500 uppercase ml-1">Konfirmasi Password</Label>
                            <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} className="h-10 rounded-lg border-slate-200 bg-white font-bold" />
                        </div>
                    </div>
                    
                    <div className="pt-2">
                        <Button type="submit" disabled={isLoadingPassword} className="h-10 px-8 rounded-lg font-bold bg-blue-600 text-white text-[11px] uppercase">
                            {isLoadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan Perubahan
                        </Button>
                    </div>
                </form>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="font-bold text-rose-700 text-sm">Akhiri Sesi</h3>
                    <p className="text-[10px] font-bold text-slate-400">Logout dari sistem aplikasi ini.</p>
                </div>
                <Button 
                    variant="destructive" 
                    onClick={handleLogout}
                    className="h-10 px-8 rounded-lg font-bold text-xs uppercase shadow-sm"
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </Button>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
