import { useState } from "react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export default function TestCurpReminder() {
  const [orderId, setOrderId] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  async function sendTestReminder() {
    setSending(true);
    setStatus("");

    try {
      const response = await fetch("/api/test-curp-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          recipientEmail,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setStatus(
          `Error: ${
            result.error ||
            result.errors?.map((error) => error.message).join(", ") ||
            "Unable to send reminder"
          }`
        );
        return;
      }

      setStatus(
        `Success! Reminder sent for ${
          result.order?.name || result.order?.id || "order"
        }.`
      );
    } catch (error) {
      setStatus(
        `Error: ${
          error instanceof Error
            ? error.message
            : "Unable to send reminder"
        }`
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <s-page heading="CURP Reminder Test">
      <s-section heading="Send a test reminder">
        <s-stack direction="block" gap="base">
          <s-text>
            Use a real test order and an email address you can access.
          </s-text>

          <s-text-field
            label="Shopify Order ID"
            value={orderId}
            onInput={(event) => setOrderId(event.currentTarget.value)}
            placeholder="gid://shopify/Order/1234567890"
          />

          <s-text-field
            label="Recipient email"
            value={recipientEmail}
            onInput={(event) =>
              setRecipientEmail(event.currentTarget.value)
            }
            placeholder="you@example.com"
          />

          <s-button
            variant="primary"
            disabled={!orderId || !recipientEmail || sending}
            onClick={sendTestReminder}
          >
            {sending ? "Sending..." : "Send Test Reminder"}
          </s-button>

          {status ? <s-text>{status}</s-text> : null}
        </s-stack>
      </s-section>
    </s-page>
  );
}