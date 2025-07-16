import { Body, Controller, Get, HttpException, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GenerateReportRequest, PDFGeneratorClient } from '@two-services/shared';
import { Response } from 'express';

export class GeneratePDFReportDto {
  reportType: string;
  startTime: string;
  endTime: string;
  metrics: string[];
  filters?: { [key: string]: string };
}

@ApiTags('PDF Reports')
@Controller('reports')
export class PDFReportController {
  constructor(private readonly pdfGeneratorClient: PDFGeneratorClient) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate PDF report from time-series data' })
  @ApiResponse({ status: 201, description: 'PDF report generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async generateReport(@Body() generateReportDto: GeneratePDFReportDto, @Res() res: Response) {
    try {
      const request: GenerateReportRequest = {
        reportType: generateReportDto.reportType,
        startTime: generateReportDto.startTime,
        endTime: generateReportDto.endTime,
        metrics: generateReportDto.metrics,
        filters: generateReportDto.filters || {},
      };

      const response = await this.pdfGeneratorClient.generateReport(request);

      if (!response.success) {
        throw new HttpException(
          response.errorMessage || 'Failed to generate PDF report',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${response.filename}"`);
      res.setHeader('Content-Length', response.pdfData.length);

      // Send PDF data
      res.send(response.pdfData);
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new HttpException(
        'Failed to generate PDF report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('status/:reportId')
  @ApiOperation({ summary: 'Get PDF report generation status' })
  @ApiResponse({ status: 200, description: 'Report status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReportStatus(@Param('reportId') reportId: string) {
    try {
      const response = await this.pdfGeneratorClient.getReportStatus({ reportId });
      return response;
    } catch (error) {
      console.error('Error getting report status:', error);
      throw new HttpException(
        'Failed to get report status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('generate-async')
  @ApiOperation({ summary: 'Generate PDF report asynchronously' })
  @ApiResponse({ status: 202, description: 'Report generation started' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async generateReportAsync(@Body() generateReportDto: GeneratePDFReportDto) {
    try {
      const request: GenerateReportRequest = {
        reportType: generateReportDto.reportType,
        startTime: generateReportDto.startTime,
        endTime: generateReportDto.endTime,
        metrics: generateReportDto.metrics,
        filters: generateReportDto.filters || {},
      };

      const response = await this.pdfGeneratorClient.generateReport(request);

      if (!response.success) {
        throw new HttpException(
          response.errorMessage || 'Failed to generate PDF report',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return {
        reportId: response.reportId,
        filename: response.filename,
        message: 'Report generation completed',
        status: 'COMPLETED',
      };
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new HttpException(
        'Failed to generate PDF report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
