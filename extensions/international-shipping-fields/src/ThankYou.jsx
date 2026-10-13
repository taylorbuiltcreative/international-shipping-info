import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {
  useEffect,
  useState,
} from 'preact/hooks';

export default function extension() {
  render(<Extension />, document.body);
}

const APP_URL =
  'https://international-shipping-info.onrender.com';

function getGap(spacing) {
  if (spacing === 'compact') {
    return 'small';
  }

  if (spacing === 'spacious') {
    return 'large';
  }

  return 'base';
}

function getPadding(spacing) {
  if (spacing === 'compact') {
    return 'small';
  }

  if (spacing === 'spacious') {
    return 'large';
  }

  return 'base';
}

function Extension() {
  const shippingAddress =
    shopify.shippingAddress?.value;

  const countryCode =
    shippingAddress?.countryCode;

  const orderConfirmation =
    shopify.orderConfirmation?.value;

  const confirmationNumber =
    orderConfirmation?.number;

  const [countryConfig, setCountryConfig] =
    useState(null);

  const [values, setValues] =
    useState({});

  const [status, setStatus] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isComplete, setIsComplete] =
    useState(false);

  useEffect(() => {
    loadPage();
  }, [countryCode, confirmationNumber]);

  async function loadPage() {
    if (
      !countryCode ||
      !confirmationNumber
    ) {
      setIsLoading(false);
      return;
    }

    try {
      const token =
        await shopify.sessionToken.get();

      /*
       * Load the configured countries/fields.
       */
      const configResponse = await fetch(
        `${APP_URL}/api/shipping-config`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const configData =
        await configResponse.json();

      if (
        !configResponse.ok ||
        !configData.success
      ) {
        console.error(
          'Unable to load configuration:',
          configData
        );

        return;
      }

      const match =
        configData.config.find(
          (country) =>
            country.enabled &&
            country.countryCode?.toUpperCase() ===
              countryCode?.toUpperCase()
        );

      /*
       * Nothing required for this country.
       */
      if (!match) {
        setCountryConfig(null);
        return;
      }

      setCountryConfig(match);

      /*
       * Check what has already been
       * saved to the order.
       */
      const stateResponse = await fetch(
        `${APP_URL}/api/shipping-state?confirmationNumber=${encodeURIComponent(
          confirmationNumber
        )}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const stateData =
        await stateResponse.json();

      if (
        !stateResponse.ok ||
        !stateData.success
      ) {
        console.error(
          'Unable to load existing values:',
          stateData
        );

        return;
      }

      const savedFields =
        stateData.fields || {};

      const initialValues = {};

      match.fields.forEach((field) => {
        initialValues[field.key] =
          savedFields[field.key] || '';
      });

      setValues(initialValues);

      /*
       * Check whether every required
       * field already has a value.
       */
      const requiredFields =
        match.fields.filter(
          (field) => field.required
        );

      const allRequiredComplete =
        requiredFields.length > 0 &&
        requiredFields.every(
          (field) =>
            savedFields[field.key] &&
            savedFields[field.key].trim() !== ''
        );

      setIsComplete(
        allRequiredComplete
      );
    } catch (error) {
      console.error(
        'Thank You page loading error:',
        error
      );
    } finally {
      setIsLoading(false);
    }
  }

  function updateValue(key, value) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit() {
    if (!countryConfig) {
      return;
    }

    /*
     * Required-field validation.
     */
    for (
      const field
      of countryConfig.fields
    ) {
      if (
        field.required &&
        !values[field.key]?.trim()
      ) {
        setStatus(
          `Please enter ${field.label}.`
        );

        return;
      }
    }

    if (!confirmationNumber) {
      setStatus(
        'Unable to identify this order.'
      );

      return;
    }

    setIsSubmitting(true);
    setStatus('');

    try {
      const token =
        await shopify.sessionToken.get();

      const fields = {};

      countryConfig.fields.forEach(
        (field) => {
          const value =
            values[field.key]?.trim();

          if (value) {
            fields[field.key] = value;
          }
        }
      );

      const response = await fetch(
        `${APP_URL}/api/shipping-info`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            confirmationNumber,
            fields,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        console.error(
          'Shipping info save failed:',
          data
        );

        setStatus(
          data?.error ||
            data?.errors?.[0]?.message ||
            'Unable to save your shipping information. Please try again.'
        );

        return;
      }

      /*
       * Immediately replace the form
       * with the success confirmation.
       */
      setIsComplete(true);
      setStatus('');
    } catch (error) {
      console.error(
        'Shipping info submission error:',
        error
      );

      setStatus(
        'Unable to save your shipping information. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return null;
  }

  if (!countryConfig) {
    return null;
  }

  /*
   * Required information already exists.
   */
  if (isComplete) {
    return (
      <s-banner
        heading={
          countryConfig.successHeading ||
          'Shipping Information Received'
        }
        tone="success"
      >
        <s-text>
          {countryConfig.successMessage ||
            `We have received the additional information required to process your shipment to ${countryConfig.countryName}.`}
        </s-text>
      </s-banner>
    );
  }

  /*
   * Main form content.
   */
  const formContent = (
    <s-stack
      gap={getGap(
        countryConfig.spacing
      )}
    >
      <s-heading>
        {countryConfig.blockHeading ||
          'Action Required: Additional Shipping Information'}
      </s-heading>

      <s-text>
        {countryConfig.blockMessage ||
          `Your order cannot be processed for shipment to ${countryConfig.countryName} until the information below is submitted.`}
      </s-text>

      {countryConfig.showDivider !==
      false ? (
        <s-divider />
      ) : null}

      {countryConfig.fields.map(
        (field) => (
          <s-stack
            key={field.key}
            gap="small"
          >
            <s-text-field
              label={field.label}
              placeholder={
                field.placeholder ||
                ''
              }
              value={
                values[field.key] ||
                ''
              }
              required={
                field.required
              }
              onInput={(event) =>
                updateValue(
                  field.key,
                  event.currentTarget
                    .value
                )
              }
            />

            {field.helpText ? (
              <s-text>
                {field.helpText}
              </s-text>
            ) : null}
          </s-stack>
        )
      )}

      <s-button
        variant={
          countryConfig.buttonStyle ===
          'secondary'
            ? 'secondary'
            : 'primary'
        }
        loading={isSubmitting}
        onClick={handleSubmit}
      >
        {countryConfig.buttonLabel ||
          'Submit Required Information'}
      </s-button>

      {status ? (
        <s-text>
          {status}
        </s-text>
      ) : null}
    </s-stack>
  );

  /*
   * Plain display style.
   */
  if (
    countryConfig.displayStyle ===
    'plain'
  ) {
    return formContent;
  }

  /*
   * Card display style.
   */
  if (
    countryConfig.displayStyle ===
    'card'
  ) {
    return (
      <s-box
        padding={getPadding(
          countryConfig.spacing
        )}
        background="subdued"
        border="base"
        borderRadius="base"
      >
        {formContent}
      </s-box>
    );
  }

  /*
   * Banner display style.
   * This is the default.
   */
  return (
    <s-banner
      tone={
        countryConfig.bannerTone ||
        'warning'
      }
    >
      {formContent}
    </s-banner>
  );
}