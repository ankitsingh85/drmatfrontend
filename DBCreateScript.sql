CREATE DATABASE `drapp`;

USE `drapp`;

CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) NULL,
  `name` VARCHAR(100) NULL,
  `password` MEDIUMTEXT NULL,
  `admin` TINYINT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC) VISIBLE);

SELECT * FROM `users`;

CREATE TABLE `services` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NULL,
  `price` INT NULL,
  `description` LONGTEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC) VISIBLE);
  
  SELECT * FROM `services`;
  
  
  CREATE TABLE `categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NULL,
  `description` LONGTEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC) VISIBLE);

SELECT * FROM `categories`;

CREATE TABLE `products` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NULL,
  `price` INT NULL,
  `description` LONGTEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC) VISIBLE);
  
  SELECT * FROM `products`;
  
CREATE TABLE `vendors` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NULL,
  `address` LONGTEXT NULL,
  `head` VARCHAR(50) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC) VISIBLE);
  
  SELECT * FROM `vendors`;
  
  
CREATE TABLE `paymentplans` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `months` VARCHAR(100) NULL,
  `installment` INT NULL,
  `total` LONGTEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC) VISIBLE);
  
  SELECT * FROM `paymentplans`;

CREATE TABLE `clinics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `description` varchar(300) DEFAULT NULL,
  `address` varchar(300) DEFAULT NULL,
  `latitude` varchar(45) DEFAULT NULL,
  `longitude` varchar(45) DEFAULT NULL,
  `rating` decimal(10,0) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ;



CREATE TABLE `doctors` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NULL,
  `specialities` VARCHAR(100) NULL,
  `qualifications` VARCHAR(100) NULL,
  `experience` INT NULL,
  `ratings` DECIMAL NULL,
  PRIMARY KEY (`id`));


  CREATE TABLE `doctor_reviews` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `rating` INT NULL,
  `review` VARCHAR(300) NULL,
  `doctor_id` INT NULL,
  PRIMARY KEY (`id`),
  INDEX `doctor_review_idx` (`doctor_id` ASC) VISIBLE,
  CONSTRAINT `doctor_review`
    FOREIGN KEY (`doctor_id`)
    REFERENCES `doctors` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION);



    CREATE TABLE `clinic_review` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `rating` INT NULL,
  `review` VARCHAR(300) NULL,
  `clinic_id` INT NULL,
  PRIMARY KEY (`id`),
  INDEX `clinic_review_idx` (`clinic_id` ASC) VISIBLE,
  CONSTRAINT `clinic_review`
    FOREIGN KEY (`clinic_id`)
    REFERENCES `clinics` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION);




CREATE TABLE `cart` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `userid` INT NULL,
  PRIMARY KEY (`id`),
  INDEX `user_cart_idx` (`userid` ASC) VISIBLE,
  CONSTRAINT `user_cart`
    FOREIGN KEY (`userid`)
    REFERENCES `drapp`.`users` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION);



CREATE TABLE `cartitemservice` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cartid` int DEFAULT NULL,
  `serviceid` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `item_service_idx` (`serviceid`),
  KEY `item_cart_idx` (`cartid`),
  CONSTRAINT `item_cart` FOREIGN KEY (`cartid`) REFERENCES `cart` (`id`) ON DELETE CASCADE,
  CONSTRAINT `item_service` FOREIGN KEY (`serviceid`) REFERENCES `services` (`id`)
) ;

CREATE TABLE `cartitemproduct` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cartid` int DEFAULT NULL,
  `productid` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ite_cartproducts_idx` (`cartid`),
  KEY `product_item_idx` (`productid`),
  CONSTRAINT `ite_cartproducts` FOREIGN KEY (`cartid`) REFERENCES `cart` (`id`),
  CONSTRAINT `product_item` FOREIGN KEY (`productid`) REFERENCES `products` (`id`)
);

CREATE TABLE `cartitemclinic` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cartid` int DEFAULT NULL,
  `clinicid` int DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `item_cart_idx` (`cartid`),
  KEY `item_clinc_idx` (`clinicid`),
  CONSTRAINT `item_cartclinic` FOREIGN KEY (`cartid`) REFERENCES `cart` (`id`),
  CONSTRAINT `item_clinc` FOREIGN KEY (`clinicid`) REFERENCES `clinics` (`id`)
);




ALTER TABLE `products` 
ADD COLUMN `long_description` LONGTEXT NULL AFTER `description`,
ADD COLUMN `saleprice` DECIMAL(2) NULL AFTER `long_description`,
ADD COLUMN `image1` MEDIUMTEXT NULL AFTER `saleprice`,
ADD COLUMN `image2` MEDIUMTEXT NULL AFTER `image1`,
ADD COLUMN `image3` MEDIUMTEXT NULL AFTER `image2`;


CREATE TABLE `categorytoproduct` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `productid` INT NULL,
  `categoryid` INT NULL,
  PRIMARY KEY (`id`),
  INDEX `product_idx` (`productid` ASC) VISIBLE,
  INDEX `category_idx` (`categoryid` ASC) VISIBLE,
  CONSTRAINT `product`
    FOREIGN KEY (`productid`)
    REFERENCES `drapp`.`products` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `category`
    FOREIGN KEY (`categoryid`)
    REFERENCES `drapp`.`categories` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);
