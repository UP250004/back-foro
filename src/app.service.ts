import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {//endpoint de localhost:3000/
      status: 'ok',
      service: 'foro-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
