import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import pool from './db';

dotenv.config();

interface CloudinaryConfig {
  cloud_name?: string;
  api_key?: string;
  api_secret?: string;
}

/**
 * Lee la configuración de Cloudinary: primero de la BD (app_settings),
 * con fallback a las variables de entorno.
 */
export async function getCloudinaryConfig(): Promise<CloudinaryConfig> {
  let fromDb: Record<string, string> = {};
  try {
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM app_settings WHERE setting_key IN ('cloudinary_cloud_name','cloudinary_api_key','cloudinary_api_secret')"
    );
    for (const r of rows as any[]) {
      if (r.setting_value) fromDb[r.setting_key] = r.setting_value;
    }
  } catch {
    // tabla puede no existir todavía; usamos env
  }
  return {
    cloud_name: fromDb['cloudinary_cloud_name'] || process.env.CLOUDINARY_CLOUD_NAME || undefined,
    api_key: fromDb['cloudinary_api_key'] || process.env.CLOUDINARY_API_KEY || undefined,
    api_secret: fromDb['cloudinary_api_secret'] || process.env.CLOUDINARY_API_SECRET || undefined,
  };
}

export async function isCloudinaryEnabled(): Promise<boolean> {
  const c = await getCloudinaryConfig();
  return Boolean(c.cloud_name && c.api_key && c.api_secret);
}

/**
 * Sube un buffer a Cloudinary y devuelve la URL segura.
 */
export async function uploadToCloudinary(buffer: Buffer, folder = 'daimuz'): Promise<string> {
  const c = await getCloudinaryConfig();
  cloudinary.config({
    cloud_name: c.cloud_name,
    api_key: c.api_key,
    api_secret: c.api_secret,
    secure: true,
  });

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary no devolvió resultado'));
          return;
        }
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

export default cloudinary;
