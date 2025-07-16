import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Service B - Logger & Reporter')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get service status' })
  @ApiResponse({ status: 200, description: 'Service status information' })
  getData() {
    return this.appService.getData();
  }
}
