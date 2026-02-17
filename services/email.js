import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
  SendSmtpEmail,
} from "@getbrevo/brevo";

console.log("✓ Email service initializing...");
console.log("BREVO_API_KEY set:", !!process.env.BREVO_API_KEY);
console.log("SENDER_EMAIL:", process.env.SENDER_EMAIL);

const brevoClient = new TransactionalEmailsApi();
brevoClient.setApiKey(
  TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY,
);

console.log("✓ Email service ready");

const ADMIN_EMAILS = [
  { email: "jaime.mediano@gmail.com", name: "Jaime" },
  { email: "luisalcarazt@yahoo.es", name: "Luis" },
];
const SENDER_EMAIL = process.env.SENDER_EMAIL || "noreply@luisfoto.com";

export async function notifyNewComment({
  postTitle,
  commentEmail,
  commentContent,
}) {
  const message = new SendSmtpEmail();

  message.sender = { name: "Luis Foto Nature", email: SENDER_EMAIL };
  message.to = ADMIN_EMAILS;
  message.templateId = 2;
  message.params = {
    postTitle,
    commentEmail,
    commentContent,
  };

  try {
    const response = await brevoClient.sendTransacEmail(message);
    console.log("✅ Email sent successfully:", response.body);
    return response.body;
  } catch (error) {
    console.error(
      "❌ Failed to send comment notification email:",
      error?.body ?? error?.message ?? error,
    );
  }
}
