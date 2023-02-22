import { Injectable } from '@nestjs/common';
import settings from './app.settings';

@Injectable()
export class AppService {
  getHealth() {
    return { date: new Date(), status: 'ok', env: settings.environment };
  }
}
