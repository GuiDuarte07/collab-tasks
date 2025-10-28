import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return [
      {
        status: process.env.RABBITMQ_URL,
        timestamp: new Date().toISOString(),
        service: 'api-gateway',
      },
    ];
  }
}
