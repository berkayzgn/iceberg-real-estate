import { Controller, Get, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ParseMongoIdPipe } from '../../common/pipes/parse-mongo-id.pipe';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  getSummary() {
    return this.reportsService.getSummary();
  }

  @Get('agent/:id')
  getAgentReport(@Param('id', ParseMongoIdPipe) id: string) {
    return this.reportsService.getAgentReport(id);
  }
}

