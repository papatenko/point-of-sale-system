-- MySQL dump 10.13  Distrib 9.4.0, for macos15.4 (arm64)
--
-- Host: localhost    Database: PoS_System
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `checkout`
--

DROP TABLE IF EXISTS `checkout`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `checkout` (
  `checkout_id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(20) NOT NULL,
  `license_plate` varchar(20) NOT NULL,
  `customer_email` varchar(100) DEFAULT NULL,
  `order_type` enum('walk-in','online-pickup') NOT NULL,
  `order_status` enum('pending','preparing','ready','completed','cancelled') NOT NULL,
  `scheduled_time` datetime DEFAULT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','credit','debit') NOT NULL,
  `payment_status` enum('pending','completed','cancelled','refunded') NOT NULL,
  PRIMARY KEY (`checkout_id`),
  KEY `fk_checkout_truck` (`license_plate`),
  KEY `fk_checkout_customer` (`customer_email`),
  CONSTRAINT `fk_checkout_customer` FOREIGN KEY (`customer_email`) REFERENCES `users` (`email`),
  CONSTRAINT `fk_checkout_truck` FOREIGN KEY (`license_plate`) REFERENCES `food_trucks` (`license_plate`),
  CONSTRAINT `chk_checkout_total` CHECK ((`total_price` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checkout`
--

LOCK TABLES `checkout` WRITE;
/*!40000 ALTER TABLE `checkout` DISABLE KEYS */;
/*!40000 ALTER TABLE `checkout` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `email` varchar(100) NOT NULL,
  `default_address` text,
  PRIMARY KEY (`email`),
  CONSTRAINT `fk_customers_email` FOREIGN KEY (`email`) REFERENCES `users` (`email`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `email` varchar(100) NOT NULL,
  `license_plate` varchar(20) NOT NULL,
  `role` enum('admin','manager','cashier','cook') DEFAULT NULL,
  `hire_date` date NOT NULL,
  `hourly_rate` decimal(5,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`email`),
  KEY `fk_employees_truck` (`license_plate`),
  CONSTRAINT `fk_employees_email` FOREIGN KEY (`email`) REFERENCES `users` (`email`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_employees_truck` FOREIGN KEY (`license_plate`) REFERENCES `food_trucks` (`license_plate`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `food_trucks`
--

DROP TABLE IF EXISTS `food_trucks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `food_trucks` (
  `license_plate` varchar(20) NOT NULL,
  `truck_name` varchar(100) NOT NULL,
  `current_location` varchar(255) DEFAULT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `accepts_online_orders` tinyint(1) DEFAULT '1',
  `operating_hours_start` varchar(100) DEFAULT NULL,
  `operating_hours_end` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`license_plate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `food_trucks`
--

LOCK TABLES `food_trucks` WRITE;
/*!40000 ALTER TABLE `food_trucks` DISABLE KEYS */;
/*!40000 ALTER TABLE `food_trucks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gender_lookup`
--

DROP TABLE IF EXISTS `gender_lookup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gender_lookup` (
  `gender_id` int NOT NULL AUTO_INCREMENT,
  `gender` varchar(100) NOT NULL,
  PRIMARY KEY (`gender_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gender_lookup`
--

LOCK TABLES `gender_lookup` WRITE;
/*!40000 ALTER TABLE `gender_lookup` DISABLE KEYS */;
INSERT INTO `gender_lookup` VALUES (1,'Male'),(2,'Female'),(3,'Non-binary'),(4,'Prefer not to say');
/*!40000 ALTER TABLE `gender_lookup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingredients`
--

DROP TABLE IF EXISTS `ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredients` (
  `ingredient_id` int NOT NULL AUTO_INCREMENT,
  `ingredient_name` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `unit_of_measure` enum('g','kg','ml','l','tsp','tbsp','cup','oz','lb','pcs') DEFAULT NULL,
  `current_unit_cost` decimal(8,2) NOT NULL,
  `storage_time` smallint DEFAULT NULL,
  `preferred_supplier_id` int DEFAULT NULL,
  PRIMARY KEY (`ingredient_id`),
  KEY `fk_ingredients_supplier` (`preferred_supplier_id`),
  CONSTRAINT `fk_ingredients_supplier` FOREIGN KEY (`preferred_supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON DELETE SET NULL ON UPDATE SET NULL,
  CONSTRAINT `chk_ingredients_cost` CHECK ((`current_unit_cost` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingredients`
--

LOCK TABLES `ingredients` WRITE;
/*!40000 ALTER TABLE `ingredients` DISABLE KEYS */;
/*!40000 ALTER TABLE `ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_adjustments`
--

DROP TABLE IF EXISTS `inventory_adjustments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_adjustments` (
  `adjustment_id` int NOT NULL AUTO_INCREMENT,
  `license_plate` varchar(20) NOT NULL,
  `ingredient_id` int NOT NULL,
  `adjustment_type` enum('restock','waste','correction','order-deduction') DEFAULT NULL,
  `quantity_change` decimal(10,2) NOT NULL,
  `reason` text,
  `adjusted_by` varchar(100) NOT NULL,
  `adjustment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reference_id` int DEFAULT NULL,
  PRIMARY KEY (`adjustment_id`),
  KEY `fk_adjinv_truck` (`license_plate`),
  KEY `fk_adjinv_ingredient` (`ingredient_id`),
  KEY `fk_adjinv_employee` (`adjusted_by`),
  CONSTRAINT `fk_adjinv_employee` FOREIGN KEY (`adjusted_by`) REFERENCES `employees` (`email`),
  CONSTRAINT `fk_adjinv_ingredient` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`),
  CONSTRAINT `fk_adjinv_truck` FOREIGN KEY (`license_plate`) REFERENCES `food_trucks` (`license_plate`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_adjustments`
--

LOCK TABLES `inventory_adjustments` WRITE;
/*!40000 ALTER TABLE `inventory_adjustments` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_adjustments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `managers`
--

DROP TABLE IF EXISTS `managers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `managers` (
  `email` varchar(100) NOT NULL,
  `budget` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`email`),
  CONSTRAINT `fk_managers_email` FOREIGN KEY (`email`) REFERENCES `employees` (`email`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `managers`
--

LOCK TABLES `managers` WRITE;
/*!40000 ALTER TABLE `managers` DISABLE KEYS */;
/*!40000 ALTER TABLE `managers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_category_lookup`
--

DROP TABLE IF EXISTS `menu_category_lookup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_category_lookup` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) NOT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_category_lookup`
--

LOCK TABLES `menu_category_lookup` WRITE;
/*!40000 ALTER TABLE `menu_category_lookup` DISABLE KEYS */;
INSERT INTO `menu_category_lookup` VALUES (1,'Appetizers'),(2,'Entrees'),(3,'Sides'),(4,'Desserts'),(5,'Drinks');
/*!40000 ALTER TABLE `menu_category_lookup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_items`
--

DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `menu_items` (
  `menu_item_id` int NOT NULL AUTO_INCREMENT,
  `item_name` varchar(100) NOT NULL,
  `category` int DEFAULT NULL,
  `description` text,
  `price` decimal(6,2) NOT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `image_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`menu_item_id`),
  KEY `fk_menu_category` (`category`),
  CONSTRAINT `fk_menu_category` FOREIGN KEY (`category`) REFERENCES `menu_category_lookup` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_items`
--

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `order_item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `menu_item_id` int NOT NULL,
  `quantity` int NOT NULL,
  `line_total_price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`order_item_id`),
  KEY `fk_orderitems_checkout` (`order_id`),
  KEY `fk_orderitems_menu` (`menu_item_id`),
  CONSTRAINT `fk_orderitems_checkout` FOREIGN KEY (`order_id`) REFERENCES `checkout` (`checkout_id`),
  CONSTRAINT `fk_orderitems_menu` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`menu_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `race_lookup`
--

DROP TABLE IF EXISTS `race_lookup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `race_lookup` (
  `race_id` int NOT NULL AUTO_INCREMENT,
  `race` varchar(100) NOT NULL,
  PRIMARY KEY (`race_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `race_lookup`
--

LOCK TABLES `race_lookup` WRITE;
/*!40000 ALTER TABLE `race_lookup` DISABLE KEYS */;
INSERT INTO `race_lookup` VALUES (1,'Arab'),(2,'Asian'),(3,'Black or African American'),(4,'Hispanic or Latino'),(5,'Native American'),(6,'Pacific Islander'),(7,'White'),(8,'Prefer not to say');
/*!40000 ALTER TABLE `race_lookup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipe_ingredient`
--

DROP TABLE IF EXISTS `recipe_ingredient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recipe_ingredient` (
  `recipe_id` int NOT NULL AUTO_INCREMENT,
  `menu_item_id` int NOT NULL,
  `ingredient_id` int NOT NULL,
  `quantity_needed` decimal(10,2) NOT NULL,
  `instructions` text,
  PRIMARY KEY (`recipe_id`),
  KEY `fk_recipe_menu` (`menu_item_id`),
  KEY `fk_recipe_ingredient` (`ingredient_id`),
  CONSTRAINT `fk_recipe_ingredient` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`),
  CONSTRAINT `fk_recipe_menu` FOREIGN KEY (`menu_item_id`) REFERENCES `menu_items` (`menu_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipe_ingredient`
--

LOCK TABLES `recipe_ingredient` WRITE;
/*!40000 ALTER TABLE `recipe_ingredient` DISABLE KEYS */;
/*!40000 ALTER TABLE `recipe_ingredient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reorder_alerts`
--

DROP TABLE IF EXISTS `reorder_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reorder_alerts` (
  `alert_id` int NOT NULL AUTO_INCREMENT,
  `license_plate` varchar(20) NOT NULL,
  `ingredient_id` int NOT NULL,
  `current_quantity` decimal(10,2) NOT NULL,
  `reorder_threshold` decimal(10,2) NOT NULL,
  `alert_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `alert_status` enum('active','ordered','resolved') DEFAULT NULL,
  `resolved_date` timestamp NULL DEFAULT NULL,
  `resolved_by` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`alert_id`),
  KEY `fk_alert_truck` (`license_plate`),
  KEY `fk_alert_ingredient` (`ingredient_id`),
  KEY `fk_alert_resolver` (`resolved_by`),
  CONSTRAINT `fk_alert_ingredient` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`),
  CONSTRAINT `fk_alert_resolver` FOREIGN KEY (`resolved_by`) REFERENCES `employees` (`email`),
  CONSTRAINT `fk_alert_truck` FOREIGN KEY (`license_plate`) REFERENCES `food_trucks` (`license_plate`),
  CONSTRAINT `chk_alert_current_qty` CHECK ((`current_quantity` >= 0)),
  CONSTRAINT `chk_alert_reorder_threshold` CHECK ((`reorder_threshold` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reorder_alerts`
--

LOCK TABLES `reorder_alerts` WRITE;
/*!40000 ALTER TABLE `reorder_alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `reorder_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `supplier_id` int NOT NULL AUTO_INCREMENT,
  `supplier_name` varchar(100) NOT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `address` text,
  `is_reliable_supplier` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supply_order_items`
--

DROP TABLE IF EXISTS `supply_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supply_order_items` (
  `po_item_id` int NOT NULL AUTO_INCREMENT,
  `po_id` int NOT NULL,
  `ingredient_id` int NOT NULL,
  `quantity_ordered` decimal(10,2) NOT NULL,
  `quantity_received` decimal(10,2) DEFAULT '0.00',
  `unit_cost` decimal(8,2) NOT NULL,
  `line_total` decimal(10,2) NOT NULL,
  PRIMARY KEY (`po_item_id`),
  KEY `fk_poitems_po` (`po_id`),
  KEY `fk_poitems_ingredient` (`ingredient_id`),
  CONSTRAINT `fk_poitems_ingredient` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`),
  CONSTRAINT `fk_poitems_po` FOREIGN KEY (`po_id`) REFERENCES `supply_orders` (`po_id`),
  CONSTRAINT `chk_poitems_qty_ordered` CHECK ((`quantity_ordered` >= 0)),
  CONSTRAINT `chk_poitems_qty_received` CHECK ((`quantity_received` >= 0)),
  CONSTRAINT `chk_poitems_unit_cost` CHECK ((`unit_cost` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supply_order_items`
--

LOCK TABLES `supply_order_items` WRITE;
/*!40000 ALTER TABLE `supply_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `supply_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supply_orders`
--

DROP TABLE IF EXISTS `supply_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supply_orders` (
  `po_id` int NOT NULL AUTO_INCREMENT,
  `supplier_id` int NOT NULL,
  `license_plate` varchar(20) NOT NULL,
  `created_by` varchar(100) NOT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `actual_delivery_date` date DEFAULT NULL,
  `status` enum('pending','ordered','received','cancelled') DEFAULT NULL,
  `total_cost` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`po_id`),
  KEY `fk_supplyorder_supplier` (`supplier_id`),
  KEY `fk_supplyorder_truck` (`license_plate`),
  KEY `fk_supplyorder_employee` (`created_by`),
  CONSTRAINT `fk_supplyorder_employee` FOREIGN KEY (`created_by`) REFERENCES `employees` (`email`),
  CONSTRAINT `fk_supplyorder_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`),
  CONSTRAINT `fk_supplyorder_truck` FOREIGN KEY (`license_plate`) REFERENCES `food_trucks` (`license_plate`),
  CONSTRAINT `chk_supplyorder_cost` CHECK ((`total_cost` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supply_orders`
--

LOCK TABLES `supply_orders` WRITE;
/*!40000 ALTER TABLE `supply_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `supply_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `truck_inventory`
--

DROP TABLE IF EXISTS `truck_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `truck_inventory` (
  `inventory_id` int NOT NULL AUTO_INCREMENT,
  `license_plate` varchar(20) NOT NULL,
  `ingredient_id` int NOT NULL,
  `quantity_on_hand` decimal(10,2) NOT NULL DEFAULT '0.00',
  `reorder_threshold` decimal(10,2) NOT NULL,
  `expiration_date` datetime DEFAULT NULL,
  `last_restocked` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`inventory_id`),
  KEY `fk_tinv_truck` (`license_plate`),
  KEY `fk_tinv_ingredient` (`ingredient_id`),
  CONSTRAINT `fk_tinv_ingredient` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`),
  CONSTRAINT `fk_tinv_truck` FOREIGN KEY (`license_plate`) REFERENCES `food_trucks` (`license_plate`),
  CONSTRAINT `chk_tinv_quantity` CHECK ((`quantity_on_hand` >= 0)),
  CONSTRAINT `chk_tinv_reorder` CHECK ((`reorder_threshold` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `truck_inventory`
--

LOCK TABLES `truck_inventory` WRITE;
/*!40000 ALTER TABLE `truck_inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `truck_inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `email` varchar(100) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `password` varchar(50) NOT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `user_type` enum('customer','employee') DEFAULT NULL,
  `gender` int DEFAULT NULL,
  `ethnicity` int DEFAULT NULL,
  PRIMARY KEY (`email`),
  KEY `fk_users_gender` (`gender`),
  KEY `fk_users_ethnicity` (`ethnicity`),
  CONSTRAINT `fk_users_ethnicity` FOREIGN KEY (`ethnicity`) REFERENCES `race_lookup` (`race_id`),
  CONSTRAINT `fk_users_gender` FOREIGN KEY (`gender`) REFERENCES `gender_lookup` (`gender_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-05 15:32:07
