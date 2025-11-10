export function logEvent(eventName: string, payload: Record<string, any>) {
  console.log(`[Analytics] ${eventName}`, payload);
}
