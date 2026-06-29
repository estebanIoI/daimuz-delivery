import { Router, Response } from 'express';
import pool from '../../config/db';
import { AuthRequest } from '../../types';
import { authenticate, authorize } from '../../middleware/auth';
import { getCloudinaryConfig, isCloudinaryEnabled } from '../../config/cloudinary';

const router = Router();

async function setSetting(key: string, value: string) {
  await pool.query(
    'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
    [key, value]
  );
}

// GET /settings/cloudinary — estado actual (sin exponer el secret)
router.get('/cloudinary', authenticate, authorize('admin'), async (_req: AuthRequest, res: Response) => {
  try {
    const c = await getCloudinaryConfig();
    res.json({
      cloud_name: c.cloud_name || '',
      api_key: c.api_key || '',
      has_secret: Boolean(c.api_secret),
      enabled: await isCloudinaryEnabled(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// PUT /settings/cloudinary — guardar credenciales
router.put('/cloudinary', authenticate, authorize('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { cloud_name, api_key, api_secret } = req.body;
    if (cloud_name !== undefined) await setSetting('cloudinary_cloud_name', cloud_name || '');
    if (api_key !== undefined) await setSetting('cloudinary_api_key', api_key || '');
    // Solo actualizamos el secret si llega uno no vacío (para no borrarlo al guardar el resto)
    if (api_secret) await setSetting('cloudinary_api_secret', api_secret);
    res.json({ success: true, enabled: await isCloudinaryEnabled() });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
});

export default router;
