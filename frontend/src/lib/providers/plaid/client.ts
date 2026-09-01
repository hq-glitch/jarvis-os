import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid";

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

const plaidEnvironment =
  process.env.PLAID_ENV === "production"
    ? PlaidEnvironments.production
    : process.env.PLAID_ENV === "development"
      ? PlaidEnvironments.development
      : PlaidEnvironments.sandbox;

const configuration = new Configuration({
  basePath: plaidEnvironment,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": requireEnvironmentVariable(
        "PLAID_CLIENT_ID",
      ),
      "PLAID-SECRET": requireEnvironmentVariable(
        "PLAID_SECRET",
      ),
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

export const plaidProducts: Products[] = [
  Products.Transactions,
  Products.Liabilities,
];

export const plaidCountryCodes: CountryCode[] = [
  CountryCode.Us,
];
