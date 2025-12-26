import logger from '@/config/logger';
import { authMiddleware } from '@/middlewares/auth';
import { trainingBatchService } from '@/services/training/trainingBatch.service';
import { Router } from 'express';

const router = Router();
router.get('/', async (req, res) => {
  try {
    const { batchId, profileId, status, page, limit } = req.query;

    if (batchId) {
      const enrollments = await trainingBatchService.getEnrollments(batchId as string);
      res.json({ success: true, data: enrollments });
    } else {
      // For now, return empty if no batchId - could implement global search later
      res.json({ success: true, data: [], pagination: { total: 0 } });
    }
  } catch (error: any) {
    logger.error('Error fetching enrollments', { error });
    res
      .status(500)
      .json({ success: false, message: error.message || 'Failed to fetch enrollments' });
  }
});

// Create single enrollment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { batch_id, batchId, profile_id, profileId, notes } = req.body;
    const actualBatchId = batch_id || batchId;
    const actualProfileId = profile_id || profileId;

    if (!actualBatchId || !actualProfileId) {
      res.status(400).json({ success: false, message: 'batch_id and profileId are required' });
      return;
    }

    const enrollment = await trainingBatchService.createEnrollment(
      actualBatchId,
      { profileId: actualProfileId, notes },
      req.user?.id
    );

    res
      .status(201)
      .json({ success: true, message: 'Enrollment created successfully', data: enrollment });
  } catch (error: any) {
    const status = error.message.includes('not found')
      ? 404
      : error.message.includes('already')
        ? 400
        : 500;
    res
      .status(status)
      .json({ success: false, message: error.message || 'Failed to create enrollment' });
  }
});

// =====================================================
// BULK ROUTES - Must be defined BEFORE /:id routes
// =====================================================

// Bulk enroll profiles
router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const {
      batch_id,
      batchId,
      profile_ids,
      profileIds,
      enrolled_by_user_id,
      enrolledByProfileId,
      notes,
      enrollment_date,
    } = req.body;

    const actualBatchId = batch_id || batchId;
    const actualProfileIds = profile_ids || profileIds || [];
    const enrolledBy = enrolled_by_user_id || enrolledByProfileId || req.user?.id;

    logger.info('Bulk enrollment request', {
      batchId: actualBatchId,
      profileCount: actualProfileIds.length,
      enrolledBy,
    });

    if (!actualBatchId) {
      res.status(400).json({ success: false, message: 'batch_id is required' });
      return;
    }

    if (!actualProfileIds || actualProfileIds.length === 0) {
      res
        .status(400)
        .json({ success: false, message: 'profileIds array is required and must not be empty' });
      return;
    }

    const results = {
      enrolled: [] as any[],
      failed: [] as { profileId: string; error: string }[],
    };

    // Enroll each profile
    for (const profileId of actualProfileIds) {
      try {
        const enrollment = await trainingBatchService.createEnrollment(
          actualBatchId,
          { profileId, notes },
          enrolledBy
        );
        results.enrolled.push(enrollment);
      } catch (error: any) {
        results.failed.push({ profileId, error: error.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `Enrolled ${results.enrolled.length} profiles, ${results.failed.length} failed`,
      data: results,
    });
  } catch (error: any) {
    logger.error('Error in bulk enrollment', { error });
    res.status(500).json({ success: false, message: error.message || 'Failed to bulk enroll' });
  }
});

// Bulk complete enrollments
router.post('/bulk/complete', authMiddleware, async (req, res) => {
  try {
    const { enrollmentIds, enrollment_ids } = req.body;
    const rawIds = enrollmentIds || enrollment_ids || [];

    logger.info('Bulk complete request received', {
      rawIds,
      count: rawIds.length,
      types: rawIds.map((id: any) => typeof id),
    });

    if (!rawIds.length) {
      res.status(400).json({ success: false, message: 'enrollmentIds array is required' });
      return;
    }

    // UUID regex pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Filter and validate UUIDs
    const validIds: string[] = [];
    const invalidIds: { id: any; reason: string }[] = [];

    for (const id of rawIds) {
      if (typeof id !== 'string') {
        invalidIds.push({ id, reason: `Invalid type: ${typeof id}` });
      } else if (!uuidPattern.test(id)) {
        invalidIds.push({ id, reason: 'Invalid UUID format' });
      } else {
        validIds.push(id);
      }
    }

    if (invalidIds.length > 0) {
      logger.warn('Invalid enrollment IDs found in bulk complete', { invalidIds });
    }

    if (validIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No valid enrollment IDs provided',
        invalidIds,
      });
      return;
    }

    const results = {
      completed: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const id of validIds) {
      try {
        await trainingBatchService.completeEnrollment(id, {}, req.user?.id);
        results.completed.push(id);
      } catch (error: any) {
        results.failed.push({ id, error: error.message });
      }
    }

    const responseData: any = {
      success: results.completed.length,
      failed: results.failed.length,
      details: results,
    };

    if (invalidIds.length > 0) {
      responseData.invalidIds = invalidIds;
    }

    res.json({
      success: true,
      message: `Completed ${results.completed.length} enrollments, ${results.failed.length} failed${invalidIds.length > 0 ? `, ${invalidIds.length} invalid IDs skipped` : ''}`,
      data: responseData,
    });
  } catch (error: any) {
    logger.error('Bulk complete error', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: error.message || 'Failed to bulk complete' });
  }
});

