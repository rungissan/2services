// Test data for the service
export const testMetricsData = {
  metrics: [
    { label: "temperature", value: 32.5 },
    { label: "humidity", value: 85 },
    { label: "pressure", value: 1013.25 },
    { label: "wind_speed", value: 12.5 }
  ]
};

export const testEventPayload = {
  timestamp: 1721070000000,
  event: "insert_complete",
  source: "file_upload",
  filename: "temperature-data-2025.json",
  metrics: [
    { label: "temperature", value: 32.5 },
    { label: "humidity", value: 85 }
  ]
};
