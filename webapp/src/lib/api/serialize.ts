import type { CustomerEntity, MeterEntity } from "@/domain/entities/customer.entity";
import type { InvoiceEntity, InvoiceDetailEntity } from "@/domain/entities/invoice.entity";

/** `bigint` (StartNum/EndNum) không thể JSON.stringify trực tiếp — chuyển sang number khi trả API. */
export function serializeMeter(meter: MeterEntity) {
  return {
    ...meter,
    startNum: Number(meter.startNum),
    endNum: Number(meter.endNum),
  };
}

export function serializeCustomer(customer: CustomerEntity) {
  return {
    ...customer,
    meters: customer.meters?.map(serializeMeter),
  };
}

export function serializeInvoiceDetail(detail: InvoiceDetailEntity) {
  return {
    ...detail,
    startNum: Number(detail.startNum),
    endNum: Number(detail.endNum),
  };
}

export function serializeInvoice(invoice: InvoiceEntity) {
  return {
    ...invoice,
    details: invoice.details?.map(serializeInvoiceDetail),
  };
}

