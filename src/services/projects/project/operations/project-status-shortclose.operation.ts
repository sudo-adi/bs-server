import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

interface UploadedDocument {
  document_title: string;
  file_url: string;
  uploaded_by_user_id: string;
}

/**
 * Short Close Project Operation
 * Short closes a project (early completion) and handles worker stage transitions
 * Business Rule 18: All workers become benched
 */
export class ShortCloseProjectOperation {
  /**
   * Short close a project and update worker stages
   * @param documents - Already uploaded documents with URLs from controller
   */
  async shortCloseProject(
    projectId: string,
    userId: string,
    actualEndDate: Date,
    shortCloseReason: string,
    documents?: UploadedDocument[]
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get and validate project
      const project = await tx.projects.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      // Validate current status - cannot short close completed/terminated projects
      if (project.status && ['completed', 'terminated', 'short_closed'].includes(project.status)) {
        throw new AppError(`Cannot short close project with ${project.status} status.`, 400);
      }

      // 2. Get all active workers assigned to this project
      const assignments = await tx.project_worker_assignments.findMany({
        where: {
          project_id: projectId,
          removed_at: null,
        },
        include: {
          profiles: {
            select: {
              id: true,
              current_stage: true,
            },
          },
        },
      });

      const profileIds = assignments.map((a) => a.profile_id);

      const workersUpdated = {
        count: profileIds.length,
        profile_ids: profileIds,
        new_stage: 'benched',
      };

      // 3. Rule 18: All workers become benched
      if (profileIds.length > 0) {
        await tx.profiles.updateMany({
          where: { id: { in: profileIds } },
          data: { current_stage: 'benched' },
        });

        // Create stage transitions for each worker
        const stageTransitions = assignments.map((assignment) => ({
          profile_id: assignment.profile_id,
          from_stage: assignment.profiles.current_stage,
          to_stage: 'benched' as const,
          transitioned_by_user_id: userId,
          transitioned_at: new Date(),
          notes: `Auto-transitioned: Project ${project.code} short closed`,
        }));

        await tx.stage_transitions.createMany({ data: stageTransitions });
      }

      // 4. Update project status to short_closed
      const updatedProject = await tx.projects.update({
        where: { id: projectId },
        data: {
          status: 'short_closed',
          actual_end_date: actualEndDate,
        },
      });

      // 5. Create project status history
      const statusHistory = await tx.project_status_history.create({
        data: {
          project_id: projectId,
          from_status: project.status,
          to_status: 'short_closed',
          changed_by_user_id: userId,
          status_date: actualEndDate,
          change_reason: `Project short closed: ${shortCloseReason}`,
        },
      });

      // 6. Create status documents if provided
      const createdDocuments = [];
      if (documents && documents.length > 0) {
        for (const doc of documents) {
          const document = await tx.project_status_documents.create({
            data: {
              project_status_history_id: statusHistory.id,
              project_id: projectId,
              status: 'short_closed',
              document_title: doc.document_title,
              file_url: doc.file_url,
              uploaded_by_user_id: doc.uploaded_by_user_id || userId,
            },
          });
          createdDocuments.push(document);
        }
      }

      return {
        project: updatedProject,
        workers_updated: workersUpdated,
        short_close_reason: shortCloseReason,
        documents: createdDocuments,
      };
    });
  }
}

export default new ShortCloseProjectOperation();
