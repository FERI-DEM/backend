import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ForecastsModule } from './modules/forecasts/forecasts.module';
import configuration from './common/config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/users/users.module';
import { CommunitiesModule } from './modules/communities/communities.module';
import { CommonModule } from './common/common.module';
import { PowerPlantsModule } from './modules/power-plants/power-plants.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `${process.cwd()}/.env.${process.env.NODE_ENV}`,
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URI'),
      }),
      inject: [ConfigService],
    }),
    CommonModule,
    UsersModule,
    AuthModule,
    PowerPlantsModule,
    CommunitiesModule,
    ForecastsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
