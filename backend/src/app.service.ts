import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot() {
    return {
      name: 'estate-agency-api',
      message: 'Emlak işlem API — system-guide.md',
      docs: 'Swagger sonraki aşamalarda /api/docs',
    };
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
