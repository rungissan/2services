import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '@two-services/shared';
import { IsOptional, IsString } from 'class-validator';

export class FetchDataDto {
  @ApiProperty({
    description: 'Optional URL to fetch data from',
    example: 'https://api.example.com/data',
    required: false,
  })
  @IsOptional()
  @IsString()
  url?: string;
}

export class FetchDataResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Number of records processed',
    example: 150,
  })
  recordsProcessed!: number;
}
