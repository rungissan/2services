import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { join } from 'path';

export interface GenerateReportRequest {
  reportType: string;
  startTime: string;
  endTime: string;
  metrics: string[];
  filters: { [key: string]: string };
}

export interface GenerateReportResponse {
  reportId: string;
  pdfData: Buffer;
  filename: string;
  success: boolean;
  errorMessage: string;
}

export interface GetReportStatusRequest {
  reportId: string;
}

export interface GetReportStatusResponse {
  reportId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  errorMessage: string;
  filename: string;
}

interface PDFGeneratorGrpcClient {
  GenerateReport: (request: any, callback: (error: any, response: any) => void) => void;
  GetReportStatus: (request: any, callback: (error: any, response: any) => void) => void;
  close: () => void;
}

@Injectable()
export class PDFGeneratorClient implements OnModuleInit, OnModuleDestroy {
  private client: PDFGeneratorGrpcClient | null = null;

  async onModuleInit() {
    const protoPath = join(__dirname, 'pdf_generator.proto');

    const packageDefinition = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
    const PDFGeneratorService = protoDescriptor.pdfgenerator.PDFGeneratorService;

    const serverAddress = process.env.PDF_GENERATOR_ADDR || 'localhost:50051';

    this.client = new PDFGeneratorService(
      serverAddress,
      grpc.credentials.createInsecure(),
    ) as PDFGeneratorGrpcClient;
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.close();
    }
  }

  async generateReport(request: GenerateReportRequest): Promise<GenerateReportResponse> {
    if (!this.client) {
      throw new Error('PDF Generator client not initialized');
    }

    return new Promise((resolve, reject) => {
      const grpcRequest = {
        report_type: request.reportType,
        start_time: request.startTime,
        end_time: request.endTime,
        metrics: request.metrics,
        filters: request.filters,
      };

      this.client!.GenerateReport(grpcRequest, (error: Error | null, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            reportId: response.report_id,
            pdfData: response.pdf_data,
            filename: response.filename,
            success: response.success,
            errorMessage: response.error_message,
          });
        }
      });
    });
  }

  async getReportStatus(request: GetReportStatusRequest): Promise<GetReportStatusResponse> {
    if (!this.client) {
      throw new Error('PDF Generator client not initialized');
    }

    return new Promise((resolve, reject) => {
      const grpcRequest = {
        report_id: request.reportId,
      };

      this.client!.GetReportStatus(grpcRequest, (error: Error | null, response: any) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            reportId: response.report_id,
            status: response.status,
            errorMessage: response.error_message,
            filename: response.filename,
          });
        }
      });
    });
  }
}
