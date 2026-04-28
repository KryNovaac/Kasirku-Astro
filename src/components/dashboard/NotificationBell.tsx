import React, { useState } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const notifications = [
    {
      id: 1,
      title: 'Stok Hampir Habis',
      description: 'Produk "Beras Premium 5kg" tersisa 5 karung segera lakukan restock.',
      type: 'warning',
      time: '10 menit yang lalu'
    },
    {
      id: 2,
      title: 'Login Berhasil',
      description: 'Sesi baru dimulai dari browser Chrome pada perangkat Windows.',
      type: 'info',
      time: '1 jam yang lalu'
    }
  ];

  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsOpen(true)}
        className="h-10 w-10 rounded-lg relative hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-400" />
        {hasUnread && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-600 rounded-full border-2 border-white"></span>
        )}
      </Button>

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        title="Pusat Notifikasi"
      >
        <div className="space-y-3 py-2">
          {notifications.map((notif) => (
            <div key={notif.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 transition-all flex gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                notif.type === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'
              }`}>
                {notif.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-0.5">
                  <h4 className="font-bold text-slate-900 text-xs uppercase">{notif.title}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{notif.time}</span>
                </div>
                <p className="text-xs text-slate-500">{notif.description}</p>
              </div>
            </div>
          ))}
          
          <div className="pt-4 flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => {
                setHasUnread(false);
                setIsOpen(false);
              }}
              className="text-[10px] font-bold uppercase text-slate-600 px-6 h-9 rounded-lg"
            >
              Tandai Telah Dibaca
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
