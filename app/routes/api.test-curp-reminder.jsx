import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);

    const body = await request.json();

    const {
      orderId,
      recipientEmail,
    } = body;

    if (!orderId) {
      return Response.json(
        {
          success: false,
          error: "Missing orderId",
        },
        {
          status: 400,
        }
      );
    }

    if (!recipientEmail) {
      return Response.json(
        {
          success: false,
          error: "Missing recipientEmail",
        },
        {
          status: 400,
        }
      );
    }

    const response = await admin.graphql(
      `#graphql
        mutation SendCurpReminder(
          $orderId: ID!
          $email: EmailInput
        ) {
          orderInvoiceSend(
            id: $orderId
            email: $email
          ) {
            order {
              id
              name
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        variables: {
          orderId,
          email: {
            to: recipientEmail,
            subject: "Reminder: Additional Shipping Information Required",
            body:
              "This is a reminder that your order is still missing the CURP information required for shipment to Mexico. Please return to your order status page and complete the required information as soon as possible.",
            customMessage:
              "If you have already submitted your CURP, no further action is needed.",
          },
        },
      }
    );

    const result = await response.json();

    const invoiceResult =
      result?.data?.orderInvoiceSend;

    const errors =
      invoiceResult?.userErrors || [];

    if (errors.length > 0) {
      console.error(
        "CURP reminder test failed:",
        errors
      );

      return Response.json(
        {
          success: false,
          errors,
        },
        {
          status: 400,
        }
      );
    }

    return Response.json({
      success: true,
      order: invoiceResult?.order,
    });
  } catch (error) {
    console.error(
      "CURP reminder test failed:",
      error
    );

    return Response.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to send test reminder",
      },
      {
        status: 500,
      }
    );
  }
};