import { Module } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Community, CommunitySchema } from './schemas/community.schema';
import { UsersModule } from '../users/users.module';
import { CommunitiesController } from './communities.controller';
import { CommunityRepository } from './repository/community.repository';
import { PowerPlantsModule } from '../power-plants/power-plants.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
    ]),
    UsersModule,
    PowerPlantsModule,
  ],
  controllers: [CommunitiesController],
  providers: [CommunitiesService, CommunityRepository],
})
export class CommunitiesModule {}
