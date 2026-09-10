import { configRepository } from "@/repositories/config.repository";
import {
  CONFIG_KEYS,
  type ElectricityMeterPriceConfig,
  type InvoiceExportInfoConfig,
} from "@/domain/entities/config.entity";
import type { ElectricityMeterPriceDto, InvoiceExportInfoDto } from "@/validations/config.schema";

const DEFAULT_PRICE: ElectricityMeterPriceConfig = { UnitPrice: 0 };
const DEFAULT_INVOICE_INFO: InvoiceExportInfoConfig = {
  ProjectOwner: "",
  BankAccountNumber: "",
  BankName: "",
  AccountHolderName: "",
  CustomerServicePhone: "",
  CashierName: "",
};

export class ConfigService {
  async getPrice(): Promise<ElectricityMeterPriceConfig> {
    const value = await configRepository.getValue<ElectricityMeterPriceConfig>(
      CONFIG_KEYS.ELECTRICITY_METER_PRICE,
    );
    return value ?? DEFAULT_PRICE;
  }

  async setPrice(input: ElectricityMeterPriceDto): Promise<void> {
    await configRepository.setValue(CONFIG_KEYS.ELECTRICITY_METER_PRICE, input);
  }

  async getInvoiceExportInfo(): Promise<InvoiceExportInfoConfig> {
    const value = await configRepository.getValue<InvoiceExportInfoConfig>(
      CONFIG_KEYS.INVOICE_EXPORT_INFO,
    );
    return value ?? DEFAULT_INVOICE_INFO;
  }

  async setInvoiceExportInfo(input: InvoiceExportInfoDto): Promise<void> {
    await configRepository.setValue(CONFIG_KEYS.INVOICE_EXPORT_INFO, input);
  }
}

export const configService = new ConfigService();
