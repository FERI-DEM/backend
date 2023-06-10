export const sleep = (ms = 1000) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const retryOnFailure = async <T>(
  fn: () => Promise<T>,
  numOfRetries = 3,
  onError?: (e: Error) => void,
) => {
  let retries = 0;
  let result: T;
  while (retries <= numOfRetries) {
    try {
      result = await fn();
      break;
    } catch (e) {
      retries++;
      onError(e);
      await sleep(1000);
    }
  }
  return result;
};
