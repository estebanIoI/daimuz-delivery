import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import pool from '../../config/db';
import { AuthRequest } from '../../types';
import { authenticate, authorize } from '../../middleware/auth';
import { isWithinAnyZone, isWithinZone } from '../../utils/haversine';

const router = Router();

router.post('/validate', async (req: AuthRequest, res: Response) => {
  try {
    const lat = Number(req.body.lat);
    const lng = Number(req.body.lng);

    if (!lat || !lng) {
      res.status(400).json({ error: 'lat y lng requeridos' });
      return;
    }

    const [zones] = await pool.query(
      'SELECT id, name, center_lat, center_lng, radius_km FROM delivery_zones WHERE is_active = 1'
    );

    const activeZones = (zones as any[]).map((z) => ({
      ...z,
      center_lat: Number(z.center_lat),
      center_lng: Number(z.center_lng),
      radius_km: Number(z.radius_km),
    }));

    if (activeZones.length === 0) {
      res.json({
        allowed: false,
        message: 'Servicio no disponible en este momento.',
      });
      return;
    }

    const allowed = isWithinAnyZone(lat, lng, activeZones);

    if (!allowed) {
      res.json({
        allowed: false,
        message: 'Servicio no disponible en tu zona.',
      });
      return;
    }

    const matchedZone = activeZones.find((z) =>
      isWithinZone(lat, lng, z.center_lat, z.center_lng, z.radius_km)
    );

    res.json({
      allowed: true,
      zone: matchedZone
        ? { id: matchedZone.id, name: matchedZone.name }
        : { id: activeZones[0].id, name: activeZones[0].name },
    });
  } catch (error) {
    console.error('Zone validate error:', error);
    res.status(500).json({ error: 'Error al validar zona' });
  }
});

router.get('/', authenticate, authorize('admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const [zones] = await pool.query('SELECT * FROM delivery_zones ORDER BY name');
    res.json({ zones });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener zonas' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, center_lat, center_lng, radius_km } = req.body;

    if (!name || !center_lat || !center_lng || !radius_km) {
      res.status(400).json({ error: 'name, center_lat, center_lng, radius_km requeridos' });
      return;
    }

    const id = uuid();
    await pool.query(
      'INSERT INTO delivery_zones (id, name, center_lat, center_lng, radius_km, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [id, name, center_lat, center_lng, radius_km]
    );

    res.status(201).json({ zone: { id, name, center_lat, center_lng, radius_km, is_active: 1 } });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear zona' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('DELETE FROM delivery_zones WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar zona' });
  }
});

export default router;
