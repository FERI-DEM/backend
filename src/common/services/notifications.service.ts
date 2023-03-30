import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FirebaseService } from './index';
import { Notification } from '../types';

@Injectable()
export class NotificationsService {
  constructor(private readonly firebase: FirebaseService) {}

  async send<T>(
    data: Omit<Notification<T>, 'id' | 'createdAt' | 'read'>,
  ): Promise<boolean> {
    try {
      const docRef = this.firebase.db.collection('notifications').doc();
      await docRef.create({
        ...data,
        id: docRef.id,
        createdAt: new Date(),
        read: false,
      });
      return true;
    } catch (e) {
      throw new HttpException(
        'Could not send notification',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
