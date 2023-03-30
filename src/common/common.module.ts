import { Global, Module } from '@nestjs/common';
import { FirebaseService, NotificationsService } from './services';

@Global()
@Module({
  providers: [FirebaseService, NotificationsService],
  exports: [FirebaseService, NotificationsService],
})
export class CommonModule {}
