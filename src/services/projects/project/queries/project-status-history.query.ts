import prisma from '@/config/prisma';
import type { Prisma } from '@/generated/prisma';
import type { ProjectStatusHistoryWithDocuments } from '@/types';

export interface StatusHistoryFilters {
  project_id?: string;
  to_status?: string;
  from_date?: Date;
  to_date?: Date;
  changed_by_user_id?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedStatusHistoryResponse {
  data: ProjectStatusHistoryWithDocuments[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export class ProjectStatusHistoryQuery {
  /**
   * Get status history for a specific project
   */
  static async getByProjectId(
    projectId: string,
    pagination: PaginationParams = {}
  ): Promise<PaginatedStatusHistoryResponse> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.project_status_historyWhereInput = {
      project_id: projectId,
    };

    const [data, total] = await Promise.all([
      prisma.project_status_history.findMany({
        where,
        include: {
          project_status_documents: true,
          users: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip,
      }),
      prisma.project_status_history.count({ where }),
    ]);

    return {
      data: data as ProjectStatusHistoryWithDocuments[],
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit,
      },
    };
  }

  /**
   * Get a single status history record by ID
   */
  static async getById(id: string): Promise<ProjectStatusHistoryWithDocuments | null> {
    return (await prisma.project_status_history.findUnique({
      where: { id },
      include: {
        project_status_documents: true,
        projects: true,
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    })) as ProjectStatusHistoryWithDocuments | null;
  }

  /**
   * Get all status history with filters
   */
  static async getAll(
    filters: StatusHistoryFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedStatusHistoryResponse> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.project_status_historyWhereInput = {};

    if (filters.project_id) {
      where.project_id = filters.project_id;
    }

    if (filters.to_status) {
      where.to_status = filters.to_status;
    }

    if (filters.changed_by_user_id) {
      where.changed_by_user_id = filters.changed_by_user_id;
    }

    if (filters.from_date || filters.to_date) {
      where.status_date = {};
      if (filters.from_date) {
        where.status_date.gte = filters.from_date;
      }
      if (filters.to_date) {
        where.status_date.lte = filters.to_date;
      }
    }

    const [data, total] = await Promise.all([
      prisma.project_status_history.findMany({
        where,
        include: {
          project_status_documents: true,
          projects: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          users: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip,
      }),
      prisma.project_status_history.count({ where }),
    ]);

    return {
      data: data as ProjectStatusHistoryWithDocuments[],
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit,
      },
    };
  }

  /**
   * Get latest status change for a project
   */
  static async getLatest(projectId: string): Promise<ProjectStatusHistoryWithDocuments | null> {
    return (await prisma.project_status_history.findFirst({
      where: { project_id: projectId },
      include: {
        project_status_documents: true,
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })) as ProjectStatusHistoryWithDocuments | null;
  }

  /**
   * Get status history statistics
   */
  static async getStats(projectId?: string) {
    const where: Prisma.project_status_historyWhereInput = projectId
      ? { project_id: projectId }
      : {};

    const [total, byStatus, recentChanges] = await Promise.all([
      prisma.project_status_history.count({ where }),
      prisma.project_status_history.groupBy({
        by: ['to_status'],
        where,
        _count: { to_status: true },
        orderBy: { _count: { to_status: 'desc' } },
      }),
      prisma.project_status_history.count({
        where: {
          ...where,
          created_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    return {
      total,
      by_status: byStatus.map((item) => ({
        status: item.to_status,
        count: item._count.to_status,
      })),
      recent_changes: recentChanges,
    };
  }

  // ==================== Wrapper Methods for Service Layer ====================

  /**
   * Get project status history with filters (used by service)
   */
  static async getProjectStatusHistory(filters: {
    project_id?: string;
    limit?: number;
    offset?: number;
    from_status?: string;
    to_status?: string;
  }): Promise<{
    history: ProjectStatusHistoryWithDocuments[];
    total: number;
  }> {
    const page = filters.offset ? Math.floor(filters.offset / (filters.limit || 20)) + 1 : 1;
    const result = await this.getAll(
      {
        project_id: filters.project_id,
        to_status: filters.to_status,
      },
      {
        page,
        limit: filters.limit,
      }
    );

    return {
      history: result.data,
      total: result.pagination.total_items,
    };
  }

  /**
   * Get status history by ID (used by service)
   */
  static async getStatusHistoryById(historyId: string): Promise<ProjectStatusHistoryWithDocuments> {
    const history = await this.getById(historyId);
    if (!history) {
      throw new Error(`Status history not found: ${historyId}`);
    }
    return history;
  }
}
