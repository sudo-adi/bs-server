import prisma from '@/config/prisma';
import { AppError } from '@/middlewares/errorHandler';

interface UploadedDocument {
  document_title: string;
  file_url: string;
  uploaded_by_user_id: string;
}

/**
 * Terminate Project Operation
 * Terminates a project and handles worker stage transitions
 * Business Rules 16-17:
 * - Rule 16: If terminated before start date → restore workers to previous stages
 * - Rule 17: If terminated after start date → all workers become benched
 */
export class TerminateProjectOperation {
  /**
   * Terminate a project and update worker stages based on termination timing
   * @param documents - Already uploaded documents with URLs from controller
   */
  async terminateProject(
    projectId: string,
    userId: string,
    terminationDate: Date,
    terminationReason: string,
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

      // Validate current status - cannot terminate already completed/terminated projects
      if (project.status && ['completed', 'terminated', 'short_closed'].includes(project.status)) {
        throw new AppError(
          `Cannot terminate project with ${project.status} status.`,
          400
        );
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

      // 3. Determine worker stage transition logic
      // Rule 16: Before start date → restore to previous stages
      // Rule 17: After start date → all become benched
      const isBeforeStart =
        !project.start_date || terminationDate < project.start_date;

      let workersUpdated = {
        count: profileIds.length,
        profile_ids: profileIds,
        new_stage: '',
        strategy: '',
      };

      if (profileIds.length > 0) {
        if (isBeforeStart) {
          // Rule 16: Restore workers to their previous stages
          // We need to get the stage transition history for each worker
          for (const assignment of assignments) {
            // Find the most recent transition that brought the worker to current project
            const currentStage = assignment.profiles.current_stage;
            if (!currentStage) continue; // Skip if no current stage

            const lastTransition = await tx.stage_transitions.findFirst({
              where: {
                profile_id: assignment.profile_id,
                to_stage: currentStage,
                transitioned_at: {
                  lte: assignment.created_at,
                },
              },
              orderBy: {
                transitioned_at: 'desc',
              },
            });

            // Restore to previous stage or default to 'benched'
            const previousStage = lastTransition?.from_stage || 'benched';

            await tx.profiles.update({
              where: { id: assignment.profile_id },
              data: { current_stage: previousStage },
            });

            // Create stage transition record
            await tx.stage_transitions.create({
              data: {
                profile_id: assignment.profile_id,
                from_stage: currentStage,
                to_stage: previousStage,
                transitioned_by_user_id: userId,
                transitioned_at: new Date(),
                notes: `Auto-transitioned: Project ${project.code} terminated before start (restored to previous stage)`,
              },
            });
          }

          workersUpdated.new_stage = 'previous stages (restored)';
          workersUpdated.strategy = 'restore_previous';
        } else {
          // Rule 17: All workers become benched
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
            notes: `Auto-transitioned: Project ${project.code} terminated after start`,
          }));

          await tx.stage_transitions.createMany({ data: stageTransitions });

          workersUpdated.new_stage = 'benched';
          workersUpdated.strategy = 'bench_all';
        }
      }

      // 4. Update project status to terminated
      const updatedProject = await tx.projects.update({
        where: { id: projectId },
        data: {
          status: 'terminated',
          termination_date: terminationDate,
          termination_reason: terminationReason,
        },
      });

      // 5. Create project status history
      const statusHistory = await tx.project_status_history.create({
        data: {
          project_id: projectId,
          from_status: project.status,
          to_status: 'terminated',
          changed_by_user_id: userId,
          status_date: terminationDate,
          change_reason: `Project terminated: ${terminationReason}`,
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
              status: 'terminated',
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
        termination_reason: terminationReason,
        documents: createdDocuments,
      };
    });
  }
}

export default new TerminateProjectOperation();
