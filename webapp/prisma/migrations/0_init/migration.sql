-- CreateTable
CREATE TABLE `__customers__efmigrationshistory` (
    `MigrationId` VARCHAR(150) NOT NULL,
    `ProductVersion` VARCHAR(32) NOT NULL,

    PRIMARY KEY (`MigrationId` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `__products__efmigrationshistory` (
    `MigrationId` VARCHAR(150) NOT NULL,
    `ProductVersion` VARCHAR(32) NOT NULL,

    PRIMARY KEY (`MigrationId` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configs` (
    `Id` CHAR(36) NOT NULL,
    `Key` VARCHAR(255) NOT NULL,
    `Value` LONGTEXT NOT NULL,
    `CreatedAt` DATETIME(6) NULL,
    `CreatedBy` CHAR(36) NOT NULL,
    `LastModified` DATETIME(6) NULL,
    `LastModifiedBy` CHAR(36) NOT NULL,

    UNIQUE INDEX `IX_Configs_Key`(`Key` ASC),
    PRIMARY KEY (`Id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customers` (
    `Id` CHAR(36) NOT NULL,
    `Name` LONGTEXT NOT NULL,
    `Description` LONGTEXT NULL,
    `Phone` LONGTEXT NOT NULL,
    `CreatedAt` DATETIME(6) NULL,
    `CreatedBy` CHAR(36) NOT NULL,
    `LastModified` DATETIME(6) NULL,
    `LastModifiedBy` CHAR(36) NOT NULL,
    `IsDeleted` BOOLEAN NOT NULL DEFAULT false,
    `IsHasZalo` BOOLEAN NOT NULL DEFAULT false,
    `Code` INTEGER NOT NULL AUTO_INCREMENT,

    UNIQUE INDEX `IX_Customers_Code`(`Code` ASC),
    INDEX `IX_Customers_IsDeleted`(`IsDeleted` ASC),
    PRIMARY KEY (`Id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `electricitymeters` (
    `Id` CHAR(36) NOT NULL,
    `Name` LONGTEXT NOT NULL,
    `TransformerStationId` CHAR(36) NOT NULL,
    `CustomerId` CHAR(36) NOT NULL,
    `StartNum` BIGINT NOT NULL,
    `EndNum` BIGINT NOT NULL,
    `IsDeleted` BOOLEAN NOT NULL,
    `CreatedAt` DATETIME(6) NULL,
    `CreatedBy` CHAR(36) NOT NULL,
    `LastModified` DATETIME(6) NULL,
    `LastModifiedBy` CHAR(36) NOT NULL,
    `Description` LONGTEXT NULL,
    `Code` INTEGER NOT NULL AUTO_INCREMENT,

    UNIQUE INDEX `IX_ElectricityMeters_Code`(`Code` ASC),
    INDEX `IX_ElectricityMeters_IsDeleted`(`IsDeleted` ASC),
    PRIMARY KEY (`Id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoicedetails` (
    `Id` CHAR(36) NOT NULL,
    `ElectricityMeterId` LONGTEXT NOT NULL,
    `UnitPrice` DOUBLE NOT NULL,
    `CreatedAt` DATETIME(6) NULL,
    `CreatedBy` CHAR(36) NOT NULL,
    `LastModified` DATETIME(6) NULL,
    `LastModifiedBy` CHAR(36) NOT NULL,
    `InvoiceId` LONGTEXT NOT NULL,
    `EndNum` BIGINT NOT NULL DEFAULT 0,
    `StartNum` BIGINT NOT NULL DEFAULT 0,

    PRIMARY KEY (`Id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `Id` CHAR(36) NOT NULL,
    `Month` LONGTEXT NOT NULL,
    `CustomerId` LONGTEXT NOT NULL,
    `TotalAmountPaid` DOUBLE NOT NULL,
    `Status` INTEGER NOT NULL,
    `Code` INTEGER NOT NULL AUTO_INCREMENT,
    `Note` LONGTEXT NULL,
    `CreatedAt` DATETIME(6) NULL,
    `CreatedBy` CHAR(36) NOT NULL,
    `LastModified` DATETIME(6) NULL,
    `LastModifiedBy` CHAR(36) NOT NULL,

    UNIQUE INDEX `IX_Invoices_Code`(`Code` ASC),
    PRIMARY KEY (`Id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `templates` (
    `Id` CHAR(36) NOT NULL,
    `Key` VARCHAR(255) NOT NULL,
    `Value` LONGTEXT NOT NULL,
    `CreatedAt` DATETIME(6) NULL,
    `CreatedBy` CHAR(36) NOT NULL,
    `LastModified` DATETIME(6) NULL,
    `LastModifiedBy` CHAR(36) NOT NULL,

    UNIQUE INDEX `IX_Templates_Key`(`Key` ASC),
    PRIMARY KEY (`Id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transformerstations` (
    `Id` CHAR(36) NOT NULL,
    `Name` LONGTEXT NOT NULL,
    `IsDeleted` BOOLEAN NOT NULL,
    `CreatedAt` DATETIME(6) NULL,
    `CreatedBy` CHAR(36) NOT NULL,
    `LastModified` DATETIME(6) NULL,
    `LastModifiedBy` CHAR(36) NOT NULL,
    `Description` LONGTEXT NULL,
    `Code` INTEGER NOT NULL AUTO_INCREMENT,

    UNIQUE INDEX `IX_TransformerStations_Code`(`Code` ASC),
    INDEX `IX_TransformerStations_IsDeleted`(`IsDeleted` ASC),
    PRIMARY KEY (`Id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

