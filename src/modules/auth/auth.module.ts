import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { CommonModule } from '../../common/common.module';

@Global()
@Module({
  imports: [UsersModule, CommonModule],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
