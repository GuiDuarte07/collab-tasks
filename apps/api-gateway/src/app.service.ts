import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return [
      {
        status: 'working',
        timestamp: new Date().toISOString(),
        //service: 'api-gateway',
      },
    ];
  }
}
