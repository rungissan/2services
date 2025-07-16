import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class LogQueryDto {
  @ApiProperty({
    description: 'Event type to filter by',
    example: 'upload_complete',
    required: false,
  })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiProperty({
    description: 'Start date for filtering (ISO string)',
    example: '2025-07-16T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for filtering (ISO string)',
    example: '2025-07-16T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: 'Source to filter by',
    example: 'file_upload',
    required: false,
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({
    description: 'Filename to filter by',
    example: 'data.xlsx',
    required: false,
  })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    default: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class LogResponseDto {
  @ApiProperty({
    description: 'Array of log entries',
    isArray: true,
  })
  data!: Record<string, unknown>[];

  @ApiProperty({
    description: 'Total number of log entries',
    example: 50,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit!: number;
}

export class ReportGenerationDto {
  @ApiProperty({
    description: 'Start date for report (ISO string)',
    example: '2025-07-16T00:00:00Z',
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    description: 'End date for report (ISO string)',
    example: '2025-07-16T23:59:59Z',
  })
  @IsDateString()
  endDate!: string;

  @ApiProperty({
    description: 'Report type',
    example: 'temperature_summary',
    required: false,
  })
  @IsOptional()
  @IsString()
  reportType?: string;
}
