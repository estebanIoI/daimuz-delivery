import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  role: 'customer' | 'dealer' | 'admin';
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string;
  role: 'customer' | 'dealer' | 'admin';
  avatar_url: string | null;
  is_active: number;
  created_at: string;
}

export interface ProductRow {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  is_available: number;
  sort_order: number;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  image_url: string | null;
  sort_order: number;
  is_active: number;
}

export interface OrderRow {
  id: string;
  customer_id: string;
  dealer_id: string | null;
  status: 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  total: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
}

export interface MessageRow {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: 'customer' | 'dealer' | 'admin';
  message_type: 'text' | 'image' | 'system';
  message: string;
  image_url: string | null;
  created_at: string;
  is_read: number;
}

export interface DeliveryZoneRow {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  is_active: number;
}

export interface DealerStatsRow {
  id: string;
  user_id: string;
  completed_orders: number;
  rating_avg: number;
  xp: number;
  rank: string;
  total_distance: number;
}

export interface RewardWalletRow {
  id: string;
  user_id: string;
  points: number;
  updated_at: string;
}

export interface TrackingRow {
  id: string;
  order_id: string;
  dealer_id: string;
  lat: number;
  lng: number;
  recorded_at: string;
}
