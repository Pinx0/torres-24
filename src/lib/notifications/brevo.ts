import { SendSmtpEmail, TransactionalEmailsApi } from "@getbrevo/brevo";

export type EmailRecipient = {
  email: string;
  name?: string;
};

export type SendTransactionalEmailInput = {
  to: EmailRecipient[];
  templateId: number;
  params?: Record<string, unknown>;
};

export type SendEmailResult = {
  success: boolean;
  skipped: boolean;
  error?: string;
};

let cachedClient: TransactionalEmailsApi | null = null;

type BrevoClientWithAuth = TransactionalEmailsApi & {
  authentications: {
    apiKey: {
      apiKey: string;
    };
  };
};

function getBrevoClient(): TransactionalEmailsApi | null {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    return null;
  }

  if (!cachedClient) {
    const client = new TransactionalEmailsApi();
    // Brevo SDK typing doesn't expose authentications; follow their TS guidance.
    (client as BrevoClientWithAuth).authentications.apiKey.apiKey = apiKey;
    cachedClient = client;
  }

  return cachedClient;
}

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<SendEmailResult> {
  const client = getBrevoClient();

  if (!client) {
    return {
      success: false,
      skipped: true,
      error: "Missing BREVO_API_KEY",
    };
  }

  if (!input.to.length) {
    return {
      success: false,
      skipped: true,
      error: "No recipients provided",
    };
  }

  const email = new SendSmtpEmail();
  email.to = input.to;
  email.templateId = input.templateId;

  if (input.params && Object.keys(input.params).length > 0) {
    email.params = input.params;
  }

  try {
    await client.sendTransacEmail(email);
    return { success: true, skipped: false };
  } catch (error) {
    console.error("Error enviando email con Brevo:", error);
    return {
      success: false,
      skipped: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
