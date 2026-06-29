import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { isWithinAnyZone } from '../utils/haversine';
import pool from '../config/db';

export async function geoGuard(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { lat, lng } = req.body;

  if (!lat || !lng) {
    res.status(400).json({ error: 'Ubicación requerida (lat, lng)' });
    return;
  }

  const [zones] = await pool.query(
    'SELECT center_lat, center_lng, radius_km FROM delivery_zones WHERE is_active = 1'
  );

  const activeZones = zones as any[];

  if (activeZones.length === 0) {
    res.status(503).json({
      allowed: false,
      message: 'Servicio no disponible en este momento.',
    });
    return;
  }

  const allowed = isWithinAnyZone(lat, lng, activeZones);

  if (!allowed) {
    res.status(403).json({
      allowed: false,
      message: 'Servicio no disponible en tu zona.',
    });
    return;
  }

  next();
}
