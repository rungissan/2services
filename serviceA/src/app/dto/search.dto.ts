import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto, PaginationDto } from '@two-services/shared';
import { IsOptional, IsString } from 'class-validator';

export class SearchQueryDto extends PaginationDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'temperature',
    required: false,
  })
  @IsOptional()
  @IsString()
  query?: string;
}

export class SearchResponseDto extends PaginatedResponseDto<Record<string, unknown>> {
  // Inherits data, total, page, limit from PaginatedResponseDto
}
