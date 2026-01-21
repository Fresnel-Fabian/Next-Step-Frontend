export type NotificationType = 'emergency' | 'schedule' | 'document' | 'general';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  sender: string;
  time: string;
  read: boolean;
}