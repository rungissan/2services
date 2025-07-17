import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '@two-services/shared';

export class UploadFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload (JSON or Excel)',
  })
  file!: Express.Multer.File;
}

export class UploadFileResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Original filename',
    example: 'data.xlsx',
  })
  filename!: string;

  @ApiProperty({
    description: 'Number of records processed',
    example: 250,
  })
  recordsProcessed!: number;
}
