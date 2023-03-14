import { Injectable } from '@nestjs/common';
import { getAuth, Auth } from 'firebase-admin/auth';
import {
  initializeApp,
  getApps,
  App,
  ServiceAccount,
} from 'firebase-admin/app';

import settings from '../../app.settings';
import { credential } from 'firebase-admin';

const serviceAccount: ServiceAccount = {
  projectId: settings.services.firebase.projectId,
  privateKey: settings.services.firebase.privateKey,
  clientEmail: settings.services.firebase.clientEmail,
};

@Injectable()
export class FirebaseService {
  public readonly app: App;
  public readonly auth: Auth;

  // TODO: should use different app credentials for different environments
  constructor() {
    if (!this.app && getApps().length === 0) {
      this.app = initializeApp({
        credential: credential.cert(serviceAccount),
      });
    } else {
      this.app = getApps()[0];
    }

    this.auth = getAuth(this.app);
  }
}
