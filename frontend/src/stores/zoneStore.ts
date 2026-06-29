import { create } from 'zustand';
import { api } from '@/lib/api';

interface ZoneInfo {
  allowed: boolean;
  message: string;
  zone?: { id: string; name: string };
}

interface ZoneState {
  allowed: boolean | null;
  message: string;
  zoneName: string | null;
  checking: boolean;
  userLat: number | null;
  userLng: number | null;
  validate: (lat: number, lng: number) => Promise<void>;
  reset: () => void;
}

export const useZoneStore = create<ZoneState>((set) => ({
  allowed: null,
  message: '',
  zoneName: null,
  checking: false,
  userLat: null,
  userLng: null,

  validate: async (lat, lng) => {
    set({ checking: true, userLat: lat, userLng: lng });
    try {
      const data = await api<ZoneInfo>('/zones/validate', {
        method: 'POST',
        body: { lat, lng },
      });
      set({
        allowed: data.allowed,
        message: data.message,
        zoneName: data.zone?.name || null,
        checking: false,
      });
    } catch {
      set({
        allowed: false,
        message: 'Error al verificar ubicación',
        checking: false,
      });
    }
  },

  reset: () => set({ allowed: null, message: '', zoneName: null, userLat: null, userLng: null }),
}));
