type SentryInstance = {
  captureException: jest.Mock
}

export const sentry = (callback: (sentry: SentryInstance) => void) => {
  // Mock implementation
  callback({
    captureException: jest.fn(),
  })
}
