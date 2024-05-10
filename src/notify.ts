import { toasts } from 'svelte-toasts';
import type { ToastProps } from 'svelte-toasts/types/common';
import { ServerError } from './error';
import { GetUpdateList } from './server';

export async function notifyOnError<T>(promise: Promise<T>) {
  try {
    const result = await promise;
    return result;
  } catch (e) {
    if (e instanceof ServerError) {
      toasts.error(e.toString(), {
        duration: 0,
      });
    }
    return Promise.reject(e);
  }
}

export function notifyInfo(text: string) {
  return toasts.info(text);
}

export function notifyWarn(text: string) {
  return toasts.warning(text);
}

export function notifyError(text: string) {
  return toasts.error(text, {
    duration: 0,
  });
}

export function notifyDismiss(uid: number) {
  const toast = toasts.getById(uid);
  if (toast && toast.remove) toast.remove();
}

const updateToastID = new Map<string, number[]>();
export function registerToast(toast: ToastProps, updateID: string) {
  if (GetUpdateList().has(updateID)) {
    toast.remove?.();
    return;
  }
  if (!updateToastID.has(updateID)) updateToastID.set(updateID, []);
  // @ts-ignore updateToastID.get(updateID) might be undefined
  updateToastID.get(updateID).push(toast.uid);
}

export function dismissUpdateID(updateID: string) {
  const uids = updateToastID.get(updateID);
  if (uids) {
    uids.forEach(notifyDismiss);
    updateToastID.delete(updateID);
  }
}
