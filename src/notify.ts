import { toasts } from 'svelte-toasts';
import { ServerError } from './error';

export async function notifyOnError<T>(promise: Promise<T>) {
  try {
    const result = await promise;
    return result;
  } catch (e) {
    if (e instanceof ServerError) {
      toasts.error(e.toString());
    }
    return Promise.reject(e);
  }
}
