import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import pool from '../../config/db';
import { AuthRequest } from '../../types';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// GET /dealers/available — lista dealers online para elegir
router.get('/available', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.avatar_url,
              ds.completed_orders, ds.rating_avg, ds.xp, ds.rank
       FROM users u
       LEFT JOIN dealer_stats ds ON ds.user_id = u.id
       WHERE u.role = 'dealer' AND u.is_active = 1
       ORDER BY ds.xp DESC, ds.rating_avg DESC`
    );
    const dealers = (rows as any[]).map((d) => ({
      id: d.id,
      name: d.name,
      avatar_url: d.avatar_url,
      completed_orders: d.completed_orders || 0,
      rating_avg: Number(d.rating_avg || 0),
      xp: d.xp || 0,
      rank: d.rank || 'Bronze',
    }));
    res.json({ dealers });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener dealers' });
  }
});

// POST /dealers/request — customer elige dealer para su pedido
router.post('/request', authenticate, authorize('customer'), async (req: AuthRequest, res: Response) => {
  try {
    const { order_id, dealer_id } = req.body;
    if (!order_id || !dealer_id) {
      res.status(400).json({ error: 'order_id y dealer_id requeridos' });
      return;
    }

    // Verificar que el pedido pertenece al customer
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND customer_id = ?', [order_id, req.user!.userId]);
    if ((orders as any[]).length === 0) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }

    // Cancelar requests anteriores del mismo pedido
    await pool.query("UPDATE dealer_requests SET status = 'expired' WHERE order_id = ? AND status = 'pending'", [order_id]);

    const id = uuid();
    await pool.query(
      'INSERT INTO dealer_requests (id, order_id, dealer_id, status) VALUES (?, ?, ?, "pending")',
      [id, order_id, dealer_id]
    );

    // Actualizar estado del pedido
    await pool.query("UPDATE orders SET status = 'waiting_dealer', dealer_id = ? WHERE id = ?", [dealer_id, order_id]);

    res.status(201).json({ request: { id, order_id, dealer_id, status: 'pending' } });
  } catch (error) {
    console.error('Dealer request error:', error);
    res.status(500).json({ error: 'Error al solicitar dealer' });
  }
});

// POST /dealers/respond/:requestId — dealer acepta o rechaza
router.post('/respond/:requestId', authenticate, authorize('dealer'), async (req: AuthRequest, res: Response) => {
  try {
    const { action } = req.body; // 'accept' | 'reject'
    if (!['accept', 'reject'].includes(action)) {
      res.status(400).json({ error: 'action debe ser accept o reject' });
      return;
    }

    const [reqs] = await pool.query(
      'SELECT * FROM dealer_requests WHERE id = ? AND dealer_id = ? AND status = "pending"',
      [req.params.requestId, req.user!.userId]
    );
    const requests = reqs as any[];
    if (requests.length === 0) {
      res.status(404).json({ error: 'Solicitud no encontrada' });
      return;
    }
    const request = requests[0];

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    await pool.query(
      'UPDATE dealer_requests SET status = ?, responded_at = NOW() WHERE id = ?',
      [newStatus, request.id]
    );

    if (action === 'accept') {
      // Generar código de validación
      const validationCode = 'DX-' + Math.floor(10000 + Math.random() * 90000);
      const qrToken = JSON.stringify({ orderId: request.order_id, code: validationCode, dealerId: req.user!.userId });
      const validationId = uuid();

      await pool.query(
        'INSERT INTO order_validations (id, order_id, validation_code, qr_token) VALUES (?, ?, ?, ?)',
        [validationId, request.order_id, validationCode, qrToken]
      );

      await pool.query(
        "UPDATE orders SET status = 'accepted', dealer_id = ?, validation_id = ? WHERE id = ?",
        [req.user!.userId, validationId, request.order_id]
      );

      // Mensaje del sistema
      const msgId = uuid();
      await pool.query(
        'INSERT INTO messages (id, order_id, sender_id, sender_role, message_type, message) VALUES (?, ?, ?, "system", "system", ?)',
        [msgId, request.order_id, req.user!.userId, 'Dealer asignado. ¡El chat está activo!']
      );

      res.json({ success: true, status: 'accepted', validation_code: validationCode });
    } else {
      await pool.query("UPDATE orders SET status = 'pending', dealer_id = NULL WHERE id = ?", [request.order_id]);
      res.json({ success: true, status: 'rejected' });
    }
  } catch (error) {
    console.error('Dealer respond error:', error);
    res.status(500).json({ error: 'Error al responder solicitud' });
  }
});

// POST /dealers/validate — dealer valida entrega con código o QR
router.post('/validate', authenticate, authorize('dealer'), async (req: AuthRequest, res: Response) => {
  try {
    const { validation_code } = req.body;
    if (!validation_code) {
      res.status(400).json({ error: 'validation_code requerido' });
      return;
    }

    const [rows] = await pool.query(
      'SELECT ov.*, o.dealer_id FROM order_validations ov JOIN orders o ON o.id = ov.order_id WHERE ov.validation_code = ? AND ov.validated = 0',
      [validation_code]
    );
    const validations = rows as any[];
    if (validations.length === 0) {
      res.status(404).json({ error: 'Código inválido o ya utilizado' });
      return;
    }
    const validation = validations[0];

    if (validation.dealer_id !== req.user!.userId) {
      res.status(403).json({ error: 'No autorizado para validar este pedido' });
      return;
    }

    await pool.query(
      'UPDATE order_validations SET validated = 1, validated_at = NOW(), validated_by = ? WHERE id = ?',
      [req.user!.userId, validation.id]
    );

    await pool.query(
      "UPDATE orders SET status = 'delivered', updated_at = NOW() WHERE id = ?",
      [validation.order_id]
    );

    // XP al dealer
    await pool.query(
      'UPDATE dealer_stats SET completed_orders = completed_orders + 1, xp = xp + 100 WHERE user_id = ?',
      [req.user!.userId]
    );

    // Actualizar rango
    const [statsRows] = await pool.query('SELECT xp FROM dealer_stats WHERE user_id = ?', [req.user!.userId]);
    const xp = (statsRows as any[])[0]?.xp || 0;
    let rank = 'Bronze';
    if (xp >= 15000) rank = 'Elite';
    else if (xp >= 5000) rank = 'Gold';
    else if (xp >= 1000) rank = 'Silver';
    await pool.query('UPDATE dealer_stats SET `rank` = ? WHERE user_id = ?', [rank, req.user!.userId]);

    const msgId = uuid();
    await pool.query(
      'INSERT INTO messages (id, order_id, sender_id, sender_role, message_type, message) VALUES (?, ?, ?, "system", "system", ?)',
      [msgId, validation.order_id, req.user!.userId, '✅ Pedido entregado y validado. ¡Gracias por usar DAIMUZ!']
    );

    res.json({ success: true, order_id: validation.order_id });
  } catch (error) {
    console.error('Validate error:', error);
    res.status(500).json({ error: 'Error al validar entrega' });
  }
});

// GET /dealers/requests — dealer ve sus solicitudes pendientes
router.get('/requests', authenticate, authorize('dealer'), async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT dr.*, o.total, o.delivery_address, o.notes
       FROM dealer_requests dr
       JOIN orders o ON o.id = dr.order_id
       WHERE dr.dealer_id = ? AND dr.status = 'pending'
       ORDER BY dr.created_at DESC`,
      [req.user!.userId]
    );
    res.json({ requests: rows });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener solicitudes' });
  }
});

export default router;
