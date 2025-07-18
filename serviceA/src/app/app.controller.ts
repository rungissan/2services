import { Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FetchDataResponseDto } from './dto/fetch-data.dto';
import { SearchQueryDto, SearchResponseDto } from './dto/search.dto';
import { UploadFileResponseDto } from './dto/upload-file.dto';
import { EventPublisher } from './event-publisher';
import { AppService } from './services/app.service';
import type { SearchQuery, UploadRequest } from './types';
import { fetchAndSaveData } from './utils/data-fetcher.util';
import { uploadAndParseFile } from './utils/file-uploader.util';
import { ensureTextIndex, searchMetrics } from './utils/search-api.util';

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
      const recordsProcessed = await fetchAndSaveData();

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
        recordsProcessed
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
      const recordsProcessed = await uploadAndParseFile(req);

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
        recordsProcessed
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
  async search(@Query() queryDto: SearchQueryDto) {
    try {
      // Map DTO to SearchQuery interface
      const searchQuery: SearchQuery = {
        q: queryDto.query,
        page: queryDto.page,
        limit: queryDto.limit,
      };

      const results = await searchMetrics(searchQuery);

      // Publish event
      const eventPublisher = EventPublisher.getInstance();
      await eventPublisher.publishEventWithMetrics(
        'search_complete',
        'search_api'
      );

      return {
        data: results,
        total: Array.isArray(results) ? results.length : 0,
        page: queryDto.page || 1,
        limit: queryDto.limit || 10
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
