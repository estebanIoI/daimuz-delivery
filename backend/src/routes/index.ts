import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';
import commercesRoutes from '../modules/commerces/commerces.routes';
import dealersRoutes from '../modules/dealers/dealers.routes';
import zonesRoutes from '../modules/zones/zones.routes';
import productsRoutes from '../modules/products/products.routes';
import categoriesRoutes from '../modules/categories/categories.routes';
import ordersRoutes from '../modules/orders/orders.routes';
import deliveryRoutes from '../modules/delivery/delivery.routes';
import messagesRoutes from '../modules/messages/messages.routes';
import trackingRoutes from '../modules/tracking/tracking.routes';
import uploadRoutes from '../modules/upload/upload.routes';
import settingsRoutes from '../modules/settings/settings.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/commerces', commercesRoutes);
router.use('/dealers', dealersRoutes);
router.use('/zones', zonesRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/orders', ordersRoutes);
router.use('/delivery', deliveryRoutes);
router.use('/chat', messagesRoutes);
router.use('/tracking', trackingRoutes);
router.use('/upload', uploadRoutes);
router.use('/settings', settingsRoutes);

export default router;
