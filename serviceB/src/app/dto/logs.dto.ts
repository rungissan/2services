import { ApiProperty } from '@nestjs/swagger';
import { DateRangeDto, PaginatedResponseDto, PaginationDto } from '@two-services/shared';
import { IsOptional, IsString } from 'class-validator';

export class LogQueryDto extends PaginationDto {
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
  @IsString()
  startDate?: string;

  @ApiProperty({
    description: 'End date for filtering (ISO string)',
    example: '2025-07-16T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsString()
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
}

export class LogResponseDto extends PaginatedResponseDto<Record<string, unknown>> {
  // Inherits data, total, page, limit from PaginatedResponseDto
}

export class ReportGenerationDto extends DateRangeDto {
  @ApiProperty({
    description: 'Report type',
    example: 'temperature_summary',
    required: false,
  })
  @IsOptional()
  @IsString()
  reportType?: string;
}
