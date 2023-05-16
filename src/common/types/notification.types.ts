export enum NotificationType {
  REQUEST_TO_JOIN = 'request_to_join',
  WARNING = 'warning',
}

export interface Notification<T> {
  id: string;
  receiverId: string;
  senderId: string;
  type: NotificationType;
  data: T;
  processed: boolean;
  createdAt: string;
}
