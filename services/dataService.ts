/**
 * Data Service - API calls for all data operations
 */

import { TOKEN_KEY, forceLogoutOn401 } from "@/lib/authLogout";
import { CreateDocumentData, DocumentItem } from "@/types/document";
import api, { API_BASE_URL, handleApiError } from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================
// Re-export DocumentItem so existing imports work
// ============================================
export type { CreateDocumentData, DocumentItem };

// ============================================
// Types - Dashboard
// ============================================

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

// ============================================
// Types - Schedule
// ============================================

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

// ============================================
// Types - Schedule Event (calendar events)
// ============================================

export interface ScheduleEvent {
  id: number;
  subject: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  professor: string;
  room?: string;
  color: string;
  eventType: string;
  students: string[];
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleEventData {
  subject: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  professor: string;
  room?: string;
  color?: string;
  eventType?: string;
  students?: string[];
}

export interface UpdateScheduleEventData {
  subject?: string;
  description?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  professor?: string;
  room?: string;
  color?: string;
  eventType?: string;
  students?: string[];
}

// ============================================
// Types - Poll
// ============================================

export interface PollOption {
  id: number;
  /** Full option label shown in UI (prefer over short codes) */
  text: string;
  /** Optional short code from API; display uses `text` when set */
  label?: string;
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

export interface VoterDetail {
  user_id: number;
  user_name: string;
  option_id: number;
  option_text: string;
  voted_at: string;
}

export interface PollResults {
  poll_id: number;
  title: string;
  total_votes: number;
  options: PollOption[];
  voters: VoterDetail[];
}

// ============================================
// Types - Notification
// ============================================

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

export interface Announcement {
  id: number;
  title: string;
  message: string;
  fileUrl?: string;
  fileName?: string;
  createdBy: number;
  createdAt: string;
  // frontend display
  time?: string;
  creatorName?: string;
}

export interface CreateAnnouncementData {
  title: string;
  message: string;
  file_url?: string;
  file_name?: string;
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

/** e.g. "Apr 10" — used for poll end / ended copy */
const formatPollMonthDay = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Subtitle for list cards: "Ends …" / "Ended …" / "Open-ended" / created date (never duplicate "Closed" with badge) */
const buildPollScheduleLabel = (poll: {
  expiresAt?: string;
  isActive: boolean;
  createdAt?: string;
}): string => {
  if (poll.expiresAt) {
    const end = new Date(poll.expiresAt);
    const now = new Date();
    if (poll.isActive && end > now) {
      return `Ends ${formatPollMonthDay(poll.expiresAt)}`;
    }
    return `Ended ${formatPollMonthDay(poll.expiresAt)}`;
  }
  if (poll.isActive) return "Open-ended";
  if (poll.createdAt) {
    return `Created ${formatPollMonthDay(poll.createdAt)}`;
  }
  return "";
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const inferFileType = (url: string): DocumentItem["type"] => {
  const ext = url.split(".").pop()?.toUpperCase();
  if (ext === "PDF") return "PDF";
  if (ext === "DOC" || ext === "DOCX") return "DOC";
  if (ext === "XLS" || ext === "XLSX") return "XLS";
  return "FILE";
};

// ============================================
// Raw API shape returned by backend
// ============================================
interface RawDocumentItem {
  id: string | number;
  title: string;
  category: string;
  description: string;
  url: string;
  fileSize: number;
  uploadedBy: number;
  uploadedByName?: string;
  createdAt: string;
  accessLevel?: string;
}

const mapDocument = (doc: RawDocumentItem): DocumentItem => ({
  id: String(doc.id),
  title: doc.title,
  category: doc.category,
  description: doc.description,
  type: inferFileType(doc.url),
  size: formatFileSize(doc.fileSize),
  author: doc.uploadedByName || `User #${doc.uploadedBy}`,
  date: formatRelativeTime(doc.createdAt),
  access: doc.accessLevel || "All Staff",
  url: doc.url,
});

// ============================================
// Data Service Class
// ============================================

export class DataService {
  // ========================================
  // Dashboard
  // ========================================

  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await api.get<DashboardStats>("/api/v1/dashboard/stats");
      return {
        ...response.data,
        schedulesTrend: response.data.schedulesTrend || "Updated recently",
        notificationsTrend: response.data.notificationsTrend || "this week",
        documentsTrend: response.data.documentsTrend || "added recently",
        chartData: response.data.chartData || [],
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

  static async deleteActivity(id: string): Promise<void> {
    try {
      await api.delete(`/api/v1/dashboard/activity/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

static async deleteAllActivity(): Promise<void> {
    try {
      await api.delete('/api/v1/dashboard/activity');
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ========================================
  // Schedules
  // ========================================

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

  static async getSchedule(id: string): Promise<ScheduleDTO> {
    try {
      const response = await api.get<ScheduleDTO>(`/api/v1/schedules/${id}`);
      return {
        ...response.data,
        id: String(response.data.id),
        lastUpdated: formatRelativeTime(response.data.lastUpdated),
      };
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

  // ========================================
  // Schedule Events (calendar events)
  // ========================================

  static async getScheduleEvents(filters?: {
    date?: string;
    professor?: string;
    student?: string;
  }): Promise<ScheduleEvent[]> {
    try {
      const response = await api.get<ScheduleEvent[]>("/api/v1/schedule-events", {
        params: filters,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getScheduleEvent(id: number): Promise<ScheduleEvent> {
    try {
      const response = await api.get<ScheduleEvent>(`/api/v1/schedule-events/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async createScheduleEvent(data: CreateScheduleEventData): Promise<ScheduleEvent> {
    try {
      const response = await api.post<ScheduleEvent>("/api/v1/schedule-events", data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateScheduleEvent(id: number, data: UpdateScheduleEventData): Promise<ScheduleEvent> {
    try {
      const response = await api.put<ScheduleEvent>(`/api/v1/schedule-events/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async deleteScheduleEvent(id: number): Promise<void> {
    try {
      await api.delete(`/api/v1/schedule-events/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ========================================
  // Documents
  // ========================================

  static async getDocuments(
    category?: string,
    search?: string,
  ): Promise<DocumentItem[]> {
    try {
      const response = await api.get<RawDocumentItem[]>("/api/v1/documents", {
        params: { category, search },
      });
      return response.data.map(mapDocument);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getDocument(id: string): Promise<DocumentItem> {
    try {
      const response = await api.get<RawDocumentItem>(
        `/api/v1/documents/${id}`,
      );
      return mapDocument(response.data);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async createDocument(data: CreateDocumentData): Promise<DocumentItem> {
    try {
      const response = await api.post<RawDocumentItem>("/api/v1/documents", {
        title: data.title,
        category: data.category,
        description: data.description,
        file_url: data.fileUrl,
        file_size: data.fileSize,
      });
      return mapDocument(response.data);
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
    data: { driveFileId: string; title: string; category: string; description?: string },
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

  // ========================================
  // Polls
  // ========================================

  /** API routes expect numeric poll IDs; coerce from API/legacy string ids */
  private static toPollId(pollId: number | string): number {
    const n = typeof pollId === "string" ? Number.parseInt(pollId, 10) : pollId;
    if (Number.isNaN(n)) {
      throw new Error("Invalid poll id");
    }
    return n;
  }

  static async getPolls(status?: "active" | "completed"): Promise<Poll[]> {
    try {
      const response = await api.get<Poll[]>("/api/v1/polls", {
        params: { poll_status: status },
      });
      return response.data.map((poll) => ({
        ...poll,
        id: Number(poll.id),
        question: poll.title,
        status: poll.isActive ? 'active' : 'completed',
        timeLeft: buildPollScheduleLabel(poll),
        creator: 'Administrator',
        voted: false,
        options: (poll.options || []).map((o: any) => {
          const rawText = o.text != null ? String(o.text).trim() : "";
          const rawLabel = o.label != null ? String(o.label).trim() : "";
          const display =
            rawText.length >= rawLabel.length ? rawText || rawLabel : rawLabel || rawText;
          return {
            id: o.id,
            text: display,
            label: rawLabel || undefined,
            votes: o.votes,
            percentage: o.percentage,
          };
        }),
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

  static async createPoll(data: CreatePollData): Promise<Poll> {
    try {
      const response = await api.post<Poll>("/api/v1/polls", data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async votePoll(pollId: number | string, optionId: number): Promise<void> {
    try {
      const id = DataService.toPollId(pollId);
      await api.post(`/api/v1/polls/${id}/vote`, { option_id: optionId });
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async closePoll(pollId: number | string): Promise<void> {
    try {
      const id = DataService.toPollId(pollId);
      await api.patch(`/api/v1/polls/${id}/close`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async deletePoll(pollId: number | string): Promise<void> {
    try {
      const id = DataService.toPollId(pollId);
      await api.delete(`/api/v1/polls/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getPollResults(pollId: number | string): Promise<PollResults> {
    try {
      const id = DataService.toPollId(pollId);
      const response = await api.get<PollResults>(`/api/v1/polls/${id}/results`);
      return {
        ...response.data,
        voters: response.data.voters.map(v => ({
          ...v,
          voted_at: formatRelativeTime(v.voted_at),
        })),
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getAnnouncements(): Promise<Announcement[]> {
    try {
      const response = await api.get<Announcement[]>('/api/v1/announcements');
      return response.data.map(a => ({
        ...a,
        time: formatRelativeTime(a.createdAt),
      }));
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async createAnnouncement(data: CreateAnnouncementData): Promise<Announcement> {
    try {
      const response = await api.post<Announcement>('/api/v1/announcements', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async deleteAnnouncement(id: number): Promise<void> {
    try {
      await api.delete(`/api/v1/announcements/${id}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ========================================
  // File Upload
  // ========================================

  static async uploadFile(fileAsset: {
  uri: string;
  name: string;
  type: string;
  file?: File; // web File object from expo-document-picker
}): Promise<{ fileUrl: string; fileName: string; fileSize: number }> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);

    const formData = new FormData();

    if (fileAsset.file) {
      // Web: expo-document-picker gives us a native File object directly
      formData.append('file', fileAsset.file, fileAsset.name);
    } else {
      // Mobile: fetch the blob from the URI
      const response = await fetch(fileAsset.uri);
      const blob = await response.blob();
      formData.append('file', blob, fileAsset.name);
    }

    // Use native fetch — NOT axios — so browser sets correct multipart boundary.
    // Caveat: this bypasses the axios response interceptor, so we must mirror
    // its 401 handling here (clear persisted auth) or an expired token during
    // upload leaves the user pseudo-logged-in.
    const response = await fetch(`${API_BASE_URL}api/v1/documents/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        await forceLogoutOn401();
      }
      // The error body may not be JSON (e.g. an HTML 502/504 page from a proxy);
      // fall back to statusText so we surface something useful instead of a
      // misleading SyntaxError.
      let detail: string | undefined;
      try {
        const parsed = await response.json();
        detail = parsed?.detail;
      } catch {
        detail = undefined;
      }
      throw new Error(detail || response.statusText || 'Upload failed');
    }

    return await response.json();
  } catch (error) {
    throw handleApiError(error);
  }
}

  // ========================================
  // Notifications
  // ========================================

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
      await api.patch('/api/v1/notifications/read-all');
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async deleteNotification(id: number): Promise<void> {
    try {
      await api.delete(`/api/v1/notifications/${id}`);
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


export default DataService;
