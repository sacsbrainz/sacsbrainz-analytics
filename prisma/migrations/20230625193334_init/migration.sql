-- CreateTable
CREATE TABLE `Analytic` (
    `id` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NULL,
    `countryIsoCode` VARCHAR(191) NULL,
    `continent` VARCHAR(191) NULL,
    `continentCode` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `referrer` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NULL,
    `screenWidth` DOUBLE NULL,
    `browser` VARCHAR(191) NULL,
    `os` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnalyticPage` (
    `id` VARCHAR(191) NOT NULL,
    `page` VARCHAR(191) NOT NULL,
    `rank` INTEGER NOT NULL,
    `timeSpent` DOUBLE NOT NULL,
    `analyticId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `analyticId`(`analyticId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AnalyticPage` ADD CONSTRAINT `AnalyticPage_analyticId_fkey` FOREIGN KEY (`analyticId`) REFERENCES `Analytic`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
