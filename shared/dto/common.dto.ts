import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { PaginationDto } from './base.dto';

export class DateRangeDto {
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
    example: '2025-07-17T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class DateRangeQueryDto extends PaginationDto {
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
    example: '2025-07-17T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
