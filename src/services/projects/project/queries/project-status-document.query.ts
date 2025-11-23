import prisma from '@/config/prisma';
import type { project_status_documents, Prisma } from '@/generated/prisma';

export interface StatusDocumentFilters {
  project_id?: string;
  status?: string;
  project_status_history_id?: string;
  uploaded_by_user_id?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedDocumentsResponse {
  data: project_status_documents[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export class ProjectStatusDocumentQuery {
  /**
   * Get all documents for a project
   */
  static async getByProjectId(
    projectId: string,
    pagination: PaginationParams = {}
  ): Promise<PaginatedDocumentsResponse> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.project_status_documentsWhereInput = {
      project_id: projectId,
    };

    const [data, total] = await Promise.all([
      prisma.project_status_documents.findMany({
        where,
        include: {
          project_status_history: {
            select: {
              to_status: true,
              status_date: true,
              change_reason: true,
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
      prisma.project_status_documents.count({ where }),
    ]);

    return {
      data,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit,
      },
    };
  }

  /**
   * Get documents by status
   */
  static async getByStatus(
    status: string,
    projectId?: string,
    pagination: PaginationParams = {}
  ): Promise<PaginatedDocumentsResponse> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.project_status_documentsWhereInput = {
      status,
    };

    if (projectId) {
      where.project_id = projectId;
    }

    const [data, total] = await Promise.all([
      prisma.project_status_documents.findMany({
        where,
        include: {
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
      prisma.project_status_documents.count({ where }),
    ]);

    return {
      data,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit,
      },
    };
  }

  /**
   * Get documents by status history ID
   */
  static async getByHistoryId(historyId: string): Promise<project_status_documents[]> {
    return await prisma.project_status_documents.findMany({
      where: {
        project_status_history_id: historyId,
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Get a single document by ID
   */
  static async getById(id: string): Promise<project_status_documents | null> {
    return await prisma.project_status_documents.findUnique({
      where: { id },
      include: {
        projects: true,
        project_status_history: true,
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get all documents with filters
   */
  static async getAll(
    filters: StatusDocumentFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedDocumentsResponse> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.project_status_documentsWhereInput = {};

    if (filters.project_id) {
      where.project_id = filters.project_id;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.project_status_history_id) {
      where.project_status_history_id = filters.project_status_history_id;
    }

    if (filters.uploaded_by_user_id) {
      where.uploaded_by_user_id = filters.uploaded_by_user_id;
    }

    const [data, total] = await Promise.all([
      prisma.project_status_documents.findMany({
        where,
        include: {
          projects: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          project_status_history: {
            select: {
              to_status: true,
              status_date: true,
              change_reason: true,
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
      prisma.project_status_documents.count({ where }),
    ]);

    return {
      data,
      pagination: {
        current_page: page,
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: limit,
      },
    };
  }

  // ==================== Wrapper Methods for Service Layer ====================

  /**
   * Get project status documents with filters (used by service)
   */
  static async getProjectStatusDocuments(filters: {
    project_id?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    documents: project_status_documents[];
    total: number;
  }> {
    const page = filters.offset ? Math.floor(filters.offset / (filters.limit || 20)) + 1 : 1;
    const result = await this.getAll(
      {
        project_id: filters.project_id,
        status: filters.status,
      },
      {
        page,
        limit: filters.limit,
      }
    );

    return {
      documents: result.data,
      total: result.pagination.total_items,
    };
  }

  /**
   * Get documents by history ID (used by service)
   */
  static async getDocumentsByHistoryId(historyId: string): Promise<project_status_documents[]> {
    return this.getByHistoryId(historyId);
  }
}
