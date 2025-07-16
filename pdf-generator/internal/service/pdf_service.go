package service

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"pdf-generator/internal/redis"
	"pdf-generator/proto"
	"sort"
	"time"

	"github.com/go-pdf/fpdf"
	"github.com/wcharczuk/go-chart/v2"
	"github.com/wcharczuk/go-chart/v2/drawing"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// PDFService implements the PDF generator service
type PDFService struct {
	proto.UnimplementedPDFGeneratorServiceServer
	redisClient *redis.RedisClient
}

// NewPDFService creates a new PDF service
func NewPDFService(redisClient *redis.RedisClient) *PDFService {
	return &PDFService{
		redisClient: redisClient,
	}
}

// GenerateReport generates a PDF report from Redis TimeSeries data
func (s *PDFService) GenerateReport(ctx context.Context, req *proto.GenerateReportRequest) (*proto.GenerateReportResponse, error) {
	// Parse time range
	startTime, err := time.Parse(time.RFC3339, req.StartTime)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid start time: %v", err)
	}

	endTime, err := time.Parse(time.RFC3339, req.EndTime)
	if err != nil {
		return nil, status.Errorf(codes.InvalidArgument, "invalid end time: %v", err)
	}

	// Get time series data from Redis
	seriesData, err := s.redisClient.GetMultipleTimeSeriesData(
		ctx,
		req.Filters,
		startTime.Unix()*1000, // Convert to milliseconds
		endTime.Unix()*1000,
	)
	if err != nil {
		log.Printf("Error getting time series data: %v", err)
		return nil, status.Errorf(codes.Internal, "failed to get time series data: %v", err)
	}

	// Generate PDF
	pdfData, err := s.generatePDF(req.ReportType, seriesData, req.Metrics, startTime, endTime)
	if err != nil {
		log.Printf("Error generating PDF: %v", err)
		return nil, status.Errorf(codes.Internal, "failed to generate PDF: %v", err)
	}

	filename := fmt.Sprintf("report_%s_%s.pdf", req.ReportType, time.Now().Format("20060102_150405"))

	return &proto.GenerateReportResponse{
		ReportId:     generateReportID(),
		PdfData:      pdfData,
		Filename:     filename,
		Success:      true,
		ErrorMessage: "",
	}, nil
}

// GetReportStatus gets the status of a report generation (simplified for now)
func (s *PDFService) GetReportStatus(ctx context.Context, req *proto.GetReportStatusRequest) (*proto.GetReportStatusResponse, error) {
	// In a real implementation, you'd store report status in Redis or a database
	return &proto.GetReportStatusResponse{
		ReportId:     req.ReportId,
		Status:       proto.ReportStatus_COMPLETED,
		ErrorMessage: "",
		Filename:     fmt.Sprintf("report_%s.pdf", req.ReportId),
	}, nil
}

