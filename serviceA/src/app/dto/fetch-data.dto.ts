import { ApiProperty } from '@nestjs/swagger';
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

export class FetchDataResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Data fetched and saved successfully',
  })
  message!: string;

  @ApiProperty({
    description: 'Timestamp of the operation',
    example: '2025-07-16T10:30:00Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Number of records processed',
    example: 150,
  })
  recordsProcessed!: number;
}
