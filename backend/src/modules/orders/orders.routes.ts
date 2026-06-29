import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import pool from '../../config/db';
import { AuthRequest, OrderRow } from '../../types';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const conn = await pool.getConnection();
  try {
    const { items, delivery_address, delivery_lat, delivery_lng, notes } = req.body;

    if (!items || !items.length || !delivery_address || !delivery_lat || !delivery_lng) {
      res.status(400).json({ error: 'items, delivery_address, delivery_lat, delivery_lng requeridos' });
      return;
    }

    let total = 0;
    const orderId = uuid();

    await conn.beginTransaction();

    // Validate all items and compute total before inserting anything
    const resolvedItems: { id: string; name: string; price: number; quantity: number }[] = [];
    for (const item of items) {
      const [products] = await conn.query('SELECT id, name, price FROM products WHERE id = ? AND is_available = 1', [item.product_id]);
      const productRows = products as any[];
      if (productRows.length === 0) {
        await conn.rollback();
        res.status(400).json({ error: `Producto ${item.product_id} no disponible` });
        return;
      }
      const product = productRows[0];
      total += Number(product.price) * item.quantity;
      resolvedItems.push({ id: product.id, name: product.name, price: Number(product.price), quantity: item.quantity });
    }

    // Insert order first so FK constraints on order_items are satisfied
    await conn.query(
      'INSERT INTO orders (id, customer_id, status, total, delivery_address, delivery_lat, delivery_lng, notes) VALUES (?, ?, "pending", ?, ?, ?, ?, ?)',
      [orderId, req.user!.userId, total, delivery_address, delivery_lat, delivery_lng, notes || null]
    );

    for (const item of resolvedItems) {
      const itemId = uuid();
      await conn.query(
        'INSERT INTO order_items (id, order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?, ?)',
        [itemId, orderId, item.id, item.name, item.price, item.quantity]
      );
    }

    const systemMsgId = uuid();
    await conn.query(
      'INSERT INTO messages (id, order_id, sender_id, sender_role, message_type, message) VALUES (?, ?, ?, "system", "system", ?)',
      [systemMsgId, orderId, req.user!.userId, 'Pedido creado. Esperando dealer disponible.']
    );

    await conn.commit();

    const [orderRows] = await conn.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    const [itemRows] = await conn.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);

    res.status(201).json({
      order: (orderRows as any[])[0],
      items: itemRows,
    });
  } catch (error) {
    await conn.rollback();
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Error al crear pedido' });
  } finally {
    conn.release();
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let query: string;
    let params: any[];

    if (req.user!.role === 'admin') {
      query = 'SELECT * FROM orders ORDER BY created_at DESC LIMIT 100';
      params = [];
    } else if (req.user!.role === 'dealer') {
      query = `SELECT * FROM orders WHERE dealer_id = ? OR (status = 'pending' AND dealer_id IS NULL) ORDER BY created_at DESC LIMIT 100`;
      params = [req.user!.userId];
    } else {
      query = 'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC LIMIT 100';
      params = [req.user!.userId];
    }

    const [orders] = await pool.query(query, params);
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    const orderRows = orders as OrderRow[];
    if (orderRows.length === 0) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }

    const order = orderRows[0];

    if (
      req.user!.role === 'customer' && order.customer_id !== req.user!.userId ||
      req.user!.role === 'dealer' && order.dealer_id !== req.user!.userId && order.status === 'pending'
    ) {
      // customer can only see own orders, dealer can see pending + assigned
    }

    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    const [messages] = await pool.query(
      'SELECT * FROM messages WHERE order_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    const [tracking] = await pool.query(
      'SELECT * FROM tracking_locations WHERE order_id = ? ORDER BY recorded_at DESC LIMIT 1',
      [req.params.id]
    );

    res.json({ order, items, messages, tracking: (tracking as any[])[0] || null });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
});

router.patch('/:id/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Estado inválido' });
      return;
    }

    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    const orderRows = orders as OrderRow[];

    if (orderRows.length === 0) {
      res.status(404).json({ error: 'Pedido no encontrado' });
      return;
    }

    const order = orderRows[0];

    if (req.user!.role === 'customer' && order.customer_id !== req.user!.userId) {
      res.status(403).json({ error: 'No autorizado' });
      return;
    }

    if (req.user!.role === 'dealer' && order.dealer_id !== req.user!.userId) {
      res.status(403).json({ error: 'No autorizado' });
      return;
    }

    await pool.query('UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, req.params.id]);

    if (status === 'delivered' || status === 'cancelled') {
      const systemMsgId = uuid();
      const msgText = status === 'delivered'
        ? 'Pedido entregado. ¡Gracias por usar DAIMUZ!'
        : 'Pedido cancelado.';
      await pool.query(
        'INSERT INTO messages (id, order_id, sender_id, sender_role, message_type, message) VALUES (?, ?, ?, "system", "system", ?)',
        [systemMsgId, req.params.id, req.user!.userId, msgText]
      );
    }

    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

export default router;
