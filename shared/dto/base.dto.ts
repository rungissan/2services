import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationDto {
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

  @ApiProperty({
    description: 'Field to sort by',
    example: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    description: 'Sort order (asc or desc)',
    example: 'desc',
    enum: ['asc', 'desc'],
    required: false,
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class BaseResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Operation completed successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2025-07-17T10:30:00Z',
  })
  timestamp!: Date;
}

export class PaginatedResponseDto<T> {
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

  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total!: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages!: number;

  @ApiProperty({
    description: 'Array of items',
  })
  data!: T[];
}
