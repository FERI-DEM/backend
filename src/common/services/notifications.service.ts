import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FirebaseService } from './index';
import { Notification } from '../types';

enum Collection {
  NOTIFICATIONS = 'notifications',
}

@Injectable()
export class NotificationsService {
  constructor(private readonly firebase: FirebaseService) {}

  async send<T>(
    data: Omit<Notification<T>, 'id' | 'createdAt' | 'processed'>,
  ): Promise<boolean> {
    try {
      const docRef = this.firebase.db
        .collection(Collection.NOTIFICATIONS)
        .doc();
      await docRef.create({
        ...data,
        id: docRef.id,
        createdAt: new Date(),
        processed: false,
      });
      return true;
    } catch (e) {
      throw new HttpException(
        'Could not send notification',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async process<T>(id: string, userId: string): Promise<Notification<T>> {
    const docRef = this.firebase.db
      .collection(Collection.NOTIFICATIONS)
      .doc(id);

    const notification = await docRef.get();
    if (!notification.exists) {
      throw new HttpException(
        'Notification does not exist',
        HttpStatus.BAD_REQUEST,
      );
    }
    const { receiverId } = notification.data();

    if (userId !== receiverId) {
      throw new HttpException(
        'This notification does not belong to you',
        HttpStatus.BAD_REQUEST,
      );
    }

    await docRef.update({
      processed: true,
    });

    return notification.data() as Notification<T>;
  }

  async get<T>(userId: string): Promise<Notification<T>[]> {
    const notifications = await this.firebase.db
      .collection(Collection.NOTIFICATIONS)
      .where('receiverId', '==', userId)
      .get();

    return notifications.docs.map((doc) => ({
      ...(doc.data() as Notification<T>),
      id: doc.id,
    }));
  }
}
