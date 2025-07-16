import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getData(): { message: string; service: string; features: string[] } {
    return {
      message: 'Hello from ServiceB API',
      service: 'Logger & Reporter Service',
      features: [
        'Redis Event Subscription',
        'MongoDB Event Logging',
        'Log Query API',
        'PDF Report Generation'
      ]
    };
  }
}
