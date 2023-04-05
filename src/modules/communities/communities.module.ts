import { Module } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Community, CommunitySchema } from './schemas/community.schema';
import { UsersModule } from '../users/users.module';
import { CommunitiesController } from './communities.controller';
import { CommunityRepository } from './repository/community.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
    ]),
    UsersModule,
  ],
  controllers: [CommunitiesController],
  providers: [CommunitiesService, CommunityRepository],
})
export class CommunitiesModule {}
