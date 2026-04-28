export const emailService = {
  async sendOrderEmail(payload) {
    const webhookUrl = import.meta.env.VITE_N8N_EMAIL_WEBHOOK;
    
    if (!webhookUrl) {
      console.warn("VITE_N8N_EMAIL_WEBHOOK is not defined. Skipping email delivery.");
      return { success: true, message: "Skipped (no webhook URL)" };
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Email webhook failed with status ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending order email via n8n:", error);
      return { success: false, error: error.message };
    }
  }
};
