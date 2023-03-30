export enum NotificationType {
  INVITATION = 'invitation',
  WARNING = 'warning',
}

/*
  @to - user id
  @from - user id
 */
export interface Notification<T> {
  to: string;
  from: string;
  id: string;
  type: NotificationType;
  data: T;
  read: boolean;
  createdAt: string;
}
