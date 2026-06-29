import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import pool from '../../config/db';
import { AuthRequest } from '../../types';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE is_available = 1 ORDER BY sort_order, name'
    );
    res.json({ products: rows });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    const products = rows as any[];
    if (products.length === 0) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }
    res.json({ product: products[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { category_id, name, description, price, image_url, sort_order } = req.body;

    if (!category_id || !name || !price) {
      res.status(400).json({ error: 'category_id, name, price requeridos' });
      return;
    }

    const id = uuid();
    await pool.query(
      'INSERT INTO products (id, category_id, name, description, price, image_url, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
      [id, category_id, name, description || null, price, image_url || null, sort_order || 0]
    );

    res.status(201).json({ product: { id, category_id, name, description, price, image_url, is_available: 1, sort_order } });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { category_id, name, description, price, image_url, is_available, sort_order } = req.body;
    await pool.query(
      'UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, image_url = ?, is_available = ?, sort_order = ? WHERE id = ?',
      [category_id, name, description, price, image_url, is_available, sort_order, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE products SET is_available = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

export default router;
