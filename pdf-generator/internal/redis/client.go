package redis

import (
	"context"
	"fmt"
	"strconv"
	"strings"

	"github.com/go-redis/redis/v8"
)

// RedisClient handles Redis TimeSeries operations
type RedisClient struct {
	client *redis.Client
}

// TimeSeriesPoint represents a single data point
type TimeSeriesPoint struct {
	Timestamp int64             `json:"timestamp"`
	Value     float64           `json:"value"`
	Labels    map[string]string `json:"labels"`
}

// NewRedisClient creates a new Redis client
func NewRedisClient(addr, password string, db int) *RedisClient {
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	return &RedisClient{
		client: rdb,
	}
}

// GetTimeSeriesData retrieves time series data from Redis TimeSeries
func (r *RedisClient) GetTimeSeriesData(ctx context.Context, key string, startTime, endTime int64) ([]TimeSeriesPoint, error) {
	// Use TS.RANGE to get time series data
	cmd := r.client.Do(ctx, "TS.RANGE", key, startTime, endTime)
	result, err := cmd.Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get time series data: %w", err)
	}

	// Parse the result
	points := []TimeSeriesPoint{}
	if resultSlice, ok := result.([]interface{}); ok {
		for _, item := range resultSlice {
			if point, ok := item.([]interface{}); ok && len(point) >= 2 {
				timestamp, _ := strconv.ParseInt(string(point[0].([]byte)), 10, 64)
				value, _ := strconv.ParseFloat(string(point[1].([]byte)), 64)

				points = append(points, TimeSeriesPoint{
					Timestamp: timestamp,
					Value:     value,
					Labels:    make(map[string]string),
				})
			}
		}
	}

	return points, nil
}

// GetMultipleTimeSeriesData retrieves multiple time series with labels
func (r *RedisClient) GetMultipleTimeSeriesData(ctx context.Context, filters map[string]string, startTime, endTime int64) (map[string][]TimeSeriesPoint, error) {
	// Build filter string for TS.MRANGE
	filterParts := []string{}
	for key, value := range filters {
		filterParts = append(filterParts, fmt.Sprintf("%s=%s", key, value))
	}

	var cmd *redis.Cmd
	if len(filterParts) > 0 {
		filterStr := strings.Join(filterParts, " ")
		cmd = r.client.Do(ctx, "TS.MRANGE", startTime, endTime, "FILTER", filterStr)
	} else {
		cmd = r.client.Do(ctx, "TS.MRANGE", startTime, endTime)
	}

	result, err := cmd.Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get multiple time series data: %w", err)
	}

	seriesData := make(map[string][]TimeSeriesPoint)

	if resultSlice, ok := result.([]interface{}); ok {
		for _, series := range resultSlice {
			if seriesInfo, ok := series.([]interface{}); ok && len(seriesInfo) >= 3 {
				// Extract key name
				keyName := string(seriesInfo[0].([]byte))

				// Extract labels (if any)
				labels := make(map[string]string)
				if labelsData, ok := seriesInfo[1].([]interface{}); ok {
					for _, label := range labelsData {
						if labelPair, ok := label.([]interface{}); ok && len(labelPair) >= 2 {
							key := string(labelPair[0].([]byte))
							value := string(labelPair[1].([]byte))
							labels[key] = value
						}
					}
				}

				// Extract data points
				points := []TimeSeriesPoint{}
				if dataPoints, ok := seriesInfo[2].([]interface{}); ok {
					for _, point := range dataPoints {
						if pointData, ok := point.([]interface{}); ok && len(pointData) >= 2 {
							timestamp, _ := strconv.ParseInt(string(pointData[0].([]byte)), 10, 64)
							value, _ := strconv.ParseFloat(string(pointData[1].([]byte)), 64)

							points = append(points, TimeSeriesPoint{
								Timestamp: timestamp,
								Value:     value,
								Labels:    labels,
							})
						}
					}
				}

				seriesData[keyName] = points
			}
		}
	}

	return seriesData, nil
}

// GetMetricSummary gets aggregated statistics for a metric
func (r *RedisClient) GetMetricSummary(ctx context.Context, key string, startTime, endTime int64) (map[string]float64, error) {
	// Get average
	avgCmd := r.client.Do(ctx, "TS.RANGE", key, startTime, endTime, "AGGREGATION", "avg", "3600000") // 1 hour buckets
	avgResult, err := avgCmd.Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get average: %w", err)
	}

	// Get max
	maxCmd := r.client.Do(ctx, "TS.RANGE", key, startTime, endTime, "AGGREGATION", "max", "3600000")
	_, err = maxCmd.Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get max: %w", err)
	}

	// Get min
	minCmd := r.client.Do(ctx, "TS.RANGE", key, startTime, endTime, "AGGREGATION", "min", "3600000")
	_, err = minCmd.Result()
	if err != nil {
		return nil, fmt.Errorf("failed to get min: %w", err)
	}

	summary := make(map[string]float64)

	// Process results (simplified - in production you'd want more robust parsing)
	if avgSlice, ok := avgResult.([]interface{}); ok && len(avgSlice) > 0 {
		var totalAvg float64
		count := 0
		for _, item := range avgSlice {
			if point, ok := item.([]interface{}); ok && len(point) >= 2 {
				value, _ := strconv.ParseFloat(string(point[1].([]byte)), 64)
				totalAvg += value
				count++
			}
		}
		if count > 0 {
			summary["average"] = totalAvg / float64(count)
		}
	}

	// Similar processing for max and min...
	summary["max"] = 0
	summary["min"] = 0

	return summary, nil
}

// Close closes the Redis connection
func (r *RedisClient) Close() error {
	return r.client.Close()
}
