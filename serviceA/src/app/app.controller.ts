import { Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import { fetchAndSaveData } from './data-fetcher';
import { EventPublisher } from './event-publisher';
import { uploadAndParseFile } from './file-uploader';
import { ensureTextIndex, searchMetrics } from './search-api';
import type { SearchQuery, UploadRequest } from './types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Post('fetch-data')
  async fetchData() {
    try {
      await fetchAndSaveData();

      // Publish event
      const eventPublisher = EventPublisher.getInstance();
      await eventPublisher.publishEventWithMetrics(
        'fetch_complete',
        'api_fetch',
        'timeseries_data_quoter.json'
      );

      return { message: 'Data fetched and saved successfully' };
    } catch (error) {
      throw new Error(`Failed to fetch data: ${(error as Error).message}`);
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      const req: UploadRequest = { file };
      await uploadAndParseFile(req);

      // Publish event
      const eventPublisher = EventPublisher.getInstance();
      await eventPublisher.publishEventWithMetrics(
        'upload_complete',
        'file_upload',
        file.originalname
      );

      return { message: 'File uploaded and processed successfully' };
    } catch (error) {
      throw new Error(`Failed to upload file: ${(error as Error).message}`);
    }
  }

  @Get('search')
  async search(@Query() query: SearchQuery) {
    try {
      const results = await searchMetrics(query);

      // Publish event
      const eventPublisher = EventPublisher.getInstance();
      await eventPublisher.publishEventWithMetrics(
        'search_complete',
        'search_api'
      );

      return results;
    } catch (error) {
      throw new Error(`Search failed: ${(error as Error).message}`);
    }
  }

  @Post('init-index')
  async initializeIndex() {
    try {
      await ensureTextIndex();
      return { message: 'Text index created successfully' };
    } catch (error) {
      throw new Error(`Failed to create index: ${(error as Error).message}`);
    }
  }
}
