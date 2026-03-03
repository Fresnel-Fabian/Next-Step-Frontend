// services/dataService.ts
/**
 * Data Service — API calls for all data operations.
 *
 * Drive-related methods call backend endpoints which in turn
 * call the Google Drive API. The frontend never calls Drive directly
 * except for the Picker UI.
 */

import api, { handleApiError } from "./api";

export interface DashboardStats {
  totalStaff: number;
  staffTrend: string;
  activeSchedules: number;
  schedulesTrend: string;
  notificationsSent: number;
  notificationsTrend: string;
  totalDocuments: number;
  documentsTrend: string;
  chartData: Array<{ name: string; active: number }>;
}

export interface ActivityLog {
  id: string;
  title: string;
  author: string;
  timestamp: string;
}

export interface ScheduleDTO {
  id: string;
  department: string;
  classCount: number;
  staffCount: number;
  status: string;
  lastUpdated: string;
}

export interface CreateScheduleData {
  department: string;
  class_count: number;
  staff_count: number;
  status?: string;
}

export interface UpdateScheduleData {
  department?: string;
  class_count?: number;
  staff_count?: number;
  status?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: number;
  createdAt: string;
  // Google Drive fields — null for non-Drive documents
  // See: https://developers.google.com/workspace/drive/api/reference/rest/v3/files
  driveFileId?: string; // Files resource `id`
  webViewLink?: string; // Files resource `webViewLink`
  mimeType?: string; // Files resource `mimeType`
  isSharedWithMe?: boolean;
  driveOwnerEmail?: string;
  // Frontend display fields (computed locally)
  type?: string;
  size?: string;
  date?: string;
  access?: string;
}

export interface CreateDocumentData {
  title: string;
  category: string;
  description?: string;
  file_url: string;
  file_size: number;
}

export interface CreateDriveDocumentData {
  title: string;
  category: string;
  description?: string;
  drive_file_id: string;
  web_view_link: string;
  mime_type: string;
}

export interface PollOption {
  id: number;
  text: string;
  votes: number;
  percentage: number;
}

export interface Poll {
  id: number;
  title: string;
  description?: string;
  options: PollOption[];
  isActive: boolean;
  totalVotes: number;
  createdAt: string;
  expiresAt?: string;
  question?: string;
  creator?: string;
  timeLeft?: string;
  status?: "active" | "completed";
  voted?: boolean;
}

export interface CreatePollData {
  title: string;
  description?: string;
  options: Array<{ id: number; text: string }>;
  expires_at?: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: string;
  sender?: string;
  time?: string;
  read?: boolean;
}

// ============================================
// Helper Functions
// ============================================

