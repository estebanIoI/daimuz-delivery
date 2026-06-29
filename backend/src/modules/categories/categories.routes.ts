import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import pool from '../../config/db';
import { AuthRequest } from '../../types';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id AND p.is_available = 1 WHERE c.is_active = 1 GROUP BY c.id ORDER BY c.sort_order'
    );
    res.json({ categories: rows });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

router.get('/:id/products', async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM products WHERE category_id = ? AND is_available = 1 ORDER BY sort_order, name',
      [req.params.id]
    );
    res.json({ products: rows });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos de categoría' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, image_url, sort_order } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name requerido' });
      return;
    }
    const id = uuid();
    await pool.query(
      'INSERT INTO categories (id, name, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, 1)',
      [id, name, image_url || null, sort_order || 0]
    );
    res.status(201).json({ category: { id, name, image_url, sort_order, is_active: 1 } });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, image_url, sort_order, is_active } = req.body;
    await pool.query(
      'UPDATE categories SET name = ?, image_url = ?, sort_order = ?, is_active = ? WHERE id = ?',
      [name, image_url, sort_order, is_active, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
});

router.delete('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE categories SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
});

export default router;
