import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File to upload (JSON or Excel)',
  })
  file!: Express.Multer.File;
}

export class UploadFileResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'File uploaded and processed successfully',
  })
  message!: string;

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
