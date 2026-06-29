import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import pool from '../../config/db';
import { AuthRequest } from '../../types';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// GET /commerces — feed de comercios
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*,
        (SELECT COUNT(*) FROM products p WHERE p.commerce_id = c.id AND p.is_available = 1) as product_count
       FROM commerces c
       ORDER BY c.sort_order, c.name`
    );
    res.json({ commerces: rows });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener comercios' });
  }
});

// GET /commerces/:slug — detalle del comercio con categorías y productos
router.get('/:slug', async (req: AuthRequest, res: Response) => {
  try {
    const [commerceRows] = await pool.query(
      'SELECT * FROM commerces WHERE slug = ?',
      [req.params.slug]
    );
    const commerces = commerceRows as any[];
    if (commerces.length === 0) {
      res.status(404).json({ error: 'Comercio no encontrado' });
      return;
    }
    const commerce = commerces[0];

    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE commerce_id = ? AND is_active = 1 ORDER BY sort_order, name',
      [commerce.id]
    );

    const [products] = await pool.query(
      'SELECT * FROM products WHERE commerce_id = ? AND is_available = 1 ORDER BY sort_order, name',
      [commerce.id]
    );

    res.json({
      commerce,
      categories,
      products: (products as any[]).map((p) => ({ ...p, price: Number(p.price) })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener comercio' });
  }
});

// POST /commerces — admin crea comercio
router.post('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { slug, name, description, logo_url, banner_url, city, avg_delivery_time, delivery_fee, rating } = req.body;
    if (!slug || !name) {
      res.status(400).json({ error: 'slug y name requeridos' });
      return;
    }
    const id = uuid();
    await pool.query(
      'INSERT INTO commerces (id, slug, name, description, logo_url, banner_url, city, avg_delivery_time, delivery_fee, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, slug, name, description || null, logo_url || null, banner_url || null, city || 'Mocoa', avg_delivery_time || '30-40 min', delivery_fee || 3900, rating || 5.0]
    );
    res.status(201).json({ commerce: { id, slug, name } });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'El slug ya existe' });
      return;
    }
    res.status(500).json({ error: 'Error al crear comercio' });
  }
});

// PATCH /commerces/:id — admin actualiza comercio
router.patch('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, is_open, logo_url, banner_url, avg_delivery_time, delivery_fee, sort_order } = req.body;
    await pool.query(
      'UPDATE commerces SET name=?, description=?, is_open=?, logo_url=?, banner_url=?, avg_delivery_time=?, delivery_fee=?, sort_order=? WHERE id=?',
      [name, description, is_open, logo_url, banner_url, avg_delivery_time, delivery_fee, sort_order, req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar comercio' });
  }
});

export default router;
