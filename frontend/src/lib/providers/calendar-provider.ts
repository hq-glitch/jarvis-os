export interface CalendarProvider {
  validateConnection(integrationId: string): Promise<void>;

  listCalendars(integrationId: string): Promise<unknown[]>;

  syncEvents(
    integrationId: string,
    calendarId: string
  ): Promise<void>;

  disconnect(integrationId: string): Promise<void>;
}