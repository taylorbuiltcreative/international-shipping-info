import { useState } from "react";

import {
  Form,
  useLoaderData,
  useNavigation,
} from "react-router";

import { authenticate } from "../shopify.server";
import db from "../db.server";

const COUNTRIES = [
  ["AR", "Argentina"],
  ["AU", "Australia"],
  ["AT", "Austria"],
  ["BE", "Belgium"],
  ["BR", "Brazil"],
  ["BG", "Bulgaria"],
  ["CA", "Canada"],
  ["CL", "Chile"],
  ["CN", "China"],
  ["CO", "Colombia"],
  ["CR", "Costa Rica"],
  ["HR", "Croatia"],
  ["CY", "Cyprus"],
  ["CZ", "Czech Republic"],
  ["DK", "Denmark"],
  ["DO", "Dominican Republic"],
  ["EC", "Ecuador"],
  ["EE", "Estonia"],
  ["FI", "Finland"],
  ["FR", "France"],
  ["DE", "Germany"],
  ["GR", "Greece"],
  ["GT", "Guatemala"],
  ["HK", "Hong Kong"],
  ["HU", "Hungary"],
  ["IS", "Iceland"],
  ["IN", "India"],
  ["ID", "Indonesia"],
  ["IE", "Ireland"],
  ["IL", "Israel"],
  ["IT", "Italy"],
  ["JP", "Japan"],
  ["KR", "South Korea"],
  ["LV", "Latvia"],
  ["LT", "Lithuania"],
  ["LU", "Luxembourg"],
  ["MY", "Malaysia"],
  ["MX", "Mexico"],
  ["NL", "Netherlands"],
  ["NZ", "New Zealand"],
  ["NO", "Norway"],
  ["PA", "Panama"],
  ["PE", "Peru"],
  ["PH", "Philippines"],
  ["PL", "Poland"],
  ["PT", "Portugal"],
  ["PR", "Puerto Rico"],
  ["RO", "Romania"],
  ["SA", "Saudi Arabia"],
  ["SG", "Singapore"],
  ["SK", "Slovakia"],
  ["SI", "Slovenia"],
  ["ZA", "South Africa"],
  ["ES", "Spain"],
  ["SE", "Sweden"],
  ["CH", "Switzerland"],
  ["TW", "Taiwan"],
  ["TH", "Thailand"],
  ["TR", "Türkiye"],
  ["AE", "United Arab Emirates"],
  ["GB", "United Kingdom"],
  ["US", "United States"],
  ["UY", "Uruguay"],
  ["VN", "Vietnam"],
];

export const loader = async ({ request }) => {
  const { session } =
    await authenticate.admin(request);

  const existing =
    await db.shippingConfig.findUnique({
      where: {
        shop: session.shop,
      },
    });

  let config = [];

  if (existing?.config) {
    try {
      config =
        JSON.parse(existing.config);
    } catch {
      config = [];
    }
  }

  return {
    config,
  };
};

export const action = async ({ request }) => {
  const { session } =
    await authenticate.admin(request);

  const formData =
    await request.formData();

  const rawConfig =
    formData.get("config");

  let parsedConfig = [];

  try {
    parsedConfig =
      JSON.parse(rawConfig || "[]");
  } catch {
    return {
      success: false,
      error:
        "Invalid configuration data.",
    };
  }

  await db.shippingConfig.upsert({
    where: {
      shop: session.shop,
    },

    update: {
      config:
        JSON.stringify(parsedConfig),
    },

    create: {
      shop: session.shop,
      config:
        JSON.stringify(parsedConfig),
    },
  });

  return {
    success: true,
  };
};

