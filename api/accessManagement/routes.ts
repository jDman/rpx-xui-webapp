import * as express from 'express';
import { getBookings, postBooking, refreshRoleAssignments } from '.';
import authInterceptor from '../lib/middleware/auth';

const router = express.Router({ mergeParams: true });
router.use(authInterceptor);

router.post('/booking', postBooking);
router.get('/bookings', getBookings);
router.post('/role-mapping/judicial/refresh', refreshRoleAssignments);

export default router;