/**
 * Domain entity for the key-value application configuration (Config table).
 * See SRS section 3.2.6 — Configs table stores JSON values keyed by name.
 */

export const CONFIG_KEYS = {
  ELECTRICITY_METER_PRICE: "ElectricityMeterPrice",
  INVOICE_EXPORT_INFO: "InforToExportInvoice",
} as const;

export interface ElectricityMeterPriceConfig {
  UnitPrice: number;
}

export interface InvoiceExportInfoConfig {
  ProjectOwner: string;
  BankAccountNumber: string;
  BankName: string;
  AccountHolderName: string;
  CustomerServicePhone: string;
  CashierName: string;
}
