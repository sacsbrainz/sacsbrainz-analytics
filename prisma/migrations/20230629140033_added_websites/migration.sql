-- AlterTable
ALTER TABLE `Analytic` ADD COLUMN `websitesId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Websites` (
    `id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Analytic` ADD CONSTRAINT `Analytic_websitesId_fkey` FOREIGN KEY (`websitesId`) REFERENCES `Websites`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
