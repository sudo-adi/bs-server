import { NotificationType } from '@/types/notification.types';
import { NotificationService } from '../notification.service';

const notificationService = new NotificationService();

/**
 * Helper functions to easily send notifications from anywhere in the application
 * These are the main integration points for mounting notifications on various events
 */

export class NotificationHelpers {
  /**
   * Send notification when a user is created
   */
  static async notifyUserCreated(userData: {
    userId: string;
    email: string;
    username: string;
    fullName?: string;
  }) {
    return await notificationService.sendNotificationFromTemplate(
      NotificationType.USER_CREATED,
      userData.userId,
      userData.email,
      {
        userName: userData.fullName || userData.username,
        username: userData.username,
        email: userData.email,
      }
    );
  }

  /**
   * Send notification when candidate status changes
   */
  static async notifyCandidateStatusChanged(candidateData: {
    userId?: string;
    email?: string;
    candidateName: string;
    candidateCode: string;
    oldStatus: string;
    newStatus: string;
    notes?: string;
  }) {
    return await notificationService.sendNotificationFromTemplate(
      NotificationType.CANDIDATE_STATUS_CHANGED,
      candidateData.userId,
      candidateData.email,
      {
        candidateName: candidateData.candidateName,
        candidateCode: candidateData.candidateCode,
        oldStatus: candidateData.oldStatus,
        newStatus: candidateData.newStatus,
        notes: candidateData.notes || 'N/A',
        hasNotes: candidateData.notes ? 'true' : '',
      }
    );
  }

  /**
   * Send notification when candidate is approved
   */
  static async notifyCandidateApproved(candidateData: {
    userId?: string;
    email?: string;
    candidateName: string;
    candidateCode: string;
  }) {
    return await notificationService.sendNotificationFromTemplate(
      NotificationType.CANDIDATE_APPROVED,
      candidateData.userId,
      candidateData.email,
      {
        candidateName: candidateData.candidateName,
        candidateCode: candidateData.candidateCode,
      }
    );
  }

  /**
   * Send notification when candidate is rejected
   */
  static async notifyCandidateRejected(candidateData: {
    userId?: string;
    email?: string;
    candidateName: string;
    candidateCode: string;
    reason?: string;
  }) {
    return await notificationService.sendNotificationFromTemplate(
      NotificationType.CANDIDATE_REJECTED,
      candidateData.userId,
      candidateData.email,
      {
        candidateName: candidateData.candidateName,
        candidateCode: candidateData.candidateCode,
        reason: candidateData.reason || 'N/A',
        hasReason: candidateData.reason ? 'true' : '',
      }
    );
  }

  /**
   * Send notification when candidate is blacklisted
   */
  static async notifyCandidateBlacklisted(candidateData: {
    userId?: string;
    email?: string;
    candidateName: string;
    candidateCode: string;
    reason?: string;
  }) {
    return await notificationService.sendNotification({
      type: NotificationType.CANDIDATE_BLACKLISTED,
      title: 'Account Status Update',
      message: `Dear ${candidateData.candidateName}, your account has been blacklisted. ${candidateData.reason ? `Reason: ${candidateData.reason}` : ''}`,
      recipientUserId: candidateData.userId,
      recipientEmail: candidateData.email,
      metadata: {
        candidateCode: candidateData.candidateCode,
        reason: candidateData.reason,
      },
    });
  }

  /**
   * Send notification for training enrollment
   */
  static async notifyTrainingEnrollment(enrollmentData: {
    userId?: string;
    email?: string;
    candidateName: string;
    batchName: string;
    programName: string;
    startDate: string;
    location?: string;
  }) {
    return await notificationService.sendNotificationFromTemplate(
      NotificationType.TRAINING_ENROLLMENT,
      enrollmentData.userId,
      enrollmentData.email,
      {
        candidateName: enrollmentData.candidateName,
        batchName: enrollmentData.batchName,
        programName: enrollmentData.programName,
        startDate: enrollmentData.startDate,
        location: enrollmentData.location || 'TBA',
      }
    );
  }

  /**
   * Send notification when training enrollment is approved
   */
  static async notifyTrainingEnrollmentApproved(enrollmentData: {
    userId?: string;
    email?: string;
    candidateName: string;
    batchName: string;
    startDate: string;
  }) {
    return await notificationService.sendNotification({
      type: NotificationType.TRAINING_ENROLLMENT_APPROVED,
      title: 'Training Enrollment Approved',
      message: `Congratulations ${enrollmentData.candidateName}! Your enrollment in ${enrollmentData.batchName} has been approved. Training starts on ${enrollmentData.startDate}.`,
      recipientUserId: enrollmentData.userId,
      recipientEmail: enrollmentData.email,
      metadata: enrollmentData,
    });
  }

