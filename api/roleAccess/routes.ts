import { Router } from 'express';
import authInterceptor from '../lib/middleware/auth';
import { deleteRoleByCaseAndRoleId } from '../workAllocation2';
import { confirmUserExclusion, deleteUserExclusion, getUserExclusions } from './exclusionService';
import { confirmAllocateRole } from './index';

const router = Router({ mergeParams: true });
router.use(authInterceptor);

router.get('/exclusions/get', getUserExclusions);
router.post('/exclusions/confirm', confirmUserExclusion);
router.post('/exclusions/delete', deleteUserExclusion);

router.post('/allocate-role/confirm', confirmAllocateRole);
router.post('/allocate-role/delete', deleteRoleByCaseAndRoleId);

export default router;