export interface PlanInterval {
  amount: number;
  tax: "inclusive" | "exclusive";
  psp_override?: {
    amount: number;
    tax: "inclusive" | "exclusive";
  };
}

export interface PlanConfig {
  month?: PlanInterval;
  year?: PlanInterval;
}

export interface VatDisplay {
  inclusive_tax_display: string;
  exclusive_tax_display: string;
  show_reverse_charge_disclaimer: boolean;
}

export interface CurrencyConfig {
  free?: PlanConfig;
  go?: PlanConfig;
  plus?: PlanConfig;
  pro?: PlanConfig;
  prolite?: PlanConfig;
  business?: PlanConfig;
  business_non_profit?: PlanConfig;
  free_workspace?: PlanConfig;
  amount_per_credit: number;
  vat_display: VatDisplay;
  tax_type: string;
  symbol_code: string;
  symbol: string;
  tax_percent: number;
  minor_unit_exponent: number;
  pricing_rollout_gate: string;
  promos: Record<string, unknown>;
}

export interface CountryConfig {
  country_code: string;
  currency_config: CurrencyConfig;
}

export interface CountriesResponse {
  countries: string[];
}

export type PlanKey =
  | "free"
  | "go"
  | "plus"
  | "prolite"
  | "pro"
  | "business"
  | "business_non_profit";

export type BillingInterval = "month" | "year";
