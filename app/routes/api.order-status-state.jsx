import {
  authenticate,
  unauthenticated,
} from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    const { cors, sessionToken } =
      await authenticate.public.customerAccount(request);

    const shop = sessionToken.dest;

    const { admin } =
      await unauthenticated.admin(shop);

    const url = new URL(request.url);

    const confirmationNumber =
      url.searchParams.get("confirmationNumber");

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

    const response = await admin.graphql(
      `#graphql
        query FindOrderShippingInfo($query: String!) {
          orders(first: 1, query: $query) {
            nodes {
              id
              name

              metafields(
                first: 100
                namespace: "custom"
              ) {
                nodes {
                  key
                  value
                }
              }
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

    const result = await response.json();

    const order =
      result?.data?.orders?.nodes?.[0];

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

    const fields = {};

    order.metafields.nodes.forEach(
      (metafield) => {
        fields[metafield.key] =
          metafield.value;
      }
    );

    return cors(
      Response.json({
        success: true,
        fields,
      })
    );
  } catch (error) {
    console.error(
      "Unable to load order shipping state:",
      error
    );

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load shipping information",
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