import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }) => {
  // Handle CORS preflight before Shopify authentication
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "7200",
      },
    });
  }

  try {
    const { cors, sessionToken } =
      await authenticate.public.customerAccount(request);

    const shop = sessionToken.dest;

    const existing = await db.shippingConfig.findUnique({
      where: {
        shop,
      },
    });

    let config = [];

    if (existing?.config) {
      try {
        config = JSON.parse(existing.config);
      } catch {
        config = [];
      }
    }

    return cors(
      Response.json({
        success: true,
        config,
      })
    );
  } catch (error) {
    console.error("Unable to load order-status config:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: "Unable to load shipping configuration",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Authorization, Content-Type",
        },
      }
    );
  }
};