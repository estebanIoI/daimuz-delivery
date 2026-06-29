import { Router, Response } from 'express';
import pool from '../../config/db';
import { AuthRequest } from '../../types';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/dealers', authenticate, authorize('admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.is_active,
              ds.completed_orders, ds.rating_avg, ds.xp, ds.rank, ds.total_distance
       FROM users u
       LEFT JOIN dealer_stats ds ON ds.user_id = u.id
       WHERE u.role = 'dealer'
       ORDER BY ds.xp DESC, u.name`
    );
    const users = (rows as any[]).map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      is_active: u.is_active,
      dealerStats: u.completed_orders != null ? {
        completed_orders: u.completed_orders,
        rating_avg: Number(u.rating_avg),
        xp: u.xp,
        rank: u.rank,
        total_distance: Number(u.total_distance),
      } : null,
    }));
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener dealers' });
  }
});

export default router;
