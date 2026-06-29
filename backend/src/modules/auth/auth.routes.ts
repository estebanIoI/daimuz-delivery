import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import pool from '../../config/db';
import { signToken } from '../../utils/jwt';
import { AuthRequest, UserRow } from '../../types';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, phone, role } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, contraseña y nombre son requeridos' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if ((existing as any[]).length > 0) {
      res.status(409).json({ error: 'El email ya está registrado' });
      return;
    }

    const id = uuid();
    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = role === 'dealer' ? 'dealer' : role === 'admin' ? 'admin' : 'customer';

    await pool.query(
      'INSERT INTO users (id, email, password_hash, name, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [id, email, passwordHash, name, phone || null, userRole]
    );

    if (userRole === 'dealer') {
      const statsId = uuid();
      await pool.query(
        'INSERT INTO dealer_stats (id, user_id, completed_orders, rating_avg, xp, `rank`, total_distance) VALUES (?, ?, 0, 0, 0, "Bronze", 0)',
        [statsId, id]
      );
    }

    const walletId = uuid();
    await pool.query(
      'INSERT INTO reward_wallets (id, user_id, points) VALUES (?, ?, 0)',
      [walletId, id]
    );

    const token = signToken({ userId: id, role: userRole });

    res.status(201).json({
      token,
      user: { id, email, name, phone, role: userRole },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email y contraseña requeridos' });
      return;
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
    const users = rows as UserRow[];

    if (users.length === 0) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    const token = signToken({ userId: user.id, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, name, phone, role, avatar_url, is_active, created_at FROM users WHERE id = ?',
      [req.user!.userId]
    );
    const users = rows as any[];

    if (users.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const user = users[0];
    let dealerStats = null;
    let wallet = null;

    if (user.role === 'dealer') {
      const [stats] = await pool.query('SELECT * FROM dealer_stats WHERE user_id = ?', [user.id]);
      dealerStats = (stats as any[])[0] || null;
    }

    const [wallets] = await pool.query('SELECT * FROM reward_wallets WHERE user_id = ?', [user.id]);
    wallet = (wallets as any[])[0] || null;

    res.json({ user: { ...user, dealerStats, wallet } });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

export default router;
