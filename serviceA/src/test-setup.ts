import { EventPublisher } from './app/event-publisher';

// Jest global teardown - this runs after all test suites complete
// eslint-disable-next-line @typescript-eslint/no-unused-vars
global.afterAll(async () => {
  try {
    const publisher = EventPublisher.getInstance();
    await publisher.close();
  } catch {
    // Ignore errors during cleanup - Redis might already be closed
  }
});
