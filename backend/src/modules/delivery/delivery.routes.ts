import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import pool from '../../config/db';
import { AuthRequest } from '../../types';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/available', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'dealer' && req.user!.role !== 'admin') {
      res.status(403).json({ error: 'Solo dealers pueden ver pedidos disponibles' });
      return;
    }

    const [orders] = await pool.query(
      `SELECT o.*, u.name as customer_name, u.phone as customer_phone
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       WHERE o.status = 'pending' AND o.dealer_id IS NULL
       ORDER BY o.created_at DESC`
    );

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos disponibles' });
  }
});

router.post('/accept/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'dealer') {
      res.status(403).json({ error: 'Solo dealers pueden aceptar pedidos' });
      return;
    }

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    const orderRows = orders as any[];

    if (orderRows.length === 0) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }

    const order = orderRows[0];

    if (order.status !== 'pending' || order.dealer_id !== null) {
      res.status(409).json({ error: 'Este pedido ya fue tomado' });
      return;
    }

    await pool.query(
      'UPDATE orders SET dealer_id = ?, status = "accepted", updated_at = NOW() WHERE id = ?',
      [req.user!.userId, req.params.id]
    );

    const systemMsgId = uuid();
    const [dealerRows] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user!.userId]);
    const dealerName = (dealerRows as any[])[0]?.name || 'Dealer';
    await pool.query(
      'INSERT INTO messages (id, order_id, sender_id, sender_role, message_type, message) VALUES (?, ?, ?, "system", "system", ?)',
      [systemMsgId, req.params.id, req.user!.userId, `${dealerName} ha aceptado tu pedido. Chat habilitado.`]
    );

    res.json({ success: true, message: 'Pedido aceptado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al aceptar pedido' });
  }
});

router.get('/my-active', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'dealer') {
      res.status(403).json({ error: 'Solo dealers' });
      return;
    }

    const [orders] = await pool.query(
      `SELECT o.*, u.name as customer_name, u.phone as customer_phone
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       WHERE o.dealer_id = ? AND o.status IN ('accepted', 'picked_up', 'in_transit')
       ORDER BY o.created_at DESC`,
      [req.user!.userId]
    );

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos activos' });
  }
});

router.get('/my-history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role !== 'dealer') {
      res.status(403).json({ error: 'Solo dealers' });
      return;
    }

    const [orders] = await pool.query(
      `SELECT o.*, u.name as customer_name
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       WHERE o.dealer_id = ? AND o.status IN ('delivered', 'cancelled')
       ORDER BY o.created_at DESC
       LIMIT 100`,
      [req.user!.userId]
    );

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

export default router;
