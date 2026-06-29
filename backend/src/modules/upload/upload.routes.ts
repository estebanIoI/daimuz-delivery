import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import { AuthRequest } from '../../types';
import { authenticate } from '../../middleware/auth';
import { cloudinaryEnabled, uploadToCloudinary } from '../../config/cloudinary';

// Guardamos en memoria para poder enviar el buffer a Cloudinary.
// Si Cloudinary no está configurado, escribimos el buffer a disco local.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Solo imágenes (jpeg, jpg, png, gif, webp)'));
    }
  },
});

const uploadsDir = path.join(__dirname, '../../uploads');

const router = Router();

router.post(
  '/',
  authenticate,
  (req: AuthRequest, res: Response, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ error: 'Archivo demasiado grande (máx 5MB)' });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Archivo requerido' });
      return;
    }

    try {
      if (cloudinaryEnabled) {
        const url = await uploadToCloudinary(file.buffer);
        res.status(201).json({ url, provider: 'cloudinary' });
        return;
      }

      // Fallback local
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const ext = path.extname(file.originalname) || '.jpg';
      const filename = `${uuid()}${ext}`;
      fs.writeFileSync(path.join(uploadsDir, filename), file.buffer);

      const host = `${req.protocol}://${req.get('host')}`;
      res.status(201).json({ url: `${host}/uploads/${filename}`, provider: 'local' });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Error al subir la imagen' });
    }
  }
);

export default router;
