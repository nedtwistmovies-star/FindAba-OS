let listeners: any[] = [];

export function subscribeToast(cb: any) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

export function notify(message: string) {
  listeners.forEach((cb) => cb(message));
}
