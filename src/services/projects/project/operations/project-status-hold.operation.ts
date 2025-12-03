import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

interface UploadedDocument {
  document_title: string;
  file_url: string;
  uploaded_by_user_id: string;
}

/**
 * Hold Project Operation
 * Puts project on hold
 * Business Rules 14-15:
 * - If hold reason is 'employer': Workers stay deployed
 * - If hold reason is 'buildsewa' or 'force_majeure': All deployed workers become on_hold
 */
export class HoldProjectOperation {
  /**
   * Put a project on hold and update worker stages based on reason
   * @param documents - Already uploaded documents with URLs from controller
   */
  async holdProject(
    projectId: string,
    userId: string,
    onHoldReason: 'employer' | 'buildsewa' | 'force_majeure',
    notes?: string,
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

      // Validate current status - can only hold ongoing projects
      if (project.status !== 'ongoing') {
        throw new AppError(
          `Cannot put project on hold from ${project.status} status. Must be ongoing.`,
          400
        );
      }

      // Validate hold reason
      if (!['employer', 'buildsewa', 'force_majeure'].includes(onHoldReason)) {
        throw new AppError(
          'Invalid hold reason. Must be: employer, buildsewa, or force_majeure',
          400
        );
      }

      // 2. Update project status to on_hold
      const updatedProject = await tx.projects.update({
        where: { id: projectId },
        data: {
          status: 'on_hold',
          on_hold_reason: onHoldReason,
        },
      });

      let workersUpdated = {
        count: 0,
        profile_ids: [] as string[],
        new_stage: null as string | null,
      };

      // 3. Handle worker stage transitions based on hold reason
      if (['buildsewa', 'force_majeure'].includes(onHoldReason)) {
        // Get all deployed workers assigned to this project
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

        // Filter only deployed workers
        const deployedAssignments = assignments.filter(
          (a) => a.profiles.current_stage === 'deployed'
        );

        const profileIds = deployedAssignments.map((a) => a.profile_id);

        if (profileIds.length > 0) {
          // Update all deployed workers to on_hold stage
          await tx.profiles.updateMany({
            where: { id: { in: profileIds } },
            data: { current_stage: 'on_hold' },
          });

          // Create stage transitions for each worker
          const stageTransitions = deployedAssignments.map((assignment) => ({
            profile_id: assignment.profile_id,
            from_stage: 'deployed' as const,
            to_stage: 'on_hold' as const,
            transitioned_by_user_id: userId,
            transitioned_at: new Date(),
            notes: `Auto-transitioned: Project ${project.code} put on hold (${onHoldReason})`,
          }));

          await tx.stage_transitions.createMany({ data: stageTransitions });

          workersUpdated = {
            count: profileIds.length,
            profile_ids: profileIds,
            new_stage: 'on_hold',
          };
        }
      } else {
        // onHoldReason === 'employer'
        // Workers stay deployed - no stage change
        workersUpdated = {
          count: 0,
          profile_ids: [],
          new_stage: 'deployed (no change)',
        };
      }

      // 4. Create project status history
      const statusHistory = await tx.project_status_history.create({
        data: {
          project_id: projectId,
          from_status: project.status,
          to_status: 'on_hold',
          changed_by_user_id: userId,
          status_date: new Date(),
          change_reason: notes || `Project put on hold: ${onHoldReason}`,
          attributable_to: onHoldReason,
        },
      });

      // 5. Create status documents if provided
      const createdDocuments = [];
      if (documents && documents.length > 0) {
        for (const doc of documents) {
          const document = await tx.project_status_documents.create({
            data: {
              project_status_history_id: statusHistory.id,
              project_id: projectId,
              status: 'on_hold',
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
        hold_reason: onHoldReason,
        documents: createdDocuments,
      };
    });
  }
}

export default new HoldProjectOperation();
