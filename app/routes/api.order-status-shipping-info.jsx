import {
  authenticate,
  unauthenticated,
} from "../shopify.server";

export const loader = async ({ request }) => {
  const { cors } =
    await authenticate.public.customerAccount(request);

  return cors(
    new Response(null, {
      status: 204,
    })
  );
};

export const action = async ({ request }) => {
  try {
    const { cors, sessionToken } =
      await authenticate.public.customerAccount(request);

    const shop = sessionToken.dest;

    const { admin } =
      await unauthenticated.admin(shop);

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

    const lookupResponse = await admin.graphql(
      `#graphql
        query FindOrder($query: String!) {
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

    const lookupResult =
      await lookupResponse.json();

    const order =
      lookupResult?.data?.orders?.nodes?.[0];

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

    const metafields = Object.entries(fields).map(
      ([key, value]) => ({
        namespace: "custom",
        key,
        type: "single_line_text_field",
        value: String(value),
      })
    );

    const updateResponse = await admin.graphql(
      `#graphql
        mutation UpdateOrderShippingInfo(
          $input: OrderInput!
        ) {
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

    return cors(
      Response.json({
        success: true,
      })
    );
  } catch (error) {
    console.error(
      "Order-status shipping info submission failed:",
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