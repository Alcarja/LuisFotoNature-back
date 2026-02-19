import {
  TransactionalEmailsApi,
  TransactionalEmailsApiApiKeys,
  SendSmtpEmail,
} from "@getbrevo/brevo";

const brevoClient = new TransactionalEmailsApi();
brevoClient.setApiKey(
  TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY,
);

const ADMIN_EMAILS = JSON.parse(process.env.ADMIN_EMAILS);
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
    return response.body;
  } catch (error) {
    console.error(
      "❌ Failed to send comment notification email:",
      error?.body ?? error?.message ?? error,
    );
  }
}
