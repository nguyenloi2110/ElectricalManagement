-- AlterTable
ALTER TABLE `configs` MODIFY `CreatedBy` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    MODIFY `LastModifiedBy` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- AlterTable
ALTER TABLE `customers` MODIFY `CreatedBy` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    MODIFY `LastModifiedBy` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- AlterTable
ALTER TABLE `electricitymeters` MODIFY `IsDeleted` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `CreatedBy` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    MODIFY `LastModifiedBy` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- AlterTable
ALTER TABLE `invoicedetails` ADD COLUMN `IsDeleted` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `ElectricityMeterId` CHAR(36) NOT NULL,
    MODIFY `CreatedBy` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    MODIFY `LastModifiedBy` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    MODIFY `InvoiceId` CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `IsDeleted` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `Month` VARCHAR(7) NOT NULL,
    MODIFY `CustomerId` CHAR(36) NOT NULL,
    MODIFY `TotalAmountPaid` DOUBLE NOT NULL DEFAULT 0,
    MODIFY `Status` INTEGER NOT NULL DEFAULT 0,
    MODIFY `CreatedBy` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    MODIFY `LastModifiedBy` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- AlterTable
ALTER TABLE `templates` MODIFY `CreatedBy` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    MODIFY `LastModifiedBy` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- AlterTable
ALTER TABLE `transformerstations` MODIFY `IsDeleted` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `CreatedBy` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    MODIFY `LastModifiedBy` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `phoneNumber` VARCHAR(20) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `IX_Users_PhoneNumber`(`phoneNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `IX_ElectricityMeters_CustomerId` ON `electricitymeters`(`CustomerId`);

-- CreateIndex
CREATE INDEX `IX_ElectricityMeters_TransformerStationId` ON `electricitymeters`(`TransformerStationId`);

-- CreateIndex
CREATE INDEX `IX_InvoiceDetails_InvoiceId` ON `invoicedetails`(`InvoiceId`);

-- CreateIndex
CREATE INDEX `IX_InvoiceDetails_ElectricityMeterId` ON `invoicedetails`(`ElectricityMeterId`);

-- CreateIndex
CREATE INDEX `IX_InvoiceDetails_IsDeleted` ON `invoicedetails`(`IsDeleted`);

-- CreateIndex
CREATE INDEX `IX_Invoices_CustomerId` ON `invoices`(`CustomerId`);

-- CreateIndex
CREATE INDEX `IX_Invoices_Month` ON `invoices`(`Month`);

-- CreateIndex
CREATE INDEX `IX_Invoices_Status` ON `invoices`(`Status`);

-- CreateIndex
CREATE INDEX `IX_Invoices_IsDeleted` ON `invoices`(`IsDeleted`);