  /**
   * Send notification when assigned to a project
   */
  static async notifyProjectAssignment(assignmentData: {
    userId?: string;
    email?: string;
    workerName: string;
    projectName: string;
    clientName: string;
    startDate: string;
    location: string;
  }) {
    return await notificationService.sendNotificationFromTemplate(
      NotificationType.PROJECT_ASSIGNED,
      assignmentData.userId,
      assignmentData.email,
      {
        workerName: assignmentData.workerName,
        projectName: assignmentData.projectName,
        clientName: assignmentData.clientName,
        startDate: assignmentData.startDate,
        location: assignmentData.location,
      }
    );
  }

  /**
   * Send notification when removed from a project
   */
  static async notifyProjectUnassignment(assignmentData: {
    userId?: string;
    email?: string;
    workerName: string;
    projectName: string;
    reason?: string;
  }) {
    return await notificationService.sendNotification({
      type: NotificationType.PROJECT_UNASSIGNED,
      title: 'Project Assignment Update',
      message: `${assignmentData.workerName}, you have been removed from project: ${assignmentData.projectName}. ${assignmentData.reason ? `Reason: ${assignmentData.reason}` : ''}`,
      recipientUserId: assignmentData.userId,
      recipientEmail: assignmentData.email,
      metadata: assignmentData,
    });
  }

  /**
   * Send notification when employer is verified
   */
  static async notifyEmployerVerified(employerData: {
    userId?: string;
    email?: string;
    companyName: string;
    companyCode?: string;
  }) {
    return await notificationService.sendNotificationFromTemplate(
      NotificationType.EMPLOYER_VERIFIED,
      employerData.userId,
      employerData.email,
      {
        companyName: employerData.companyName,
        companyCode: employerData.companyCode || 'N/A',
      }
    );
  }

  /**
   * Send notification when employer is rejected
   */
  static async notifyEmployerRejected(employerData: {
    userId?: string;
    email?: string;
    companyName: string;
    reason?: string;
  }) {
    return await notificationService.sendNotification({
      type: NotificationType.EMPLOYER_REJECTED,
      title: 'Employer Verification Status',
      message: `Dear ${employerData.companyName}, your employer verification request has been rejected. ${employerData.reason ? `Reason: ${employerData.reason}` : ''}`,
      recipientUserId: employerData.userId,
      recipientEmail: employerData.email,
      metadata: employerData,
    });
  }

  /**
   * Send system announcement to multiple users
   */
  static async sendSystemAnnouncement(announcementData: {
    title: string;
    message: string;
    recipientUserIds?: string[];
    recipientEmails?: string[];
  }) {
    const promises = [];

    // Send to users
    if (announcementData.recipientUserIds) {
      for (const userId of announcementData.recipientUserIds) {
        promises.push(
          notificationService.sendNotification({
            type: NotificationType.SYSTEM_ANNOUNCEMENT,
            title: announcementData.title,
            message: announcementData.message,
            recipientUserId: userId,
          })
        );
      }
    }

    // Send to emails
    if (announcementData.recipientEmails) {
      for (const email of announcementData.recipientEmails) {
        promises.push(
          notificationService.sendNotification({
            type: NotificationType.SYSTEM_ANNOUNCEMENT,
            title: announcementData.title,
            message: announcementData.message,
            recipientEmail: email,
          })
        );
      }
    }

    return await Promise.allSettled(promises);
  }

  /**
   * Send document verification notification
   */
  static async notifyDocumentVerified(documentData: {
    userId?: string;
    email?: string;
    candidateName: string;
    documentType: string;
  }) {
    return await notificationService.sendNotification({
      type: NotificationType.DOCUMENT_VERIFIED,
      title: 'Document Verified',
      message: `${documentData.candidateName}, your ${documentData.documentType} has been successfully verified.`,
      recipientUserId: documentData.userId,
      recipientEmail: documentData.email,
      metadata: documentData,
    });
  }

  /**
   * Send document rejection notification
   */
  static async notifyDocumentRejected(documentData: {
    userId?: string;
    email?: string;
    candidateName: string;
    documentType: string;
    reason?: string;
  }) {
    return await notificationService.sendNotification({
      type: NotificationType.DOCUMENT_REJECTED,
      title: 'Document Rejected',
      message: `${documentData.candidateName}, your ${documentData.documentType} was rejected. ${documentData.reason ? `Reason: ${documentData.reason}` : 'Please upload a valid document.'}`,
      recipientUserId: documentData.userId,
      recipientEmail: documentData.email,
      metadata: documentData,
    });
  }
}

// Export individual functions for convenience
export const {
  notifyUserCreated,
  notifyCandidateStatusChanged,
  notifyCandidateApproved,
  notifyCandidateRejected,
  notifyCandidateBlacklisted,
  notifyTrainingEnrollment,
  notifyTrainingEnrollmentApproved,
  notifyProjectAssignment,
  notifyProjectUnassignment,
  notifyEmployerVerified,
  notifyEmployerRejected,
  sendSystemAnnouncement,
  notifyDocumentVerified,
  notifyDocumentRejected,
} = NotificationHelpers;
