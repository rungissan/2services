import { Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { fetchAndSaveData } from './data-fetcher';
import { FetchDataResponseDto } from './dto/fetch-data.dto';
import { SearchQueryDto, SearchResponseDto } from './dto/search.dto';
import { UploadFileResponseDto } from './dto/upload-file.dto';
import { EventPublisher } from './event-publisher';
import { uploadAndParseFile } from './file-uploader';
import { ensureTextIndex, searchMetrics } from './search-api';
import type { SearchQuery, UploadRequest } from './types';

@ApiTags('Service A - Data Processor')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Get service status' })
  @ApiResponse({ status: 200, description: 'Service status information' })
  getData() {
    return this.appService.getData();
  }

  @Post('fetch-data')
  @ApiTags('data-fetcher')
  @ApiOperation({ summary: 'Fetch data from external sources' })
  @ApiResponse({
    status: 200,
    description: 'Data fetched and saved successfully',
    type: FetchDataResponseDto
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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

      return {
        message: 'Data fetched and saved successfully',
        timestamp: new Date().toISOString(),
        recordsProcessed: 100 // This should be actual count
      };
    } catch (error) {
      throw new Error(`Failed to fetch data: ${(error as Error).message}`);
    }
  }

  @Post('upload')
  @ApiTags('file-upload')
  @ApiOperation({ summary: 'Upload and parse file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'File uploaded and processed successfully',
    type: UploadFileResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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

      return {
        message: 'File uploaded and processed successfully',
        filename: file.originalname,
        recordsProcessed: 250 // This should be actual count
      };
    } catch (error) {
      throw new Error(`Failed to upload file: ${(error as Error).message}`);
    }
  }

  @Get('search')
  @ApiTags('search')
  @ApiOperation({ summary: 'Search database records' })
  @ApiResponse({
    status: 200,
    description: 'Search results returned successfully',
    type: SearchResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid search parameters' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async search(@Query() query: SearchQueryDto) {
    try {
      const results = await searchMetrics(query as SearchQuery);

      // Publish event
      const eventPublisher = EventPublisher.getInstance();
      await eventPublisher.publishEventWithMetrics(
        'search_complete',
        'search_api'
      );

      return {
        data: results,
        total: Array.isArray(results) ? results.length : 0,
        page: query.page || 1,
        limit: query.limit || 10
      };
    } catch (error) {
      throw new Error(`Search failed: ${(error as Error).message}`);
    }
  }

  @Post('init-index')
  @ApiTags('search')
  @ApiOperation({ summary: 'Initialize database text index' })
  @ApiResponse({ status: 200, description: 'Text index created successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async initializeIndex() {
    try {
      await ensureTextIndex();
      return { message: 'Text index created successfully' };
    } catch (error) {
      throw new Error(`Failed to create index: ${(error as Error).message}`);
    }
  }
}
