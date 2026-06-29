import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import pool from '../../config/db';
import { AuthRequest } from '../../types';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/:orderId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'dealer') {
      res.status(403).json({ error: 'Solo dealers pueden enviar ubicación' });
      return;
    }

    const { lat, lng } = req.body;

    if (!lat || !lng) {
      res.status(400).json({ error: 'lat y lng requeridos' });
      return;
    }

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND dealer_id = ?', [
      req.params.orderId,
      req.user!.userId,
    ]);

    if ((orders as any[]).length === 0) {
      res.status(404).json({ error: 'Pedido no encontrado o no asignado a este dealer' });
      return;
    }

    const id = uuid();
    await pool.query(
      'INSERT INTO tracking_locations (id, order_id, dealer_id, lat, lng) VALUES (?, ?, ?, ?, ?)',
      [id, req.params.orderId, req.user!.userId, lat, lng]
    );

    res.status(201).json({ tracking: { id, order_id: req.params.orderId, lat, lng, recorded_at: new Date() } });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar ubicación' });
  }
});

router.get('/:orderId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.orderId]);
    const orderRows = orders as any[];

    if (orderRows.length === 0) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }

    const order = orderRows[0];

    const isParticipant =
      order.customer_id === req.user!.userId ||
      order.dealer_id === req.user!.userId ||
      req.user!.role === 'admin';

    if (!isParticipant) {
      res.status(403).json({ error: 'No autorizado' });
      return;
    }

    const [tracking] = await pool.query(
      'SELECT * FROM tracking_locations WHERE order_id = ? ORDER BY recorded_at DESC LIMIT 1',
      [req.params.orderId]
    );

    res.json({ tracking: (tracking as any[])[0] || null });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ubicación' });
  }
});

export default router;
