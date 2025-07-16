import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'temperature',
    required: false,
  })
  @IsOptional()
  @IsString()
  query?: string;

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

export class SearchResponseDto {
  @ApiProperty({
    description: 'Array of search results',
    isArray: true,
  })
  data!: Record<string, unknown>[];

  @ApiProperty({
    description: 'Total number of results',
    example: 150,
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
