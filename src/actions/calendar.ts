import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXT_PUBLIC_APP_URL
);
oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

/**
 * Creates a Google Calendar event and auto-generates a Google Meet link.
 */
export async function createCalendarEvent(
  patientEmail: string,
  doctorEmail: string,
  startTime: Date,
  endTime: Date,
  summary: string,
  description: string
) {
  try {
    const event = {
      summary,
      description,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      attendees: [{ email: patientEmail }, { email: doctorEmail }],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1, // MUST be 1 to generate Meet links
      requestBody: event,
    });

    return {
      eventId: response.data.id,
      meetLink: response.data.hangoutLink,
    };
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    throw new Error("Failed to create Google Calendar event");
  }
}

/**
 * Deletes a Google Calendar event by ID.
 */
export async function deleteCalendarEvent(eventId: string) {
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
  } catch (error) {
    console.error("Error deleting Google Calendar event:", error);
    // Suppress error to avoid breaking main cancellation flows
  }
}

/**
 * Updates a Google Calendar event time.
 */
export async function updateCalendarEvent(
  eventId: string,
  startTime: Date,
  endTime: Date
) {
  try {
    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: {
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error updating Google Calendar event:", error);
    // Suppress to not break if credentials missing in dev
  }
}
