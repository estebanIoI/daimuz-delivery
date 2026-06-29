import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { AuthRequest } from '../../types';
import { authenticate } from '../../middleware/auth';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const upload = multer({
  storage,
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
  (req: AuthRequest, res: Response) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Archivo requerido' });
      return;
    }

    const url = `/uploads/${file.filename}`;

    res.status(201).json({
      url,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    });
  }
);

export default router;