// Bulk drop enrollments
router.post('/bulk/drop', authMiddleware, async (req, res) => {
  try {
    const { enrollmentIds, enrollment_ids, dropReason, drop_reason } = req.body;
    const ids = enrollmentIds || enrollment_ids || [];
    const reason = dropReason || drop_reason || 'Bulk dropped';

    if (!ids.length) {
      res.status(400).json({ success: false, message: 'enrollmentIds array is required' });
      return;
    }

    const results = {
      dropped: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const id of ids) {
      try {
        await trainingBatchService.dropEnrollment(id, { dropReason: reason });
        results.dropped.push(id);
      } catch (error: any) {
        results.failed.push({ id, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Dropped ${results.dropped.length} enrollments, ${results.failed.length} failed`,
      data: results,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to bulk drop' });
  }
});

// Bulk remove enrollments (delete - for scheduled/upcoming batches only)
router.post('/bulk/remove', authMiddleware, async (req, res) => {
  try {
    const { enrollmentIds, enrollment_ids } = req.body;
    const ids = enrollmentIds || enrollment_ids || [];

    if (!ids.length) {
      res.status(400).json({ success: false, message: 'enrollmentIds array is required' });
      return;
    }

    const results = {
      removed: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    for (const id of ids) {
      try {
        await trainingBatchService.removeEnrollment(id);
        results.removed.push(id);
      } catch (error: any) {
        results.failed.push({ id, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Removed ${results.removed.length} enrollments, ${results.failed.length} failed`,
      data: { success: results.removed.length, failed: results.failed.length, details: results },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to bulk remove' });
  }
});

// =====================================================
// PARAMETERIZED ROUTES - Must come AFTER static routes
// =====================================================

// Get single enrollment by ID
router.get('/:id', async (req, res) => {
  try {
    // For now, we don't have a getEnrollmentById method, so return 404
    res.status(404).json({
      success: false,
      message: 'Use /training-batches/:batchId/enrollments to get enrollments',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update enrollment
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const enrollment = await trainingBatchService.updateEnrollment(req.params.id, req.body);
    res.json({ success: true, message: 'Enrollment updated successfully', data: enrollment });
  } catch (error: any) {
    const status = error.message === 'Enrollment not found' ? 404 : 500;
    res
      .status(status)
      .json({ success: false, message: error.message || 'Failed to update enrollment' });
  }
});

// Complete enrollment
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const enrollment = await trainingBatchService.completeEnrollment(
      req.params.id,
      req.body,
      req.user?.id
    );
    res.json({ success: true, message: 'Enrollment completed successfully', data: enrollment });
  } catch (error: any) {
    const status = error.message === 'Enrollment not found' ? 404 : 500;
    res
      .status(status)
      .json({ success: false, message: error.message || 'Failed to complete enrollment' });
  }
});

// Drop enrollment
router.post('/:id/drop', authMiddleware, async (req, res) => {
  try {
    const { dropReason, drop_reason } = req.body;
    const reason = dropReason || drop_reason;

    if (!reason) {
      res.status(400).json({ success: false, message: 'dropReason is required' });
      return;
    }

    const enrollment = await trainingBatchService.dropEnrollment(req.params.id, {
      dropReason: reason,
    });
    res.json({ success: true, message: 'Enrollment dropped successfully', data: enrollment });
  } catch (error: any) {
    const status = error.message === 'Enrollment not found' ? 404 : 500;
    res
      .status(status)
      .json({ success: false, message: error.message || 'Failed to drop enrollment' });
  }
});

// Remove enrollment (for upcoming batches - completely deletes the enrollment)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await trainingBatchService.removeEnrollment(req.params.id);
    res.json(result);
  } catch (error: any) {
    const status =
      error.message === 'Enrollment not found'
        ? 404
        : error.message.includes('only remove')
          ? 400
          : 500;
    res
      .status(status)
      .json({ success: false, message: error.message || 'Failed to remove enrollment' });
  }
});

export default router;
