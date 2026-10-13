import { authenticate, unauthenticated } from "../shopify.server";

export const loader = async ({ request }) => {
  const { cors } = await authenticate.public.checkout(request);

  return cors(
    new Response(null, {
      status: 204,
    })
  );
};

export const action = async ({ request }) => {
  try {
    const { cors, sessionToken } =
      await authenticate.public.checkout(request);

    const shop = sessionToken.dest;

    const { admin } = await unauthenticated.admin(shop);

    const body = await request.json();

    const {
      confirmationNumber,
      fields = {},
    } = body;

    if (!confirmationNumber) {
      return cors(
        Response.json(
          {
            success: false,
            error: "Missing confirmation number",
          },
          {
            status: 400,
          }
        )
      );
    }

    if (!fields || typeof fields !== "object") {
      return cors(
        Response.json(
          {
            success: false,
            error: "Missing fields",
          },
          {
            status: 400,
          }
        )
      );
    }

    /*
     * Find the real Shopify Order using the
     * confirmation number from the Thank You page.
     */
    const orderLookupResponse = await admin.graphql(
      `#graphql
        query FindOrderByConfirmationNumber($query: String!) {
          orders(first: 1, query: $query) {
            nodes {
              id
              name
              confirmationNumber
            }
          }
        }
      `,
      {
        variables: {
          query: `confirmation_number:${confirmationNumber}`,
        },
      }
    );

    const orderLookupResult =
      await orderLookupResponse.json();

    console.log(
      "Order lookup result:",
      JSON.stringify(orderLookupResult)
    );

    const order =
      orderLookupResult?.data?.orders?.nodes?.[0];

    if (!order) {
      return cors(
        Response.json(
          {
            success: false,
            error: "Unable to locate this order",
          },
          {
            status: 404,
          }
        )
      );
    }

    console.log(
      "Found Shopify order:",
      order.id,
      order.name
    );

    /*
     * Convert submitted fields into order metafields.
     */
const metafields = Object.entries(fields).map(
  ([key, value]) => ({
    namespace: "custom",
    key,
    type: "single_line_text_field",
    value: String(value),
  })
);

    /*
     * Save the shipping information to the order.
     */
    const updateResponse = await admin.graphql(
      `#graphql
        mutation UpdateOrderShippingInfo($input: OrderInput!) {
          orderUpdate(input: $input) {
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
          input: {
            id: order.id,
            metafields,
          },
        },
      }
    );

    const updateResult =
      await updateResponse.json();

    console.log(
      "Order update result:",
      JSON.stringify(updateResult)
    );

    const errors =
      updateResult?.data?.orderUpdate?.userErrors || [];

    if (errors.length > 0) {
      return cors(
        Response.json(
          {
            success: false,
            errors,
          },
          {
            status: 400,
          }
        )
      );
    }

    console.log(
      "International shipping information saved:",
      order.id
    );

    return cors(
      Response.json({
        success: true,
        orderId: order.id,
      })
    );
  } catch (error) {
    console.error(
      "Shipping info submission failed:",
      error
    );

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to save shipping information",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};