const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export class DataService {
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await api.get<DashboardStats>("/api/v1/dashboard/stats");
      return {
        ...response.data,
        schedulesTrend: response.data.schedulesTrend || "Updated recently",
        notificationsTrend: response.data.notificationsTrend || "this week",
        documentsTrend: response.data.documentsTrend || "added recently",
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRecentActivity(limit: number = 20): Promise<ActivityLog[]> {
    try {
      const response = await api.get<ActivityLog[]>(
        "/api/v1/dashboard/activity",
        {
          params: { limit },
        },
      );
      return response.data.map((activity) => ({
        ...activity,
        id: String(activity.id),
        timestamp: formatRelativeTime(activity.timestamp),
      }));
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getSchedules(
    search?: string,
    status?: string,
  ): Promise<ScheduleDTO[]> {
    try {
      const response = await api.get<ScheduleDTO[]>("/api/v1/schedules", {
        params: { search, status },
      });
      return response.data.map((schedule) => ({
        ...schedule,
        id: String(schedule.id),
        lastUpdated: formatRelativeTime(schedule.lastUpdated),
      }));
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async createSchedule(data: CreateScheduleData): Promise<ScheduleDTO> {
    try {
      const response = await api.post<ScheduleDTO>("/api/v1/schedules", data);
      return {
        ...response.data,
        id: String(response.data.id),
        lastUpdated: formatRelativeTime(response.data.lastUpdated),
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateSchedule(
    id: string,
    data: UpdateScheduleData,
  ): Promise<ScheduleDTO> {
    try {
      const response = await api.put<ScheduleDTO>(
        `/api/v1/schedules/${id}`,
        data,
      );
      return {
        ...response.data,
        id: String(response.data.id),
        lastUpdated: formatRelativeTime(response.data.lastUpdated),
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async deleteSchedule(id: string): Promise<void> {
    try {
      await api.delete(`/api/v1/schedules/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }
  static async getDocuments(
    category?: string,
    search?: string,
  ): Promise<DocumentItem[]> {
    try {
      const response = await api.get<DocumentItem[]>("/api/v1/documents", {
        params: { category, search },
      });
      return response.data.map((doc) => ({
        ...doc,
        id: String(doc.id),
        size: formatFileSize(doc.fileSize),
        date: formatRelativeTime(doc.createdAt),
        type: doc.mimeType
          ? mimeTypeToLabel(doc.mimeType)
          : doc.fileUrl.split(".").pop()?.toUpperCase() || "FILE",
        access: "All Staff",
      }));
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getDocument(id: string): Promise<DocumentItem> {
    try {
      const response = await api.get<DocumentItem>(`/api/v1/documents/${id}`);
      return {
        ...response.data,
        id: String(response.data.id),
        size: formatFileSize(response.data.fileSize),
        date: formatRelativeTime(response.data.createdAt),
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async createDocument(data: CreateDocumentData): Promise<DocumentItem> {
    try {
      const response = await api.post<DocumentItem>("/api/v1/documents", data);
      return { ...response.data, id: String(response.data.id) };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Register a Google Drive file as a document in the app.
   * The backend sets sharing permissions on the Drive file automatically.
   *
   * @see https://developers.google.com/workspace/drive/api/reference/rest/v3/permissions/create
   */
  static async createDocumentFromDrive(
    data: CreateDriveDocumentData,
  ): Promise<DocumentItem> {
    try {
      const response = await api.post<DocumentItem>(
        "/api/v1/documents/from-drive",
        data,
      );
      return { ...response.data, id: String(response.data.id) };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Fetch files shared with the current user from Google Drive.
   * Backend calls Drive API and syncs results into the local documents table.
   *
   * @see https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list
   */
  static async getSharedWithMe(): Promise<DocumentItem[]> {
    try {
      const response = await api.get<DocumentItem[]>(
        "/api/v1/documents/shared-with-me",
      );
      return response.data.map((doc) => ({
        ...doc,
        id: String(doc.id),
        size: formatFileSize(doc.fileSize),
        date: formatRelativeTime(doc.createdAt),
        type: doc.mimeType ? mimeTypeToLabel(doc.mimeType) : "FILE",
      }));
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async deleteDocument(id: string): Promise<void> {
    try {
      await api.delete(`/api/v1/documents/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getPolls(status?: "active" | "completed"): Promise<Poll[]> {
    try {
      const response = await api.get<Poll[]>("/api/v1/polls", {
        params: { status },
      });
      return response.data.map((poll) => ({
        ...poll,
        question: poll.title,
        status: poll.isActive ? "active" : "completed",
        timeLeft: poll.expiresAt
          ? new Date(poll.expiresAt) > new Date()
            ? `Ends ${formatRelativeTime(poll.expiresAt).replace(" ago", "")}`
            : `Ended ${formatRelativeTime(poll.expiresAt)}`
          : poll.isActive
            ? "No expiry"
            : "Ended",
        creator: "Administrator",
        voted: false,
      }));
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async createPoll(data: CreatePollData): Promise<Poll> {
    try {
      const response = await api.post<Poll>("/api/v1/polls", data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async votePoll(pollId: number, optionId: number): Promise<void> {
    try {
      await api.post(`/api/v1/polls/${pollId}/vote`, { option_id: optionId });
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async closePoll(pollId: number): Promise<void> {
    try {
      await api.patch(`/api/v1/polls/${pollId}/close`);
    } catch (error) {
      throw handleApiError(error);
    }
  }
  static async getNotifications(
    unreadOnly: boolean = false,
  ): Promise<Notification[]> {
    try {
      const response = await api.get<Notification[]>("/api/v1/notifications", {
        params: { unread_only: unreadOnly },
      });
      return response.data.map((notif) => ({
        ...notif,
        time: formatRelativeTime(notif.createdAt),
        read: notif.isRead,
        sender: "System",
      }));
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get<{ unreadCount: number }>(
        "/api/v1/notifications/unread-count",
      );
      return response.data.unreadCount;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async markNotificationRead(id: number): Promise<void> {
    try {
      await api.patch(`/api/v1/notifications/${id}/read`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async markAllNotificationsRead(): Promise<void> {
    try {
      await api.patch("/api/v1/notifications/read-all");
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ========================================
  // Users (Admin)
  // ========================================

  static async getUsers(department?: string): Promise<any[]> {
    try {
      const response = await api.get("/api/v1/users", {
        params: { department },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getUser(id: string): Promise<any> {
    try {
      const response = await api.get(`/api/v1/users/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

// ============================================
// Helpers
// ============================================

/**
 * Convert a Drive mimeType to a short display label.
 * @see https://developers.google.com/workspace/drive/api/reference/rest/v3/files
 */

function mimeTypeToLabel(mimeType: string): string {
  const map: Record<string, string> = {
    "application/pdf": "PDF",
    "application/vnd.google-apps.document": "DOC",
    "application/vnd.google-apps.spreadsheet": "SHEET",
    "application/vnd.google-apps.presentation": "SLIDES",
    "application/vnd.google-apps.folder": "FOLDER",
    "image/jpeg": "JPG",
    "image/png": "PNG",
  };
  return map[mimeType] || mimeType.split("/").pop()?.toUpperCase() || "FILE";
}

export default DataService;
