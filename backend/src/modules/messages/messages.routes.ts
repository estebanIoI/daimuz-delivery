import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import pool from '../../config/db';
import { AuthRequest } from '../../types';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/orders/:id/messages', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
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
      res.status(403).json({ error: 'No autorizado para ver estos mensajes' });
      return;
    }

    const [messages] = await pool.query(
      `SELECT m.*, u.name as sender_name
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.order_id = ?
       ORDER BY m.created_at ASC`,
      [req.params.id]
    );

    await pool.query(
      'UPDATE messages SET is_read = 1 WHERE order_id = ? AND sender_id != ? AND is_read = 0',
      [req.params.id, req.user!.userId]
    );

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

router.post('/orders/:id/messages', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { message, message_type, image_url } = req.body;

    if (!message && !image_url) {
      res.status(400).json({ error: 'message o image_url requerido' });
      return;
    }

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
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
      res.status(403).json({ error: 'No autorizado para enviar mensajes' });
      return;
    }

    if (['cancelled', 'delivered'].includes(order.status)) {
      res.status(400).json({ error: 'No se pueden enviar mensajes en pedidos finalizados' });
      return;
    }

    if (req.user!.role === 'customer' && order.status === 'pending') {
      res.status(400).json({ error: 'Chat se habilita cuando un dealer acepte el pedido' });
      return;
    }

    const msgId = uuid();
    await pool.query(
      'INSERT INTO messages (id, order_id, sender_id, sender_role, message_type, message, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [msgId, req.params.id, req.user!.userId, req.user!.role, message_type || 'text', message || null, image_url || null]
    );

    const [newMsg] = await pool.query('SELECT * FROM messages WHERE id = ?', [msgId]);
    const [userRows] = await pool.query('SELECT name FROM users WHERE id = ?', [req.user!.userId]);

    res.status(201).json({
      message: {
        ...(newMsg as any[])[0],
        sender_name: (userRows as any[])[0]?.name || 'Usuario',
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

router.patch('/messages/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { message_ids } = req.body;

    if (!message_ids || !message_ids.length) {
      res.status(400).json({ error: 'message_ids requerido' });
      return;
    }

    await pool.query('UPDATE messages SET is_read = 1 WHERE id IN (?)', [message_ids]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al marcar como leído' });
  }
});

export default router;