// generatePDF creates a PDF with charts and summaries
func (s *PDFService) generatePDF(reportType string, seriesData map[string][]redis.TimeSeriesPoint, metrics []string, startTime, endTime time.Time) ([]byte, error) {
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Title
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(0, 10, fmt.Sprintf("Time Series Report - %s", reportType))
	pdf.Ln(15)

	// Report metadata
	pdf.SetFont("Arial", "", 10)
	pdf.Cell(0, 8, fmt.Sprintf("Generated: %s", time.Now().Format("2006-01-02 15:04:05")))
	pdf.Ln(5)
	pdf.Cell(0, 8, fmt.Sprintf("Period: %s to %s", startTime.Format("2006-01-02 15:04:05"), endTime.Format("2006-01-02 15:04:05")))
	pdf.Ln(10)

	// Summary statistics
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(0, 8, "Summary Statistics")
	pdf.Ln(8)
	pdf.SetFont("Arial", "", 10)

	for key, points := range seriesData {
		if len(points) == 0 {
			continue
		}

		pdf.Cell(0, 6, fmt.Sprintf("Metric: %s", key))
		pdf.Ln(5)

		// Calculate basic statistics
		var sum, min, max float64
		min = points[0].Value
		max = points[0].Value

		for _, point := range points {
			sum += point.Value
			if point.Value < min {
				min = point.Value
			}
			if point.Value > max {
				max = point.Value
			}
		}

		avg := sum / float64(len(points))

		pdf.Cell(20, 5, "")
		pdf.Cell(0, 5, fmt.Sprintf("Count: %d, Average: %.2f, Min: %.2f, Max: %.2f", len(points), avg, min, max))
		pdf.Ln(8)
	}

	// Generate charts for each metric
	for key, points := range seriesData {
		if len(points) == 0 {
			continue
		}

		chartData, err := s.generateChart(key, points)
		if err != nil {
			log.Printf("Error generating chart for %s: %v", key, err)
			continue
		}

		// Add chart to PDF
		pdf.AddPage()
		pdf.SetFont("Arial", "B", 12)
		pdf.Cell(0, 8, fmt.Sprintf("Chart: %s", key))
		pdf.Ln(10)

		// In a real implementation, you'd embed the chart image
		// For now, we'll just add a placeholder
		pdf.SetFont("Arial", "", 10)
		pdf.Cell(0, 6, "[Chart would be displayed here]")
		pdf.Ln(5)
		pdf.Cell(0, 6, fmt.Sprintf("Chart data points: %d", len(chartData)))
		pdf.Ln(10)

		// Add data table
		pdf.SetFont("Arial", "B", 10)
		pdf.Cell(50, 8, "Timestamp")
		pdf.Cell(30, 8, "Value")
		pdf.Cell(0, 8, "Labels")
		pdf.Ln(8)

		pdf.SetFont("Arial", "", 8)
		for i, point := range points {
			if i >= 20 { // Limit to first 20 points
				pdf.Cell(0, 6, "... (truncated)")
				break
			}

			timestamp := time.Unix(point.Timestamp/1000, 0).Format("2006-01-02 15:04:05")
			pdf.Cell(50, 6, timestamp)
			pdf.Cell(30, 6, fmt.Sprintf("%.2f", point.Value))

			labels := ""
			for k, v := range point.Labels {
				labels += fmt.Sprintf("%s:%s ", k, v)
			}
			pdf.Cell(0, 6, labels)
			pdf.Ln(6)
		}
	}

	// Output PDF as bytes
	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, fmt.Errorf("failed to output PDF: %w", err)
	}

	return buf.Bytes(), nil
}

// generateChart creates a chart from time series data
func (s *PDFService) generateChart(title string, points []redis.TimeSeriesPoint) ([]byte, error) {
	// Sort points by timestamp
	sort.Slice(points, func(i, j int) bool {
		return points[i].Timestamp < points[j].Timestamp
	})

	// Prepare data for chart
	xValues := make([]time.Time, len(points))
	yValues := make([]float64, len(points))

	for i, point := range points {
		xValues[i] = time.Unix(point.Timestamp/1000, 0)
		yValues[i] = point.Value
	}

	// Create chart
	graph := chart.Chart{
		Title: title,
		Background: chart.Style{
			Padding: chart.Box{
				Top:  20,
				Left: 20,
			},
		},
		XAxis: chart.XAxis{
			Name: "Time",
			Style: chart.Style{
				TextRotationDegrees: 45.0,
			},
		},
		YAxis: chart.YAxis{
			Name: "Value",
		},
		Series: []chart.Series{
			chart.TimeSeries{
				Name:    title,
				XValues: xValues,
				YValues: yValues,
				Style: chart.Style{
					StrokeColor: drawing.ColorBlue,
					StrokeWidth: 2,
				},
			},
		},
	}

	// Render chart to buffer
	var buf bytes.Buffer
	err := graph.Render(chart.PNG, &buf)
	if err != nil {
		return nil, fmt.Errorf("failed to render chart: %w", err)
	}

	return buf.Bytes(), nil
}

// generateReportID generates a unique report ID
func generateReportID() string {
	return fmt.Sprintf("report_%d", time.Now().UnixNano())
}
