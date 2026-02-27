const unauthorizedListeners = new Set<() => void>();

export function onUnauthorized(listener: () => void) {
  unauthorizedListeners.add(listener);

  return () => {
    unauthorizedListeners.delete(listener);
  };
}

export function notifyUnauthorized() {
  unauthorizedListeners.forEach((listener) => {
    listener();
  });
}

export function throwIfUnauthorized(response: Response) {
  if (response.status === 401) {
    notifyUnauthorized();
    throw new Error('AUTH_SESSION_EXPIRED');
  }
}
