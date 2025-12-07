import fetch from "node-fetch";
import * as dotenv from "dotenv";
dotenv.config();

const TEXTBEE_API_URL = "https://api.textbee.dev";
const TEXTBEE_API_KEY = process.env.TEXTBEE_API_KEY;
const TEXTBEE_DEVICE_ID = process.env.TEXTBEE_DEVICE_ID;

export async function sendApplicationConfirmationSMS(
  phone: string,
  applicantName: string,
  jobTitle: string,
  company: string
): Promise<boolean> {
  console.log(`[SMS] Attempting to send confirmation to ${phone}`);
  
  if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) {
    console.warn(
      "[SMS] TEXTBEE_API_KEY or TEXTBEE_DEVICE_ID not configured, skipping SMS"
    );
    console.warn(`[SMS] Config: API Key=${!!TEXTBEE_API_KEY}, Device ID=${!!TEXTBEE_DEVICE_ID}`);
    return false;
  }

  try {
    const message = `Hi ${applicantName}! Your application for ${jobTitle} at ${company} has been received. We'll be in touch soon!`;

    console.log(`[SMS] Sending to: ${phone}`);
    console.log(`[SMS] Device ID: ${TEXTBEE_DEVICE_ID}`);

    const response = await fetch(
      `${TEXTBEE_API_URL}/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": TEXTBEE_API_KEY,
        },
        body: JSON.stringify({
          recipients: [phone],
          message: message,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("[SMS] Failed. Status:", response.status);
      console.error("[SMS] Error:", result);
      return false;
    }

    console.log("[SMS] Success:", result);
    return true;
  } catch (error) {
    console.error("[SMS] Exception:", error);
    return false;
  }
}

export async function sendEmployerNotificationSMS(
  phone: string,
  applicantName: string,
  jobTitle: string
): Promise<boolean> {
  if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) {
    console.warn(
      "TEXTBEE_API_KEY or TEXTBEE_DEVICE_ID not configured, skipping SMS"
    );
    return false;
  }

  try {
    const message = `New application received from ${applicantName} for ${jobTitle}. Check your dashboard to review.`;

    const response = await fetch(
      `${TEXTBEE_API_URL}/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": TEXTBEE_API_KEY,
        },
        body: JSON.stringify({
          recipients: [phone],
          message: message,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Failed to send SMS:", result);
      return false;
    }

    console.log("SMS sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
}

export async function sendApplicationStatusUpdateSMS(
  phone: string,
  applicantName: string,
  jobTitle: string,
  company: string,
  status: string
): Promise<boolean> {
  if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) {
    console.warn(
      "TEXTBEE_API_KEY or TEXTBEE_DEVICE_ID not configured, skipping SMS"
    );
    return false;
  }

  try {
    let statusMessage = "";
    switch (status) {
      case "reviewed":
        statusMessage = "Your application has been reviewed";
        break;
      case "interviewing":
        statusMessage = "You have been selected for an interview";
        break;
      case "hired":
        statusMessage = "Congratulations! You have been hired";
        break;
      case "rejected":
        statusMessage =
          "Thank you for your interest. Unfortunately, your application was not selected";
        break;
      default:
        statusMessage = `Your application status has been updated to: ${status}`;
    }

    const message = `Hi ${applicantName}! ${statusMessage} for ${jobTitle} at ${company}.`;

    const response = await fetch(
      `${TEXTBEE_API_URL}/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": TEXTBEE_API_KEY,
        },
        body: JSON.stringify({
          recipients: [phone],
          message: message,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Failed to send SMS:", result);
      return false;
    }

    console.log("SMS sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Error sending SMS:", error);
    return false;
  }
}

export async function sendEmployerVerificationApprovalSMS(
  phone: string,
  employerName: string
): Promise<boolean> {
  if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) {
    console.warn(
      "TEXTBEE_API_KEY or TEXTBEE_DEVICE_ID not configured, skipping SMS"
    );
    return false;
  }

  try {
    const message = `Hi ${employerName}! Great news! Your employer verification has been approved. You can now post jobs and access all features on Pili Jobs. Welcome aboard!`;

    const response = await fetch(
      `${TEXTBEE_API_URL}/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": TEXTBEE_API_KEY,
        },
        body: JSON.stringify({
          recipients: [phone],
          message: message,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Failed to send SMS:", result);
      return false;
    }

    console.log("Verification approval SMS sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Error sending verification approval SMS:", error);
    return false;
  }
}

export async function sendEmployerVerificationRejectionSMS(
  phone: string,
  employerName: string,
  reason?: string
): Promise<boolean> {
  if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) {
    console.warn(
      "TEXTBEE_API_KEY or TEXTBEE_DEVICE_ID not configured, skipping SMS"
    );
    return false;
  }

  try {
    const reasonText = reason ? ` Reason: ${reason}.` : "";
    const message = `Hi ${employerName}! Your employer verification request has been reviewed but was not approved.${reasonText} Please contact support or resubmit your documents with the required information.`;

    const response = await fetch(
      `${TEXTBEE_API_URL}/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": TEXTBEE_API_KEY,
        },
        body: JSON.stringify({
          recipients: [phone],
          message: message,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Failed to send SMS:", result);
      return false;
    }

    console.log("Verification rejection SMS sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Error sending verification rejection SMS:", error);
    return false;
  }
}

export async function sendInterviewScheduledSMS(
  phone: string,
  applicantName: string,
  jobTitle: string,
  company: string,
  interviewDate: string,
  interviewTime: string,
  interviewVenue: string,
  interviewType: string,
  notes?: string
): Promise<boolean> {
  if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) {
    console.warn(
      "TEXTBEE_API_KEY or TEXTBEE_DEVICE_ID not configured, skipping SMS"
    );
    return false;
  }

  try {
    const typeText = interviewType === "in-person" ? "In-Person" : interviewType === "video" ? "Video Call" : "Phone";
    const notesText = notes ? ` Notes: ${notes}` : "";
    const message = `Hi ${applicantName}! You have been scheduled for an interview for ${jobTitle} at ${company}.\n\nDate: ${interviewDate}\nTime: ${interviewTime}\nType: ${typeText}\nVenue/Link: ${interviewVenue}${notesText}\n\nGood luck!`;

    const response = await fetch(
      `${TEXTBEE_API_URL}/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": TEXTBEE_API_KEY,
        },
        body: JSON.stringify({
          recipients: [phone],
          message: message,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Failed to send interview SMS:", result);
      return false;
    }

    console.log("Interview scheduled SMS sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Error sending interview scheduled SMS:", error);
    return false;
  }
}

export async function sendNotProceedingSMS(
  phone: string,
  applicantName: string,
  jobTitle: string,
  company: string,
  reason: string
): Promise<boolean> {
  if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) {
    console.warn(
      "TEXTBEE_API_KEY or TEXTBEE_DEVICE_ID not configured, skipping SMS"
    );
    return false;
  }

  try {
    const message = `Hi ${applicantName}, thank you for your interest in the ${jobTitle} position at ${company}. After careful consideration, we regret to inform you that we will not be proceeding with your application.\n\nReason: ${reason}\n\nWe appreciate your time and wish you the best in your job search.`;

    const response = await fetch(
      `${TEXTBEE_API_URL}/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": TEXTBEE_API_KEY,
        },
        body: JSON.stringify({
          recipients: [phone],
          message: message,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Failed to send not proceeding SMS:", result);
      return false;
    }

    console.log("Not proceeding SMS sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Error sending not proceeding SMS:", error);
    return false;
  }
}

export async function sendInterviewCompletedSMS(
  phone: string,
  applicantName: string,
  jobTitle: string,
  company: string
): Promise<boolean> {
  if (!TEXTBEE_API_KEY || !TEXTBEE_DEVICE_ID) {
    console.warn(
      "TEXTBEE_API_KEY or TEXTBEE_DEVICE_ID not configured, skipping SMS"
    );
    return false;
  }

  try {
    const message = `Hi ${applicantName}! Thank you for attending the interview for ${jobTitle} at ${company}. Your interview status has been updated to completed. We will notify you about the next steps soon.`;

    const response = await fetch(
      `${TEXTBEE_API_URL}/api/v1/gateway/devices/${TEXTBEE_DEVICE_ID}/send-sms`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": TEXTBEE_API_KEY,
        },
        body: JSON.stringify({
          recipients: [phone],
          message: message,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Failed to send interview completed SMS:", result);
      return false;
    }

    console.log("Interview completed SMS sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Error sending interview completed SMS:", error);
    return false;
  }
}