export default function Index() {
  const {
    config: initialConfig,
  } = useLoaderData();

  const navigation =
    useNavigation();

  const [config, setConfig] =
    useState(
      initialConfig.length > 0
        ? initialConfig
        : [
            {
              countryCode: "MX",
              countryName: "Mexico",
              enabled: true,

              blockHeading:
                "Action Required: Additional Shipping Information",

              blockMessage:
                "Your order cannot be processed for shipment until the information below is submitted.",

              bannerTone: "warning",

              displayStyle: "banner",

              headingSize: "medium",

              spacing: "standard",

              showDivider: true,

              buttonStyle: "primary",

              buttonLabel:
                "Submit Required Information",

              successHeading:
                "Shipping information received",

              successMessage:
                "We have received the additional information required to process your shipment to Mexico.",

              fields: [
                {
                  key: "curp",
                  label: "CURP",
                  placeholder:
                    "Enter your CURP",
                  helpText:
                    "Required to process shipments to Mexico.",
                  required: true,
                },
              ],
            },
          ]
    );

  const isSaving =
    navigation.state ===
    "submitting";

  function updateCountry(
    index,
    field,
    value
  ) {
    setConfig((current) =>
      current.map(
        (country, i) =>
          i === index
            ? {
                ...country,
                [field]: value,
              }
            : country
      )
    );
  }

  function selectCountry(
    index,
    countryCode
  ) {
    const match =
      COUNTRIES.find(
        ([code]) =>
          code === countryCode
      );

    setConfig((current) =>
      current.map(
        (country, i) =>
          i === index
            ? {
                ...country,
                countryCode:
                  match?.[0] || "",
                countryName:
                  match?.[1] || "",
              }
            : country
      )
    );
  }

  function updateField(
    countryIndex,
    fieldIndex,
    field,
    value
  ) {
    setConfig((current) =>
      current.map(
        (country, i) => {
          if (
            i !== countryIndex
          ) {
            return country;
          }

          return {
            ...country,

            fields:
              country.fields.map(
                (item, j) =>
                  j === fieldIndex
                    ? {
                        ...item,
                        [field]:
                          value,
                      }
                    : item
              ),
          };
        }
      )
    );
  }

  function addCountry() {
    setConfig((current) => [
      ...current,

      {
        countryCode: "",
        countryName: "",
        enabled: true,

        blockHeading:
          "Action Required: Additional Shipping Information",

        blockMessage:
          "Your order cannot be processed for shipment until the information below is submitted.",

        bannerTone: "warning",

        displayStyle: "banner",

        headingSize: "medium",

        spacing: "standard",

        showDivider: true,

        buttonStyle: "primary",

        buttonLabel:
          "Submit Required Information",

        successHeading:
          "Shipping information received",

        successMessage:
          "We have received the additional information required to process your shipment.",

        fields: [],
      },
    ]);
  }

  function removeCountry(index) {
    setConfig((current) =>
      current.filter(
        (_, i) => i !== index
      )
    );
  }

  function addField(
    countryIndex
  ) {
    setConfig((current) =>
      current.map(
        (country, i) => {
          if (
            i !== countryIndex
          ) {
            return country;
          }

          return {
            ...country,

            fields: [
              ...country.fields,

              {
                key: "",
                label: "",
                placeholder: "",
                helpText: "",
                required: true,
              },
            ],
          };
        }
      )
    );
  }

  function removeField(
    countryIndex,
    fieldIndex
  ) {
    setConfig((current) =>
      current.map(
        (country, i) => {
          if (
            i !== countryIndex
          ) {
            return country;
          }

          return {
            ...country,

            fields:
              country.fields.filter(
                (_, j) =>
                  j !== fieldIndex
              ),
          };
        }
      )
    );
  }

  return (
    <s-page
      heading="International Shipping Information"
    >
      <s-stack gap="large">

        <s-paragraph>
          Configure which countries
          require additional shipping
          information after checkout.
        </s-paragraph>

        {config.map(
          (
            country,
            countryIndex
          ) => (
            <s-section
              key={countryIndex}
              heading={
                country.countryName ||
                `Country ${
                  countryIndex + 1
                }`
              }
            >
              <s-stack gap="base">

                <s-select
                  label="Country"
                  value={
                    country.countryCode
                  }
                  onChange={(event) =>
                    selectCountry(
                      countryIndex,
                      event
                        .currentTarget
                        .value
                    )
                  }
                >
                  <s-option value="">
                    Select a country
                  </s-option>

                  {COUNTRIES.map(
                    ([
                      code,
                      name,
                    ]) => (
                      <s-option
                        key={code}
                        value={code}
                      >
                        {name}
                      </s-option>
                    )
                  )}
                </s-select>

                {country.countryCode ? (
                  <s-text>
                    Shopify country code:{" "}
                    {
                      country.countryCode
                    }
                  </s-text>
                ) : null}

                <s-checkbox
                  label="Enabled"
                  checked={
                    country.enabled
                  }
                  onChange={(event) =>
                    updateCountry(
                      countryIndex,
                      "enabled",
                      event
                        .currentTarget
                        .checked
                    )
                  }
                />

                <s-section heading="Block appearance">
                  <s-stack gap="base">

                    <s-text-field
                      label="Block heading"
                      value={
                        country.blockHeading ||
                        ""
                      }
                      onInput={(event) =>
                        updateCountry(
                          countryIndex,
                          "blockHeading",
                          event.currentTarget.value
                        )
                      }
                    />

                    <s-text-area
                      label="Block message"
                      value={
                        country.blockMessage ||
                        ""
                      }
                      onInput={(event) =>
                        updateCountry(
                          countryIndex,
                          "blockMessage",
                          event.currentTarget.value
                        )
                      }
                    />

                    <s-select
                      label="Display style"
                      value={
                        country.displayStyle ||
                        "banner"
                      }
                      onChange={(event) =>
                        updateCountry(
                          countryIndex,
                          "displayStyle",
                          event.currentTarget.value
                        )
                      }
                    >
                      <s-option value="banner">
                        Banner
                      </s-option>

                      <s-option value="card">
                        Card
                      </s-option>

                      <s-option value="plain">
                        Plain
                      </s-option>
                    </s-select>

                    <s-select
                      label="Banner tone"
                      value={
                        country.bannerTone ||
                        "warning"
                      }
                      onChange={(event) =>
                        updateCountry(
                          countryIndex,
                          "bannerTone",
                          event.currentTarget.value
                        )
                      }
                    >
                      <s-option value="info">
                        Information
                      </s-option>

                      <s-option value="warning">
                        Warning
                      </s-option>

                      <s-option value="critical">
                        Critical
                      </s-option>

                      <s-option value="success">
                        Success
                      </s-option>
                    </s-select>

                    <s-select
                      label="Heading size"
                      value={
                        country.headingSize ||
                        "medium"
                      }
                      onChange={(event) =>
                        updateCountry(
                          countryIndex,
                          "headingSize",
                          event.currentTarget.value
                        )
                      }
                    >
                      <s-option value="small">
                        Small
                      </s-option>

                      <s-option value="medium">
                        Medium
                      </s-option>

                      <s-option value="large">
                        Large
                      </s-option>
                    </s-select>

                    <s-select
                      label="Spacing"
                      value={
                        country.spacing ||
                        "standard"
                      }
                      onChange={(event) =>
                        updateCountry(
                          countryIndex,
                          "spacing",
                          event.currentTarget.value
                        )
                      }
                    >
                      <s-option value="compact">
                        Compact
                      </s-option>

                      <s-option value="standard">
                        Standard
                      </s-option>

                      <s-option value="spacious">
                        Spacious
                      </s-option>
                    </s-select>

                    <s-checkbox
                      label="Show divider"
                      checked={
                        country.showDivider !== false
                      }
                      onChange={(event) =>
                        updateCountry(
                          countryIndex,
                          "showDivider",
                          event
                            .currentTarget
                            .checked
                        )
                      }
                    />

                    <s-select
                      label="Button style"
                      value={
                        country.buttonStyle ||
                        "primary"
                      }
                      onChange={(event) =>
                        updateCountry(
                          countryIndex,
                          "buttonStyle",
                          event.currentTarget.value
                        )
                      }
                    >
                      <s-option value="primary">
                        Primary
                      </s-option>

                      <s-option value="secondary">
                        Secondary
                      </s-option>
                    </s-select>

                    <s-text-field
                      label="Button label"
                      value={
                        country.buttonLabel ||
                        ""
                      }
                      onInput={(event) =>
                        updateCountry(
                          countryIndex,
                          "buttonLabel",
                          event.currentTarget.value
                        )
                      }
                    />

                    <s-text-field
                      label="Success heading"
                      value={
                        country.successHeading ||
                        ""
                      }
                      onInput={(event) =>
                        updateCountry(
                          countryIndex,
                          "successHeading",
                          event.currentTarget.value
                        )
                      }
                    />

                    <s-text-area
                      label="Success message"
                      value={
                        country.successMessage ||
                        ""
                      }
                      onInput={(event) =>
                        updateCountry(
                          countryIndex,
                          "successMessage",
                          event.currentTarget.value
                        )
                      }
                    />

                  </s-stack>
                </s-section>

                {country.fields.map(
                  (
                    field,
                    fieldIndex
                  ) => (
                    <s-section
                      key={fieldIndex}
                      heading={
                        field.label ||
                        `Field ${
                          fieldIndex + 1
                        }`
                      }
                    >
                      <s-stack gap="base">

                        <s-text-field
                          label="Field label"
                          value={
                            field.label
                          }
                          onInput={(event) =>
                            updateField(
                              countryIndex,
                              fieldIndex,
                              "label",
                              event
                                .currentTarget
                                .value
                            )
                          }
                        />

                        <s-text-field
                          label="Metafield key"
                          value={
                            field.key
                          }
                          onInput={(event) =>
                            updateField(
                              countryIndex,
                              fieldIndex,
                              "key",
                              event
                                .currentTarget
                                .value
                                .toLowerCase()
                                .replace(
                                  /[^a-z0-9_]/g,
                                  "_"
                                )
                            )
                          }
                          details="Saved to the Shopify order as custom.KEY."
                        />

                        <s-text-field
                          label="Placeholder"
                          value={
                            field.placeholder
                          }
                          onInput={(event) =>
                            updateField(
                              countryIndex,
                              fieldIndex,
                              "placeholder",
                              event
                                .currentTarget
                                .value
                            )
                          }
                        />

                        <s-text-area
                          label="Help text"
                          value={
                            field.helpText
                          }
                          onInput={(event) =>
                            updateField(
                              countryIndex,
                              fieldIndex,
                              "helpText",
                              event
                                .currentTarget
                                .value
                            )
                          }
                        />

                        <s-checkbox
                          label="Required"
                          checked={
                            field.required
                          }
                          onChange={(event) =>
                            updateField(
                              countryIndex,
                              fieldIndex,
                              "required",
                              event
                                .currentTarget
                                .checked
                            )
                          }
                        />

                        <s-button
                          variant="secondary"
                          tone="critical"
                          onClick={() =>
                            removeField(
                              countryIndex,
                              fieldIndex
                            )
                          }
                        >
                          Remove field
                        </s-button>

                      </s-stack>
                    </s-section>
                  )
                )}

                <s-button
                  variant="secondary"
                  onClick={() =>
                    addField(
                      countryIndex
                    )
                  }
                >
                  Add field
                </s-button>

                <s-button
                  variant="secondary"
                  tone="critical"
                  onClick={() =>
                    removeCountry(
                      countryIndex
                    )
                  }
                >
                  Remove country
                </s-button>

              </s-stack>
            </s-section>
          )
        )}

        <s-button
          variant="secondary"
          onClick={
            addCountry
          }
        >
          Add country
        </s-button>

        <Form method="post">
          <input
            type="hidden"
            name="config"
            value={JSON.stringify(
              config
            )}
          />

          <s-button
            type="submit"
            variant="primary"
            loading={
              isSaving
            }
          >
            Save settings
          </s-button>
        </Form>

      </s-stack>
    </s-page>
  );
}