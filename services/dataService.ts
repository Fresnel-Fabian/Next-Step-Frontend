// services/dataService.ts
/**
 * Data Service - API calls for all data operations
 * 
 * Replaces mock data with real API calls to FastAPI backend
 */

import api, { handleApiError, API_BASE_URL } from './api';

// ============================================
// Types - Dashboard
// ============================================

export interface DashboardStats {
  totalStaff: number;
  staffTrend: string;
  activeSchedules: number;
  schedulesTrend?: string;
  notificationsSent: number;
  notificationsTrend?: string;
  totalDocuments: number;
  documentsTrend?: string;
  chartData?: Array<{ name: string; active: number }>;
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
// Types - Document
// ============================================

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  description?: string;
  fileUrl: string;
  fileSize: number;
  uploadedBy: number;
  createdAt: string;
  // Frontend display fields (computed)
  type?: string;
  size?: string;
  author?: string;
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

// ============================================
// Types - Poll
// ============================================

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
  // Frontend display fields
  question?: string;
  creator?: string;
  timeLeft?: string;
  status?: 'active' | 'completed';
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
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  // Frontend display fields
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

// Format date to relative time (e.g., "2 hours ago")
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

// Format file size (bytes to human readable)
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ============================================
// Data Service Class
// ============================================

export class DataService {
  // ========================================
  // Dashboard
  // ========================================
  
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await api.get<DashboardStats>('/api/v1/dashboard/stats');
      return {
        ...response.data,
        // Add default trends if not provided by backend
        schedulesTrend: response.data.schedulesTrend || 'Updated recently',
        notificationsTrend: response.data.notificationsTrend || 'this week',
        documentsTrend: response.data.documentsTrend || 'added recently',
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getRecentActivity(limit: number = 20): Promise<ActivityLog[]> {
    try {
      const response = await api.get<ActivityLog[]>('/api/v1/dashboard/activity', {
        params: { limit },
      });
      
      // Format timestamps for display
      return response.data.map(activity => ({
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

  static async getSchedules(search?: string, status?: string): Promise<ScheduleDTO[]> {
    try {
      const response = await api.get<ScheduleDTO[]>('/api/v1/schedules', {
        params: { search, status },
      });
      
      // Format for frontend display
      return response.data.map(schedule => ({
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
      const response = await api.post<ScheduleDTO>('/api/v1/schedules', data);
      return {
        ...response.data,
        id: String(response.data.id),
        lastUpdated: formatRelativeTime(response.data.lastUpdated),
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async updateSchedule(id: string, data: UpdateScheduleData): Promise<ScheduleDTO> {
    try {
      const response = await api.put<ScheduleDTO>(`/api/v1/schedules/${id}`, data);
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
  // Documents
  // ========================================

  static async getDocuments(category?: string, search?: string): Promise<DocumentItem[]> {
    try {
      const response = await api.get<DocumentItem[]>('/api/v1/documents', {
        params: { category, search },
      });
      
      // Format for frontend display
      return response.data.map(doc => ({
        ...doc,
        id: String(doc.id),
        size: formatFileSize(doc.fileSize),
        date: formatRelativeTime(doc.createdAt),
        type: doc.fileUrl.split('.').pop()?.toUpperCase() || 'FILE',
        access: 'All Staff', // Default, adjust based on your needs
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
        type: response.data.fileUrl.split('.').pop()?.toUpperCase() || 'FILE',
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async createDocument(data: CreateDocumentData): Promise<DocumentItem> {
    try {
      const response = await api.post<DocumentItem>('/api/v1/documents', data);
      return {
        ...response.data,
        id: String(response.data.id),
      };
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

  // ========================================
  // Polls
  // ========================================

  static async getPolls(status?: 'active' | 'completed'): Promise<Poll[]> {
    try {
      const response = await api.get<Poll[]>('/api/v1/polls', {
        params: { status },
      });
      
      // Format for frontend display
      return response.data.map(poll => ({
        ...poll,
        question: poll.title,
        status: poll.isActive ? 'active' : 'completed',
        timeLeft: poll.expiresAt 
          ? (new Date(poll.expiresAt) > new Date() 
            ? `Ends ${formatRelativeTime(poll.expiresAt).replace(' ago', '')}`
            : `Ended ${formatRelativeTime(poll.expiresAt)}`)
          : (poll.isActive ? 'No expiry' : 'Ended'),
        creator: 'Administrator', // Backend doesn't return this, you could add it
        voted: false, // You'd need to track this per-user
      }));
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getPoll(id: number): Promise<Poll> {
    try {
      const response = await api.get<Poll>(`/api/v1/polls/${id}`);
      return {
        ...response.data,
        question: response.data.title,
        status: response.data.isActive ? 'active' : 'completed',
      };
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async createPoll(data: CreatePollData): Promise<Poll> {
    try {
      const response = await api.post<Poll>('/api/v1/polls', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async votePoll(pollId: number, optionId: number): Promise<void> {
    try {
      await api.post(`/api/v1/polls/${pollId}/vote`, {
        option_id: optionId,
      });
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

  static async deletePoll(pollId: number): Promise<void> {
    try {
      await api.delete(`/api/v1/polls/${pollId}`);
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getPollResults(pollId: number): Promise<PollResults> {
    try {
      const response = await api.get<PollResults>(`/api/v1/polls/${pollId}/results`);
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
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const token = await AsyncStorage.getItem('auth_token');

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

    // Use native fetch — NOT axios — so browser sets correct multipart boundary
    const response = await fetch(`${API_BASE_URL}api/v1/documents/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return await response.json();
  } catch (error) {
    throw handleApiError(error);
  }
}

  // ========================================
  // Notifications
  // ========================================

  static async getNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
    try {
      const response = await api.get<Notification[]>('/api/v1/notifications', {
        params: { unread_only: unreadOnly },
      });
      
      // Format for frontend display
      return response.data.map(notif => ({
        ...notif,
        time: formatRelativeTime(notif.createdAt),
        read: notif.isRead,
        sender: 'System', // Backend doesn't track sender, you could add it
      }));
    } catch (error) {
      throw handleApiError(error);
    }
  }

  static async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get<{ unreadCount: number }>('/api/v1/notifications/unread-count');
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
      const response = await api.get('/api/v1/users', {
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