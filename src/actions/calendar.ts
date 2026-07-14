import { google } from 'googleapis';
import "server-only"; // Ensures this file never leaks to the client-side

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
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`, // Better uniqueness
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1, // MUST be 1 to generate Meet links
      sendUpdates: 'all', // Ensures patient and doctor get an email invitation
      requestBody: event,
    });

    return {
      success: true,
      eventId: response.data.id,
      meetLink: response.data.hangoutLink,
    };
  } catch (error: any) {
    console.error("Error creating Google Calendar event:", error.message || error);
    throw new Error("Failed to create Google Calendar event");
  }
}

/**
 * Deletes a Google Calendar event by ID.
 */
export async function deleteCalendarEvent(eventId: string) {
  if (!eventId) return { success: false, error: "No event ID provided" };

  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all', // Notifies attendees of cancellation
    });
    return { success: true };
  } catch (error: any) {
    console.error(`Error deleting Google Calendar event (${eventId}):`, error.message || error);
    // Return failure instead of swallowing the error, so the caller can decide what to do
    return { success: false, error: error.message };
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
  if (!eventId) return { success: false, error: "No event ID provided" };

  try {
    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all', // Notifies attendees of time change
      requestBody: {
        start: { dateTime: startTime.toISOString() },
        end: { dateTime: endTime.toISOString() },
      }
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error(`Error updating Google Calendar event (${eventId}):`, error.message || error);
    return { success: false, error: error.message };
  }
}