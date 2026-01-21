// Mock data service - replace with real API calls later
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

export interface StaffScheduleItem {
  id: string;
  time: string;
  title: string;
  location: string;
  isStartingSoon: boolean;
}
import { DocumentItem } from '@/types/document';
import { Notification } from '@/types/notification';
import { ScheduleDTO } from '@/types/schedule';
import { Poll } from '@/types/poll';

export class DataService {
  // Admin dashboard stats
  static async getDashboardStats(): Promise<DashboardStats> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      totalStaff: 156,
      staffTrend: '+12 this month',
      activeSchedules: 12,
      schedulesTrend: '3 updated today',
      notificationsSent: 48,
      notificationsTrend: 'this week',
      totalDocuments: 284,
      documentsTrend: '48 added recently',
      chartData: [
        { name: 'Mon', active: 12 },
        { name: 'Tue', active: 19 },
        { name: 'Wed', active: 15 },
        { name: 'Thu', active: 22 },
        { name: 'Fri', active: 18 },
      ],
    };
  }

  // Recent activity feed
  static async getRecentActivity(): Promise<ActivityLog[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: '1',
        title: 'Schedule created',
        author: 'Math Department',
        timestamp: '2 hours ago',
      },
      {
        id: '2',
        title: 'Emergency alert sent',
        author: 'Principal Office',
        timestamp: '5 hours ago',
      },
      {
        id: '3',
        title: 'Document uploaded',
        author: 'HR Department',
        timestamp: '1 day ago',
      },
    ];
  }

  // Staff's today schedule
  static async getTodaySchedule(): Promise<StaffScheduleItem[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: '1',
        time: '08:00 AM',
        title: 'Mathematics 101',
        location: 'Room 204',
        isStartingSoon: true,
      },
      {
        id: '2',
        time: '10:00 AM',
        title: 'Staff Meeting',
        location: 'Conference Hall',
        isStartingSoon: true,
      },
      {
        id: '3',
        time: '02:00 PM',
        title: 'Physics Lab',
        location: 'Lab 3',
        isStartingSoon: false,
      },
    ];
  }
  // Documents list
  static async getDocuments(): Promise<DocumentItem[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: '1',
        title: 'Staff Handbook 2025',
        category: 'Handbooks',
        type: 'PDF',
        size: '2.4 MB',
        author: 'HR Department',
        date: '2 days ago',
        access: 'All Staff',
      },
      {
        id: '2',
        title: 'Emergency Procedures',
        category: 'Policies',
        type: 'PDF',
        size: '1.8 MB',
        author: 'Administration',
        date: '1 week ago',
        access: 'All Staff',
      },
      {
        id: '3',
        title: 'Curriculum Planning Template',
        category: 'Forms',
        type: 'DOC',
        size: '245 KB',
        author: 'Principal Office',
        date: '3 days ago',
        access: 'Teachers Only',
      },
      {
        id: '4',
        title: 'Grade Report Template',
        category: 'Resources',
        type: 'XLS',
        size: '180 KB',
        author: 'Academic Office',
        date: '5 days ago',
        access: 'All Staff',
      },
    ];
  }
  // Schedules list
  static async getSchedules(): Promise<ScheduleDTO[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: '1',
        department: 'Mathematics Department',
        status: 'Active',
        classCount: 12,
        staffCount: 8,
        lastUpdated: '2 hours ago',
      },
      {
        id: '2',
        department: 'Science Department',
        status: 'Active',
        classCount: 15,
        staffCount: 10,
        lastUpdated: '1 day ago',
      },
      {
        id: '3',
        department: 'English Department',
        status: 'Active',
        classCount: 18,
        staffCount: 12,
        lastUpdated: '3 days ago',
      },
      {
        id: '4',
        department: 'History Department',
        status: 'Draft',
        classCount: 8,
        staffCount: 5,
        lastUpdated: '1 week ago',
      },
    ];
  }

  static async deleteSchedule(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Deleted schedule:', id);
  }
  // Notifications list
  static async getNotifications(): Promise<Notification[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: '1',
        type: 'emergency',
        title: 'Emergency Drill Scheduled',
        message: 'Fire drill will take place tomorrow at 10:00 AM. Please prepare your students.',
        sender: 'Safety Officer',
        time: '1 hour ago',
        read: false,
      },
      {
        id: '2',
        type: 'document',
        title: 'New Document: Safety Guidelines',
        message: 'Updated safety guidelines for 2025 have been uploaded to the document center.',
        sender: 'Administration',
        time: '3 hours ago',
        read: false,
      },
      {
        id: '3',
        type: 'schedule',
        title: 'Schedule Update: Math Department',
        message: 'Your Tuesday schedule has been updated. Please check for changes.',
        sender: 'Department Head',
        time: '5 hours ago',
        read: true,
      },
      {
        id: '4',
        type: 'general',
        title: 'Staff Meeting Reminder',
        message: 'Monthly staff meeting is scheduled for Friday at 3:00 PM in the main hall.',
        sender: 'Principal Office',
        time: '1 day ago',
        read: true,
      },
      {
        id: '5',
        type: 'document',
        title: 'Policy Update',
        message: 'Attendance policy has been revised. Please review the updated document.',
        sender: 'HR Department',
        time: '2 days ago',
        read: true,
      },
    ];
  }
  // Polls list
  static async getPolls(): Promise<Poll[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: '1',
        question: 'What would you prefer for Friday lunch?',
        options: [
          { label: 'Pizza', votes: 128, percentage: 45 },
          { label: 'Salad Bar', votes: 89, percentage: 31 },
          { label: 'Pasta', votes: 68, percentage: 24 },
        ],
        creator: 'Cafeteria Manager',
        timeLeft: '2 days left',
        totalVotes: 285,
        status: 'active',
        voted: true,
      },
      {
        id: '2',
        question: 'Best time for staff meeting next week?',
        options: [
          { label: 'Monday 3 PM', votes: 45, percentage: 35 },
          { label: 'Wednesday 2 PM', votes: 60, percentage: 47 },
          { label: 'Friday 4 PM', votes: 23, percentage: 18 },
        ],
        creator: 'Principal Office',
        timeLeft: '5 days left',
        totalVotes: 128,
        status: 'active',
        voted: false,
      },
      {
        id: '3',
        question: 'Preferred professional development topic?',
        options: [
          { label: 'Technology Integration', votes: 92, percentage: 55 },
          { label: 'Classroom Management', votes: 45, percentage: 27 },
          { label: 'Student Engagement', votes: 30, percentage: 18 },
        ],
        creator: 'HR Department',
        timeLeft: 'Ended 3 days ago',
        totalVotes: 167,
        status: 'completed',
        voted: true,
      },
      {
        id: '4',
        question: 'School field trip destination?',
        options: [
          { label: 'Science Museum', votes: 78, percentage: 48 },
          { label: 'Art Gallery', votes: 52, percentage: 32 },
          { label: 'Historical Site', votes: 33, percentage: 20 },
        ],
        creator: 'Activities Coordinator',
        timeLeft: 'Ended 1 week ago',
        totalVotes: 163,
        status: 'completed',
        voted: true,
      },
    ];
  }
}

