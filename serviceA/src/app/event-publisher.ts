import Redis from 'ioredis';
import { EventPayload, Metric } from './types';
import { config } from './utils/config.util';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
});

/**
 * ServiceA-specific event publisher with Redis TimeSeries support
 * This handles metrics publishing and time-series data
 */
export class MetricsEventPublisher {
  private static instance: MetricsEventPublisher;
  private redis: Redis;

  private constructor() {
    this.redis = redisClient;
  }

  public static getInstance(): MetricsEventPublisher {
    if (!MetricsEventPublisher.instance) {
      MetricsEventPublisher.instance = new MetricsEventPublisher();
    }
    return MetricsEventPublisher.instance;
  }

  /**
   * Publish event to Redis Pub/Sub
   */
  async publishEvent(event: EventPayload): Promise<void> {
    try {
      const channel = 'service-a-events';
      const message = JSON.stringify(event);

      await this.redis.publish(channel, message);
      console.log(`Event published to ${channel}:`, event.event);
    } catch (error) {
      console.error('Error publishing event:', error);
      throw error;
    }
  }

  /**
   * Push metrics to Redis TimeSeries
   */
  async pushMetrics(metrics: Metric[], labels: Record<string, string> = {}): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      const timestamp = Date.now();

      for (const metric of metrics) {
        const key = `metrics:${metric.label}`;
        const labelString = Object.entries({ ...labels, metric: metric.label })
          .map(([k, v]) => `${k}=${v}`)
          .join(' ');

        // Use TS.ADD command for Redis TimeSeries
        pipeline.call('TS.ADD', key, timestamp, metric.value, 'LABELS', labelString);
      }

      await pipeline.exec();
      console.log(`Pushed ${metrics.length} metrics to Redis TimeSeries`);
    } catch (error) {
      console.error('Error pushing metrics to Redis TimeSeries:', error);
      throw error;
    }
  }

  /**
   * Helper method to create and publish a complete event with metrics
   */
  async publishEventWithMetrics(
    eventType: string,
    source: string,
    filename?: string,
    metrics?: Metric[]
  ): Promise<void> {
    const event: EventPayload = {
      timestamp: Date.now(),
      event: eventType,
      source,
      filename,
      metrics
    };

    // Publish the event
    await this.publishEvent(event);

    // Push metrics to TimeSeries if provided
    if (metrics && metrics.length > 0) {
      const labels = {
        source,
        service: 'service-a',
        ...(filename && { file: filename })
      };

      await this.pushMetrics(metrics, labels);
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Backward compatibility export
export const EventPublisher = MetricsEventPublisher;

// Note: For standard events (file upload, data fetch, search query),
// consider using the shared EventPublisher from '@two-services/shared'
