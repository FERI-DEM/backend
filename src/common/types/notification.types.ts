export enum NotificationType {
  INVITATION = 'invitation',
  WARNING = 'warning',
}

/*
  @to - userId
  @from - userId
 */
export interface Notification<T> {
  id: string;
  to: string;
  from: string;
  type: NotificationType;
  data: T;
  read: boolean;
  createdAt: string;
}
