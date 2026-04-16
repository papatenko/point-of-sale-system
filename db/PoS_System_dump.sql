/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.16-MariaDB, for Linux (x86_64)
--
-- Host: papatenko.org    Database: default
-- ------------------------------------------------------
-- Server version	8.4.8

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
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
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `checkout` (
  `checkout_id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(20) NOT NULL,
  `license_plate` varchar(20) NOT NULL,
  `customer_email` varchar(100) DEFAULT NULL,
  `cashier_email` varchar(100) DEFAULT NULL,
  `cancel_reason` enum('Customer Request','Out of Stock','Duplicate Order','Payment Issue','Kitchen Error','Other') DEFAULT NULL,
  `order_type` enum('walk-in','online-pickup') NOT NULL,
  `order_status` enum('pending','preparing','ready','completed','cancelled') NOT NULL,
  `scheduled_time` datetime DEFAULT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','credit','debit') NOT NULL,
  `payment_status` enum('pending','completed','cancelled','refunded') NOT NULL,
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`checkout_id`),
  KEY `fk_checkout_truck` (`license_plate`),
  KEY `fk_checkout_customer` (`customer_email`),
  KEY `fk_checkout_cashier` (`cashier_email`),
  CONSTRAINT `fk_checkout_cashier` FOREIGN KEY (`cashier_email`) REFERENCES `employees` (`email`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_checkout_customer` FOREIGN KEY (`customer_email`) REFERENCES `users` (`email`),
  CONSTRAINT `fk_checkout_truck` FOREIGN KEY (`license_plate`) REFERENCES `food_trucks` (`license_plate`),
  CONSTRAINT `chk_checkout_total` CHECK ((`total_price` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=165 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checkout`
--

LOCK TABLES `checkout` WRITE;
/*!40000 ALTER TABLE `checkout` DISABLE KEYS */;
INSERT INTO `checkout` VALUES
(9,'ORD-1773782613954','dj3y149',NULL,NULL,NULL,'online-pickup','completed',NULL,15.98,'cash','pending','2026-03-22 22:57:27'),
(10,'ORD-1773783411152','bnt8626',NULL,NULL,NULL,'online-pickup','cancelled',NULL,30.97,'credit','pending','2026-03-22 22:57:27'),
(11,'ORD-1773784600409','bnt8626',NULL,NULL,NULL,'online-pickup','cancelled',NULL,24.98,'debit','pending','2026-03-22 22:57:27'),
(12,'ORD-1773784905875','bnt8626',NULL,NULL,NULL,'online-pickup','cancelled',NULL,15.98,'debit','pending','2026-03-22 22:57:27'),
(13,'ORD-1773786446846','bnt8626',NULL,NULL,NULL,'online-pickup','cancelled',NULL,9.99,'debit','pending','2026-03-22 22:57:27'),
(14,'ORD-1773856779985','bnt8626',NULL,NULL,NULL,'online-pickup','cancelled',NULL,9.99,'credit','pending','2026-03-22 22:57:27'),
(15,'ORD-1773856794435','bnt8626',NULL,NULL,NULL,'online-pickup','cancelled',NULL,5.99,'credit','pending','2026-03-22 22:57:27'),
(16,'ORD-1773866791677','bnt8626',NULL,NULL,NULL,'online-pickup','cancelled',NULL,24.98,'credit','pending','2026-03-22 22:57:27'),
(17,'ORD-1773866974869','bnt8626',NULL,NULL,NULL,'online-pickup','cancelled',NULL,30.97,'credit','pending','2026-03-22 22:57:27'),
(18,'ORD-1773867870134','bnt8626',NULL,NULL,NULL,'online-pickup','cancelled',NULL,24.98,'credit','pending','2026-03-22 22:57:27'),
(19,'ORD-1773949115546','dj3y149',NULL,NULL,NULL,'online-pickup','completed',NULL,9.99,'credit','pending','2026-03-22 22:57:27'),
(20,'ORD-1774209355752','dj3y149',NULL,NULL,NULL,'online-pickup','cancelled',NULL,9.99,'credit','pending','2026-03-22 22:57:27'),
(21,'ORD-1774209426938','dj3y149',NULL,NULL,NULL,'online-pickup','cancelled',NULL,9.99,'credit','pending','2026-03-22 22:57:27'),
(22,'ORD-1774209651990','dj3y149',NULL,NULL,NULL,'online-pickup','cancelled',NULL,9.99,'credit','pending','2026-03-22 22:57:27'),
(23,'ORD-1774209663921','dj3y149',NULL,NULL,NULL,'online-pickup','cancelled',NULL,9.99,'credit','pending','2026-03-22 22:57:27'),
(24,'ORD-1774214088546','dj3y149','justin@gmail',NULL,NULL,'online-pickup','cancelled',NULL,24.98,'credit','pending','2026-03-22 22:57:27'),
(25,'ORD-1774215873920','dj3y149','justin@gmail',NULL,NULL,'online-pickup','cancelled',NULL,24.98,'debit','pending','2026-03-22 22:57:27'),
(26,'ORD-1828129181212','dj3y149',NULL,NULL,NULL,'online-pickup','cancelled',NULL,24.98,'credit','pending','2026-03-22 22:57:27'),
(27,'ORD-1774220480873','bnt8626','joshua.j.lopsil@gmail.com',NULL,NULL,'online-pickup','cancelled',NULL,16.46,'debit','pending','2026-03-22 23:01:20'),
(28,'ORD-1774231241472','bnt8626','justin@gmail',NULL,NULL,'online-pickup','cancelled',NULL,24.98,'credit','pending','2026-03-23 02:00:41'),
(29,'ORD-1774237378143','dj3y149','justin@gmail',NULL,NULL,'online-pickup','cancelled',NULL,79.92,'debit','pending','2026-03-23 03:42:58'),
(30,'ORD-1774291147612','bnt8626','justin@gmail',NULL,NULL,'online-pickup','cancelled',NULL,17.97,'debit','pending','2026-03-23 18:39:07'),
(31,'ORD-1774292555236','bnt8626','justin@gmail',NULL,NULL,'online-pickup','cancelled',NULL,24.98,'credit','pending','2026-03-23 19:02:35'),
(32,'1','dj3y149',NULL,NULL,NULL,'walk-in','cancelled',NULL,9.99,'cash','pending','2026-03-23 21:47:29'),
(33,'2','dj3y149',NULL,NULL,NULL,'walk-in','cancelled',NULL,29.98,'credit','pending','2026-03-23 21:48:34'),
(34,'ORD-1774391795715','dj3y149','joshua.j.lopsil@gmail.com',NULL,NULL,'online-pickup','cancelled','2026-03-24 22:36:35',12.98,'credit','pending','2026-03-24 22:36:35'),
(35,'ORD-1774476469701','bnt8626','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-25 22:07:49',29.97,'credit','pending','2026-03-25 22:07:49'),
(36,'1','bnt8626','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-25 20:00:00',44.97,'debit','pending','2026-03-25 22:18:12'),
(37,'1','dj3y149',NULL,NULL,NULL,'walk-in','cancelled','2026-03-25 22:20:39',54.94,'credit','pending','2026-03-25 22:20:39'),
(38,'2','dj3y149',NULL,NULL,NULL,'walk-in','cancelled','2026-03-25 22:21:29',44.97,'credit','pending','2026-03-25 22:21:29'),
(39,'3','dj3y149',NULL,NULL,NULL,'walk-in','cancelled','2026-03-25 22:21:33',15.98,'credit','pending','2026-03-25 22:21:33'),
(40,'2','bnt8626','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-25 17:30:00',29.98,'credit','pending','2026-03-25 22:22:05'),
(41,'4','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-25 19:00:00',11.98,'debit','pending','2026-03-25 22:22:28'),
(42,'1','dj3y149','gg@E',NULL,NULL,'online-pickup','cancelled','2026-03-26 19:30:00',11.98,'credit','pending','2026-03-26 00:02:05'),
(43,'2','dj3y149',NULL,NULL,NULL,'walk-in','cancelled','2026-03-26 03:26:59',17.97,'cash','pending','2026-03-26 03:26:59'),
(44,'1','bnt8626','ibra_customer@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-26 14:30:00',5.98,'credit','pending','2026-03-26 19:23:59'),
(45,'3','dj3y149',NULL,NULL,NULL,'walk-in','cancelled','2026-03-26 21:52:29',29.98,'cash','pending','2026-03-26 21:52:29'),
(46,'4','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-26 18:30:00',44.97,'debit','pending','2026-03-26 21:52:42'),
(47,'5','dj3y149','justin@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-26 17:00:00',9.99,'credit','pending','2026-03-26 21:53:44'),
(48,'6','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-26 17:30:00',29.98,'credit','pending','2026-03-26 22:09:13'),
(49,'7','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-26 17:30:00',19.98,'credit','pending','2026-03-26 22:12:34'),
(50,'8','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-26 18:00:00',29.98,'credit','pending','2026-03-26 22:13:52'),
(51,'9','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-26 17:30:00',19.98,'credit','pending','2026-03-26 22:16:54'),
(52,'10','dj3y149','test1@gmail.com',NULL,NULL,'online-pickup','cancelled','2026-03-26 18:00:00',9.99,'credit','pending','2026-03-26 22:45:00'),
(53,'11','dj3y149','ibra_customer@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-26 18:00:00',29.97,'credit','pending','2026-03-26 22:57:11'),
(54,'12','dj3y149','ibra_customer@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-26 18:30:00',29.97,'credit','pending','2026-03-26 23:00:23'),
(55,'13','dj3y149','ibra_customer@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-26 18:30:00',11.98,'credit','pending','2026-03-26 23:08:52'),
(56,'14','dj3y149','ibra_customer@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-26 18:30:00',19.98,'credit','pending','2026-03-26 23:11:48'),
(57,'15','dj3y149','justin@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-26 18:30:00',14.99,'credit','pending','2026-03-26 23:12:08'),
(58,'16','dj3y149',NULL,NULL,NULL,'walk-in','cancelled','2026-03-26 23:13:55',14.99,'cash','pending','2026-03-26 23:13:55'),
(59,'17','dj3y149',NULL,NULL,NULL,'walk-in','cancelled','2026-03-26 23:21:39',29.97,'cash','pending','2026-03-26 23:21:39'),
(60,'2','bnt8626','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-26 19:00:00',44.97,'credit','pending','2026-03-26 23:31:42'),
(61,'3','bnt8626','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-26 19:00:00',29.97,'credit','pending','2026-03-26 23:33:07'),
(62,'1','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-27 20:00:00',24.98,'credit','pending','2026-03-27 00:22:43'),
(63,'2','dj3y149',NULL,NULL,NULL,'walk-in','cancelled','2026-03-27 00:31:54',19.98,'cash','pending','2026-03-27 00:31:54'),
(64,'3','dj3y149','justin@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-27 20:00:00',29.98,'credit','pending','2026-03-27 00:56:50'),
(65,'4','dj3y149','justin@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-27 20:00:00',29.98,'credit','pending','2026-03-27 01:00:49'),
(66,'5','dj3y149','justin@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-27 20:30:00',19.98,'credit','pending','2026-03-27 01:03:38'),
(67,'6','dj3y149','justin@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-27 20:30:00',9.99,'credit','pending','2026-03-27 01:04:01'),
(68,'7','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-27 20:30:00',19.98,'credit','pending','2026-03-27 01:08:36'),
(69,'8','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-27 20:30:00',9.99,'credit','pending','2026-03-27 01:09:14'),
(70,'9','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-27 20:30:00',9.99,'credit','pending','2026-03-27 01:11:51'),
(71,'10','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-27 11:30:00',29.98,'credit','pending','2026-03-27 06:05:47'),
(72,'11','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled',NULL,29.98,'credit','pending','2026-03-27 06:07:27'),
(73,'1','bnt8626','ibra_customer@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-27 10:30:00',19.98,'debit','pending','2026-03-27 06:36:30'),
(74,'11','dj3y149','test1@gmail.com',NULL,NULL,'online-pickup','cancelled','2026-03-27 12:30:00',152.31,'credit','pending','2026-03-27 17:00:28'),
(75,'1','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-28 12:00:00',24.98,'credit','pending','2026-03-28 16:50:51'),
(76,'1','dj3y149','c@g',NULL,NULL,'online-pickup','cancelled','2026-03-30 14:00:00',70.00,'credit','pending','2026-03-30 18:49:16'),
(77,'12','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-03-31 18:30:00',39.90,'credit','pending','2026-03-31 21:29:58'),
(78,'1','dj3y149','rebecca@rebe',NULL,NULL,'online-pickup','cancelled','2026-04-01 20:30:00',37.42,'credit','pending','2026-04-01 01:00:41'),
(79,'2','dj3y149','rebecca@rebe',NULL,NULL,'online-pickup','cancelled','2026-04-01 20:30:00',8.98,'credit','pending','2026-04-01 01:18:37'),
(80,'3','dj3y149','rebecca@rebe',NULL,NULL,'online-pickup','cancelled','2026-04-01 20:30:00',5.00,'credit','pending','2026-04-01 01:29:25'),
(81,'12','dj3y149',NULL,NULL,NULL,'walk-in','cancelled',NULL,10.00,'cash','pending','2026-04-01 04:51:45'),
(82,'1','bnt8626','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-04-02 12:00:00',10.00,'debit','pending','2026-04-01 04:52:29'),
(83,'1','bnt8626','ibra@gmail',NULL,NULL,'online-pickup','completed',NULL,10.00,'debit','pending','2026-04-01 23:18:17'),
(84,'13','dj3y149','justin@gmail',NULL,NULL,'online-pickup','completed',NULL,20.00,'debit','pending','2026-04-01 23:45:12'),
(85,'2','bnt8626','justin@gmail',NULL,NULL,'online-pickup','completed',NULL,25.00,'debit','pending','2026-04-01 23:45:35'),
(86,'14','dj3y149','justin@gmail',NULL,NULL,'online-pickup','completed',NULL,5.00,'debit','pending','2026-04-01 23:53:01'),
(87,'15','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','completed',NULL,15.00,'credit','pending','2026-04-02 01:30:29'),
(88,'16','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-04-02 15:30:00',3.99,'credit','pending','2026-04-02 20:07:18'),
(89,'3','bnt8626','you@example.com',NULL,NULL,'online-pickup','cancelled',NULL,10.99,'credit','pending','2026-04-02 20:11:58'),
(90,'17','dj3y149',NULL,NULL,NULL,'walk-in','cancelled',NULL,5.00,'credit','pending','2026-04-02 20:20:46'),
(91,'4','bnt8626','ibra@gmail',NULL,NULL,'online-pickup','cancelled',NULL,15.98,'debit','pending','2026-04-02 21:01:27'),
(92,'18','dj3y149','justin@gmail',NULL,NULL,'online-pickup','cancelled',NULL,9.99,'credit','pending','2026-04-02 21:21:18'),
(93,'19','dj3y149','justin@gmail',NULL,NULL,'online-pickup','completed','2026-04-02 17:00:00',9.99,'credit','pending','2026-04-02 21:35:47'),
(94,'20','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-04-03 18:00:00',4.99,'credit','pending','2026-04-02 22:05:27'),
(95,'20','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','completed','2026-04-03 18:30:00',4.99,'credit','pending','2026-04-02 22:10:19'),
(96,'20','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled',NULL,4.99,'debit','pending','2026-04-02 22:11:08'),
(97,'21','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled',NULL,3.98,'debit','pending','2026-04-02 22:11:29'),
(98,'22','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','completed','2026-04-03 19:30:00',10.99,'credit','pending','2026-04-02 22:12:16'),
(99,'22','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled',NULL,25.98,'debit','pending','2026-04-02 22:12:28'),
(100,'23','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-04-03 13:30:00',10.99,'debit','pending','2026-04-03 17:15:44'),
(101,'5','bnt8626','ibra@gmail',NULL,NULL,'online-pickup','cancelled',NULL,10.99,'credit','pending','2026-04-04 01:22:10'),
(102,'1','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-04-04 13:00:00',10.99,'debit','pending','2026-04-04 04:29:43'),
(103,'2','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-04-04 13:00:00',6.99,'debit','pending','2026-04-04 04:36:36'),
(104,'3','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-04-04 13:00:00',15.49,'debit','pending','2026-04-04 04:39:34'),
(105,'4','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','completed','2026-04-04 13:00:00',10.99,'debit','pending','2026-04-04 04:43:37'),
(106,'5','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-04-04 13:00:00',10.99,'debit','pending','2026-04-04 05:29:04'),
(107,'6','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','completed','2026-04-04 13:00:00',21.98,'debit','pending','2026-04-04 05:31:52'),
(108,'1','bnt8626','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-04-05 10:00:00',4.99,'credit','pending','2026-04-04 13:55:05'),
(109,'1','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-04-05 10:00:00',4.99,'debit','pending','2026-04-04 09:18:34'),
(110,'23','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-04-04 10:00:00',4.99,'credit','pending','2026-04-04 09:21:57'),
(111,'2','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-04-05 10:00:00',4.99,'credit','pending','2026-04-04 09:37:30'),
(112,'2','bnt8626','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-04-05 10:00:00',30.95,'credit','pending','2026-04-04 09:45:35'),
(113,'24','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled',NULL,4.99,'credit','pending','2026-04-04 10:05:29'),
(114,'25','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','completed','2026-04-04 13:00:00',23.98,'debit','pending','2026-04-04 12:19:58'),
(115,'26','dj3y149',NULL,NULL,NULL,'walk-in','cancelled',NULL,9.99,'cash','pending','2026-04-04 14:03:20'),
(116,'1','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','completed','2026-04-06 16:30:00',9.98,'debit','pending','2026-04-06 16:26:01'),
(117,'2','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','completed','2026-04-06 17:30:00',12.98,'debit','pending','2026-04-06 16:26:53'),
(118,'1','bnt8626','ibra@gmail',NULL,NULL,'online-pickup','completed','2026-04-08 10:30:00',25.98,'credit','pending','2026-04-06 16:28:02'),
(119,'2','bnt8626','ibra@gmail',NULL,NULL,'online-pickup','completed','2026-04-08 12:00:00',10.00,'debit','pending','2026-04-06 16:28:25'),
(120,'3','bnt8626','ibra@gmail',NULL,NULL,'online-pickup','cancelled','2026-04-08 10:00:00',32.97,'debit','pending','2026-04-06 16:29:04'),
(121,'3','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','completed',NULL,21.98,'credit','pending','2026-04-06 16:44:02'),
(122,'4','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','completed','2026-04-06 17:00:00',21.98,'credit','pending','2026-04-06 16:55:02'),
(123,'5','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','completed',NULL,26.97,'credit','pending','2026-04-06 16:57:25'),
(124,'6','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled',NULL,30.00,'debit','pending','2026-04-06 17:01:41'),
(125,'7','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','completed',NULL,32.97,'credit','pending','2026-04-06 17:12:11'),
(126,'8','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','completed',NULL,17.98,'credit','pending','2026-04-06 17:12:19'),
(127,'9','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','completed',NULL,29.97,'credit','pending','2026-04-06 17:12:25'),
(128,'10','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled',NULL,11.98,'credit','pending','2026-04-06 17:12:39'),
(129,'1','dj3y149','ibra_customer@gmail',NULL,NULL,'online-pickup','cancelled','2026-04-09 10:00:00',21.98,'credit','pending','2026-04-07 16:48:36'),
(130,'1','dj3y149','gg@E',NULL,NULL,'online-pickup','completed','2026-04-07 18:30:00',39.96,'debit','pending','2026-04-07 16:58:41'),
(131,'1','dj3y149','rebecca@rebe',NULL,NULL,'online-pickup','cancelled',NULL,35.96,'credit','pending','2026-04-08 15:07:14'),
(132,'4','bnt8626','f2@G',NULL,NULL,'online-pickup','cancelled','2026-04-08 16:00:00',11.97,'credit','pending','2026-04-08 15:38:40'),
(133,'2','dj3y149','f2@G',NULL,NULL,'online-pickup','cancelled',NULL,48.43,'credit','pending','2026-04-08 16:15:04'),
(134,'1','dj3y149','f2@G',NULL,NULL,'online-pickup','cancelled','2026-04-11 11:30:00',66.40,'credit','pending','2026-04-10 03:50:32'),
(135,'1','dj3y149','ibra_customer@gmail',NULL,NULL,'online-pickup','completed',NULL,1.99,'credit','pending','2026-04-10 14:30:16'),
(136,'2','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled',NULL,21.98,'credit','pending','2026-04-10 14:31:52'),
(137,'3','dj3y149','yhh@y',NULL,NULL,'online-pickup','cancelled',NULL,5.98,'credit','pending','2025-09-03 14:02:39'),
(138,'2','dj3y149','yhh@y',NULL,NULL,'online-pickup','completed','2026-04-11 17:00:00',30.97,'debit','pending','2025-09-03 14:03:51'),
(139,'3','dj3y149',NULL,NULL,NULL,'walk-in','cancelled',NULL,10.99,'credit','pending','2025-09-03 14:06:32'),
(140,'3','dj3y149','ibra_customer@gmail',NULL,NULL,'online-pickup','completed',NULL,19.98,'credit','pending','2026-04-10 16:44:16'),
(141,'3','dj3y149','ibra_customer@gmail',NULL,NULL,'online-pickup','completed','2026-04-11 13:00:00',13.48,'credit','pending','2026-04-10 17:31:08'),
(142,'4','dj3y149',NULL,NULL,NULL,'walk-in','cancelled',NULL,9.99,'credit','pending','2026-04-10 17:33:46'),
(143,'4','dj3y149',NULL,NULL,NULL,'walk-in','cancelled',NULL,29.98,'cash','pending','2026-04-11 13:56:50'),
(144,'5','dj3y149',NULL,NULL,NULL,'walk-in','cancelled',NULL,9.99,'cash','pending','2026-04-11 14:07:22'),
(145,'6','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled',NULL,19.98,'credit','pending','2026-04-11 14:07:38'),
(146,'7','dj3y149','ibra_customer@gmail',NULL,NULL,'online-pickup','cancelled',NULL,15.00,'credit','pending','2026-04-11 14:10:42'),
(147,'8','dj3y149','ibra_customer@gmail',NULL,NULL,'online-pickup','cancelled',NULL,19.98,'credit','pending','2026-04-11 14:13:09'),
(148,'9','dj3y149',NULL,NULL,NULL,'walk-in','cancelled',NULL,9.99,'cash','pending','2026-04-11 14:14:58'),
(149,'10','dj3y149',NULL,NULL,NULL,'walk-in','cancelled',NULL,9.99,'cash','pending','2026-04-11 14:17:11'),
(150,'11','dj3y149',NULL,NULL,NULL,'walk-in','cancelled',NULL,59.94,'cash','pending','2026-04-11 14:18:11'),
(151,'12','dj3y149',NULL,NULL,NULL,'walk-in','cancelled',NULL,9.99,'cash','pending','2026-04-11 14:18:43'),
(152,'1','bnt8626','erikanatajim@gmail.com','ibra@gmail','Customer Request','online-pickup','cancelled',NULL,16.98,'credit','pending','2026-04-14 11:11:54'),
(153,'1','dj3y149','ibra@gmail',NULL,NULL,'online-pickup','cancelled',NULL,10.99,'credit','pending','2026-04-14 11:17:47'),
(154,'2','bnt8626','ibra_customer@gmail',NULL,NULL,'online-pickup','cancelled','2026-04-14 21:00:00',8.99,'credit','pending','2026-04-14 16:01:03'),
(155,'3','bnt8626','erikanatajim@gmail.com','ibra@gmail','Payment Issue','online-pickup','cancelled',NULL,10.99,'credit','pending','2026-04-14 16:10:14'),
(156,'2','dj3y149',NULL,NULL,NULL,'walk-in','completed',NULL,5.99,'credit','pending','2026-04-14 16:17:28'),
(157,'1','bnt8626','TOUCHME@REALGOOD.COM',NULL,NULL,'online-pickup','completed',NULL,1013.09,'credit','pending','2026-04-15 12:52:59'),
(158,'1','dj3y149','TOUCHME@REALGOOD.COM',NULL,NULL,'online-pickup','completed',NULL,3.99,'debit','pending','2026-04-15 12:53:17'),
(159,'2','dj3y149',NULL,'ibra@gmail','Other','walk-in','cancelled',NULL,80.93,'credit','pending','2026-04-15 13:22:51'),
(160,'3','dj3y149',NULL,'ibra@gmail','Out of Stock','walk-in','cancelled',NULL,11.98,'cash','pending','2026-04-15 13:24:18'),
(161,'1','dj3y149','ibra_customer@gmail',NULL,'Customer Request','online-pickup','cancelled','2026-04-22 11:30:00',5.97,'credit','pending','2026-04-15 16:51:25'),
(162,'4','dj3y149','ibra_customer@gmail','ibra@gmail','Kitchen Error','online-pickup','cancelled',NULL,1.99,'credit','pending','2026-04-15 16:54:08'),
(163,'2','bnt8626','ibra_customer@gmail',NULL,NULL,'online-pickup','completed',NULL,10.99,'debit','pending','2026-04-15 17:17:15'),
(164,'3','bnt8626','ibra_customer@gmail','ibra@gmail',NULL,'online-pickup','preparing','2026-04-15 19:30:00',14.99,'debit','pending','2026-04-15 17:17:45');
/*!40000 ALTER TABLE `checkout` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `deduct_inventory_on_preparing` AFTER UPDATE ON `checkout` FOR EACH ROW BEGIN
  DECLARE v_done          TINYINT(1)    DEFAULT 0;
  DECLARE v_oi_quantity   INT;
  DECLARE v_ingredient_id INT;
  DECLARE v_qty_needed    DECIMAL(10,2);
  DECLARE v_total_deduct  DECIMAL(10,2);

  DECLARE cur CURSOR FOR
    SELECT oi.quantity,
           ri.ingredient_id,
           ri.quantity_needed
    FROM   order_items       oi
    JOIN   recipe_ingredient ri ON ri.menu_item_id = oi.menu_item_id
    WHERE  oi.order_id = NEW.checkout_id;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

  IF NEW.order_status = 'preparing' AND OLD.order_status <> 'preparing' THEN

    OPEN cur;
    deduct_loop: LOOP
      FETCH cur INTO v_oi_quantity, v_ingredient_id, v_qty_needed;
      IF v_done THEN
        LEAVE deduct_loop;
      END IF;

      SET v_total_deduct = v_qty_needed * v_oi_quantity;

      UPDATE truck_inventory
      SET    quantity_on_hand = quantity_on_hand - v_total_deduct
      WHERE  license_plate = NEW.license_plate
        AND  ingredient_id = v_ingredient_id;

      INSERT INTO inventory_adjustments
        (license_plate, ingredient_id, adjustment_type,   quantity_change,  reason,                                                          adjusted_by)
      VALUES
        (NEW.license_plate, v_ingredient_id, 'order-deduction', -v_total_deduct, CONCAT('Order #', NEW.checkout_id, ': status → preparing'), @current_employee_email);

    END LOOP deduct_loop;
    CLOSE cur;

  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
INSERT INTO `customers` VALUES
('c@g',NULL),
('cleo@gmail',NULL),
('f2@G',NULL),
('gg@E',NULL),
('ibra_customer@gmail',NULL),
('john.doe@email.com','456 Oak Ave, Houston TX 77001'),
('mustelierrebeca99@gmail.com','sxcdvghj'),
('test1@gmail.com',NULL),
('vanne@gmail',NULL),
('yhh@y',NULL),
('you@example.com',NULL);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `email` varchar(100) NOT NULL,
  `license_plate` varchar(20) NOT NULL,
  `role` enum('admin','manager','cashier','cook') DEFAULT NULL,
  `hire_date` date NOT NULL,
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
INSERT INTO `employees` VALUES
('cash@ier','dj3y149','cashier','2026-03-24',1),
('cooked@cook','dj3y149','cook','2026-03-24',0),
('ibra@gmail','dj3y149','admin','2026-03-23',1),
('joshua.j.lopsil@gmail.com','bnt8626','cook','2026-03-17',1),
('justin@gmail','dj3y149','manager','2026-03-19',1),
('must1@gmail','dj3y149','cashier','2026-04-15',0),
('must3@gmail','dj3y149','cashier','2026-04-15',0),
('rebecca@rebe','dj3y149','manager','2026-03-23',1),
('uma@professor.com','bnt8626','manager','2026-04-02',0);
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `food_trucks`
--

DROP TABLE IF EXISTS `food_trucks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
INSERT INTO `food_trucks` VALUES
('bnt8626','truck2','Scarsdale/Beamer','1234567890',1,'10:00','22:00'),
('dj3y149','truck1','Fuqua/Monroe','12109389836',1,'10:00','22:00');
/*!40000 ALTER TABLE `food_trucks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gender_lookup`
--

DROP TABLE IF EXISTS `gender_lookup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
INSERT INTO `gender_lookup` VALUES
(1,'Male'),
(2,'Female'),
(3,'Non-binary'),
(4,'Prefer not to say');
/*!40000 ALTER TABLE `gender_lookup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingredients`
--

DROP TABLE IF EXISTS `ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ingredients` (
  `ingredient_id` int NOT NULL AUTO_INCREMENT,
  `ingredient_name` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `unit_of_measure` enum('g','kg','ml','l','tsp','tbsp','cup','oz','lb','pcs') DEFAULT NULL,
  `current_unit_cost` decimal(8,2) DEFAULT NULL,
  `storage_time` smallint DEFAULT NULL,
  `preferred_supplier_id` int DEFAULT NULL,
  PRIMARY KEY (`ingredient_id`),
  CONSTRAINT `chk_ingredients_cost` CHECK ((`current_unit_cost` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingredients`
--

LOCK TABLES `ingredients` WRITE;
/*!40000 ALTER TABLE `ingredients` DISABLE KEYS */;
INSERT INTO `ingredients` VALUES
(1,'Basmati Rice','Veggie','g',1.00,1,1),
(2,'Raisins','Fruit','g',1.00,3,1),
(3,'Spices','Spice','g',1.00,99,1),
(4,'Pita','Bread','g',1.00,10,1),
(5,'Lamb','Meat','g',1.00,5,1),
(6,'Lettuce','Veggie','g',1.00,4,1),
(7,'Tomato','Fruit','g',1.00,3,1),
(8,'Cucumber','Fruit','g',1.00,3,1),
(9,'Honey','Idk','g',1.00,99,1),
(10,'Pistachios','Veggie','g',1.00,4,1),
(11,'Phyllo','Bread','g',3.00,20,1),
(12,'Yogurt','Diary','g',3.00,7,1),
(13,'Mango','Fruit','g',1.00,3,1),
(14,'Chicken','Meat','g',4.00,5,1),
(15,'Potato','Veggie','g',1.00,4,1),
(16,'Water','Liquid','g',0.00,99,1),
(17,'Soda','Liquid','g',2.00,99,1),
(19,'Iphone',NULL,'pcs',99.99,99,1),
(20,'Peanut Oil ',NULL,'oz',10.00,120,1),
(22,'Coffee Beans','other','g',0.03,30,2),
(23,'Milk','dairy','l',0.46,4,2);
/*!40000 ALTER TABLE `ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_adjustments`
--

DROP TABLE IF EXISTS `inventory_adjustments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_adjustments` (
  `adjustment_id` int NOT NULL AUTO_INCREMENT,
  `license_plate` varchar(20) NOT NULL,
  `ingredient_id` int NOT NULL,
  `adjustment_type` enum('restock','waste','correction','order-deduction','order-cancel') DEFAULT NULL,
  `quantity_change` decimal(10,2) NOT NULL,
  `reason` text,
  `adjusted_by` varchar(100) NOT NULL,
  `adjustment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`adjustment_id`),
  KEY `fk_adjinv_truck` (`license_plate`),
  KEY `fk_adjinv_ingredient` (`ingredient_id`),
  KEY `fk_adjinv_employee` (`adjusted_by`),
  CONSTRAINT `fk_adjinv_employee` FOREIGN KEY (`adjusted_by`) REFERENCES `employees` (`email`),
  CONSTRAINT `fk_adjinv_ingredient` FOREIGN KEY (`ingredient_id`) REFERENCES `ingredients` (`ingredient_id`),
  CONSTRAINT `fk_adjinv_truck` FOREIGN KEY (`license_plate`) REFERENCES `food_trucks` (`license_plate`)
) ENGINE=InnoDB AUTO_INCREMENT=318 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_adjustments`
--

LOCK TABLES `inventory_adjustments` WRITE;
/*!40000 ALTER TABLE `inventory_adjustments` DISABLE KEYS */;
INSERT INTO `inventory_adjustments` VALUES
(1,'dj3y149',5,'waste',-15000.00,'Expired on 3/22/2026 — auto-expired','justin@gmail','2026-03-23 20:43:34'),
(2,'dj3y149',6,'waste',-3000.00,'Expired on 3/23/2026 — auto-expired','justin@gmail','2026-03-23 20:43:34'),
(3,'dj3y149',7,'waste',-7000.00,'Expired on 3/23/2026 — auto-expired','justin@gmail','2026-03-23 20:43:34'),
(4,'dj3y149',14,'waste',-10000.00,'Expired on 3/22/2026 — auto-expired','justin@gmail','2026-03-23 20:43:34'),
(5,'dj3y149',8,'waste',-3500.00,'Expired on 3/25/2026 — auto-expired','justin@gmail','2026-03-26 21:40:57'),
(6,'dj3y149',12,'waste',-9000.00,'Expired on 3/24/2026 — auto-expired','justin@gmail','2026-03-26 21:46:45'),
(7,'dj3y149',13,'waste',-7500.00,'Expired on 3/26/2026 — auto-expired','justin@gmail','2026-03-26 21:46:45'),
(8,'dj3y149',5,'restock',9000.00,'Supply order PO-1 received','justin@gmail','2026-03-27 11:26:23'),
(9,'dj3y149',5,'waste',-9000.00,'Expired on 3/22/2026 — auto-expired','justin@gmail','2026-03-27 11:26:28'),
(10,'dj3y149',14,'waste',-6000.00,'Expired on 3/22/2026 — auto-expired','justin@gmail','2026-03-27 11:26:28'),
(11,'dj3y149',14,'restock',6000.00,'Supply order PO-4 received','justin@gmail','2026-03-27 11:32:13'),
(12,'dj3y149',7,'restock',4200.00,'Supply order PO-3 received','justin@gmail','2026-03-27 11:32:20'),
(13,'dj3y149',6,'restock',1800.00,'Supply order PO-2 received','justin@gmail','2026-03-27 11:32:22'),
(14,'dj3y149',8,'restock',2100.00,'Supply order PO-8 received','justin@gmail','2026-03-27 11:43:04'),
(15,'dj3y149',3,'order-deduction',-14.00,'Daily production: 2x menu item #3','justin@gmail','2026-03-27 11:43:14'),
(16,'dj3y149',4,'order-deduction',-340.00,'Daily production: 2x menu item #3','justin@gmail','2026-03-27 11:43:14'),
(17,'dj3y149',7,'order-deduction',-220.00,'Daily production: 2x menu item #3','justin@gmail','2026-03-27 11:43:14'),
(18,'dj3y149',8,'order-deduction',-220.00,'Daily production: 2x menu item #3','justin@gmail','2026-03-27 11:43:14'),
(19,'dj3y149',4,'waste',-8660.00,'Expired on 4/1/2026 — auto-expired','justin@gmail','2026-04-02 20:26:28'),
(20,'dj3y149',6,'waste',-1800.00,'Expired on 3/31/2026 — auto-expired','justin@gmail','2026-04-02 20:26:28'),
(21,'dj3y149',7,'waste',-3980.00,'Expired on 3/30/2026 — auto-expired','justin@gmail','2026-04-02 20:26:28'),
(22,'dj3y149',8,'waste',-1880.00,'Expired on 3/30/2026 — auto-expired','justin@gmail','2026-04-02 20:26:28'),
(23,'dj3y149',14,'waste',-6000.00,'Expired on 4/1/2026 — auto-expired','justin@gmail','2026-04-02 20:26:28'),
(24,'dj3y149',12,'restock',5400.00,'Supply order PO-9 received','justin@gmail','2026-04-02 20:26:48'),
(25,'dj3y149',13,'restock',4500.00,'Supply order PO-11 received','justin@gmail','2026-04-02 20:37:05'),
(26,'dj3y149',13,'restock',4500.00,'Supply order PO-11 received','justin@gmail','2026-04-02 20:37:07'),
(27,'dj3y149',5,'restock',9000.00,'Supply order PO-10 received','justin@gmail','2026-04-02 20:37:10'),
(28,'dj3y149',13,'restock',4500.00,'Supply order PO-7 received','justin@gmail','2026-04-02 20:37:11'),
(29,'dj3y149',12,'restock',5400.00,'Supply order PO-6 received','justin@gmail','2026-04-02 20:37:13'),
(30,'dj3y149',5,'restock',9000.00,'Supply order PO-5 received','justin@gmail','2026-04-02 20:37:15'),
(31,'dj3y149',14,'restock',2100.00,'Supply order PO-16 received','ibra@gmail','2026-04-04 19:23:23'),
(32,'dj3y149',8,'restock',800.00,'Supply order PO-15 received','ibra@gmail','2026-04-04 19:23:31'),
(33,'dj3y149',7,'restock',1500.00,'Supply order PO-14 received','ibra@gmail','2026-04-04 19:23:34'),
(34,'dj3y149',6,'restock',700.00,'Supply order PO-13 received','ibra@gmail','2026-04-04 19:23:36'),
(35,'dj3y149',4,'restock',1900.00,'Supply order PO-12 received','ibra@gmail','2026-04-04 19:23:38'),
(36,'dj3y149',4,'order-deduction',-80.00,'Order #92: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(37,'dj3y149',7,'order-deduction',-50.00,'Order #92: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(38,'dj3y149',8,'order-deduction',-50.00,'Order #92: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(39,'dj3y149',3,'order-deduction',-3.00,'Order #92: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(40,'dj3y149',4,'order-deduction',-80.00,'Order #93: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(41,'dj3y149',7,'order-deduction',-50.00,'Order #93: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(42,'dj3y149',8,'order-deduction',-50.00,'Order #93: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(43,'dj3y149',3,'order-deduction',-3.00,'Order #93: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(44,'dj3y149',5,'order-deduction',-250.00,'Order #114: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(45,'dj3y149',3,'order-deduction',-5.00,'Order #114: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(46,'dj3y149',1,'order-deduction',-150.00,'Order #114: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(47,'dj3y149',6,'order-deduction',-40.00,'Order #114: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(48,'dj3y149',7,'order-deduction',-50.00,'Order #114: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(49,'dj3y149',4,'order-deduction',-160.00,'Order #115: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(50,'dj3y149',7,'order-deduction',-100.00,'Order #115: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(51,'dj3y149',8,'order-deduction',-100.00,'Order #115: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(52,'dj3y149',3,'order-deduction',-6.00,'Order #115: status → preparing','ibra@gmail','2026-04-04 23:44:13'),
(53,'dj3y149',4,'waste',-1820.00,'someone stole it all','ibra@gmail','2026-04-06 21:42:51'),
(54,'dj3y149',11,'waste',-5000.00,'STOLEN','ibra@gmail','2026-04-06 22:10:16'),
(55,'dj3y149',5,'waste',-17750.00,'STOLEN','ibra@gmail','2026-04-06 22:10:33'),
(56,'dj3y149',4,'restock',1900.00,'Supply order PO-17 received','ibra@gmail','2026-04-06 22:20:08'),
(57,'dj3y149',4,'order-deduction',-320.00,'Order #127: status → preparing','justin@gmail','2026-04-06 22:20:09'),
(58,'dj3y149',7,'order-deduction',-200.00,'Order #127: status → preparing','justin@gmail','2026-04-06 22:20:09'),
(59,'dj3y149',8,'order-deduction',-200.00,'Order #127: status → preparing','justin@gmail','2026-04-06 22:20:09'),
(60,'dj3y149',3,'order-deduction',-12.00,'Order #127: status → preparing','justin@gmail','2026-04-06 22:20:09'),
(61,'dj3y149',4,'order-deduction',-300.00,'Order #128: status → preparing','justin@gmail','2026-04-06 22:20:09'),
(62,'dj3y149',3,'order-deduction',-6.00,'Order #128: status → preparing','justin@gmail','2026-04-06 22:20:09'),
(63,'dj3y149',5,'restock',4000.00,'Supply order PO-18 received','ibra@gmail','2026-04-06 22:20:31'),
(64,'dj3y149',4,'order-deduction',-500.00,'Order #130: status → preparing','ibra@gmail','2026-04-07 21:59:17'),
(65,'dj3y149',15,'order-deduction',-200.00,'Order #130: status → preparing','ibra@gmail','2026-04-07 21:59:17'),
(66,'dj3y149',3,'order-deduction',-25.00,'Order #130: status → preparing','ibra@gmail','2026-04-07 21:59:17'),
(67,'dj3y149',14,'order-deduction',-300.00,'Order #130: status → preparing','ibra@gmail','2026-04-07 21:59:17'),
(68,'dj3y149',5,'order-deduction',-300.00,'Order #130: status → preparing','ibra@gmail','2026-04-07 21:59:17'),
(69,'dj3y149',6,'order-deduction',-250.00,'Order #130: status → preparing','ibra@gmail','2026-04-07 21:59:17'),
(70,'dj3y149',4,'order-deduction',-200.00,'Order #133: status → preparing','rebecca@rebe','2026-04-08 21:15:04'),
(71,'dj3y149',7,'order-deduction',-100.00,'Order #133: status → preparing','rebecca@rebe','2026-04-08 21:15:04'),
(72,'dj3y149',6,'order-deduction',-100.00,'Order #133: status → preparing','rebecca@rebe','2026-04-08 21:15:04'),
(73,'dj3y149',5,'order-deduction',-200.00,'Order #133: status → preparing','rebecca@rebe','2026-04-08 21:15:04'),
(74,'bnt8626',9,'order-deduction',-120.00,'Order #132: status → preparing','rebecca@rebe','2026-04-08 21:17:45'),
(75,'bnt8626',11,'order-deduction',-400.00,'Order #132: status → preparing','rebecca@rebe','2026-04-08 21:17:45'),
(76,'bnt8626',10,'order-deduction',-160.00,'Order #132: status → preparing','rebecca@rebe','2026-04-08 21:17:45'),
(77,'dj3y149',6,'waste',-410.00,'Expired on 4/8/2026 — auto-expired','justin@gmail','2026-04-08 21:44:12'),
(78,'dj3y149',7,'waste',-1200.00,'Expired on 4/7/2026 — auto-expired','justin@gmail','2026-04-08 21:44:12'),
(79,'dj3y149',8,'waste',-550.00,'Expired on 4/7/2026 — auto-expired','justin@gmail','2026-04-08 21:44:12'),
(80,'dj3y149',13,'waste',-13500.00,'Expired on 4/5/2026 — auto-expired','justin@gmail','2026-04-08 21:44:12'),
(81,'dj3y149',11,'restock',3000.00,'Supply order PO-25 received','justin@gmail','2026-04-08 21:45:07'),
(82,'dj3y149',11,'restock',3000.00,'Supply order PO-25 received','justin@gmail','2026-04-08 21:45:10'),
(83,'dj3y149',8,'restock',2100.00,'Supply order PO-24 received','justin@gmail','2026-04-08 21:45:11'),
(84,'dj3y149',7,'restock',4200.00,'Supply order PO-23 received','justin@gmail','2026-04-08 21:45:14'),
(85,'dj3y149',4,'restock',4320.00,'Supply order PO-22 received','justin@gmail','2026-04-08 21:45:18'),
(86,'dj3y149',6,'restock',1800.00,'Supply order PO-21 received','justin@gmail','2026-04-08 21:45:21'),
(87,'dj3y149',14,'restock',4200.00,'Supply order PO-20 received','justin@gmail','2026-04-08 21:45:23'),
(88,'dj3y149',13,'restock',4500.00,'Supply order PO-19 received','justin@gmail','2026-04-08 21:45:26'),
(89,'dj3y149',12,'waste',-10800.00,'Expired on 4/9/2026 — auto-expired','justin@gmail','2026-04-10 08:51:25'),
(90,'dj3y149',15,'waste',-11800.00,'Expired on 4/10/2026 — auto-expired','justin@gmail','2026-04-10 08:51:25'),
(91,'dj3y149',15,'restock',7200.00,'Supply order PO-27 received','justin@gmail','2026-04-10 09:07:07'),
(92,'dj3y149',12,'restock',5400.00,'Supply order PO-26 received','justin@gmail','2026-04-10 09:07:11'),
(93,'dj3y149',4,'order-deduction',-160.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(94,'dj3y149',7,'order-deduction',-100.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(95,'dj3y149',8,'order-deduction',-100.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(96,'dj3y149',3,'order-deduction',-6.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(97,'dj3y149',4,'order-deduction',-200.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(98,'dj3y149',7,'order-deduction',-100.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(99,'dj3y149',6,'order-deduction',-100.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(100,'dj3y149',5,'order-deduction',-200.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(101,'dj3y149',14,'order-deduction',-400.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(102,'dj3y149',3,'order-deduction',-8.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(103,'dj3y149',15,'order-deduction',-500.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(104,'dj3y149',3,'order-deduction',-4.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(105,'dj3y149',1,'order-deduction',-400.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(106,'dj3y149',2,'order-deduction',-40.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(107,'dj3y149',3,'order-deduction',-4.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(108,'dj3y149',12,'order-deduction',-300.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(109,'dj3y149',13,'order-deduction',-200.00,'Order #134: status → preparing','justin@gmail','2026-04-10 09:08:49'),
(110,'dj3y149',11,'waste',-3000.00,NULL,'justin@gmail','2026-04-10 09:25:37'),
(111,'dj3y149',11,'waste',-1500.00,NULL,'justin@gmail','2026-04-10 09:25:48'),
(112,'dj3y149',11,'waste',-600.00,NULL,'justin@gmail','2026-04-10 09:28:29'),
(113,'dj3y149',8,'waste',-2000.00,NULL,'justin@gmail','2026-04-10 09:28:49'),
(114,'dj3y149',11,'restock',2100.00,'Supply order PO-29 received','justin@gmail','2026-04-10 09:39:41'),
(115,'dj3y149',8,'restock',2100.00,'Supply order PO-28 received','justin@gmail','2026-04-10 09:39:44'),
(116,'dj3y149',9,'order-deduction',-30.00,'Order #137: status → preparing','ibra@gmail','2025-09-03 19:04:12'),
(117,'dj3y149',11,'order-deduction',-100.00,'Order #137: status → preparing','ibra@gmail','2025-09-03 19:04:12'),
(118,'dj3y149',10,'order-deduction',-40.00,'Order #137: status → preparing','ibra@gmail','2025-09-03 19:04:12'),
(119,'dj3y149',5,'order-deduction',-750.00,'Order #138: status → preparing','ibra@gmail','2025-09-03 19:05:15'),
(120,'dj3y149',3,'order-deduction',-15.00,'Order #138: status → preparing','ibra@gmail','2025-09-03 19:05:15'),
(121,'dj3y149',1,'order-deduction',-450.00,'Order #138: status → preparing','ibra@gmail','2025-09-03 19:05:15'),
(122,'dj3y149',6,'order-deduction',-120.00,'Order #138: status → preparing','ibra@gmail','2025-09-03 19:05:15'),
(123,'dj3y149',7,'order-deduction',-150.00,'Order #138: status → preparing','ibra@gmail','2025-09-03 19:05:15'),
(124,'dj3y149',17,'order-deduction',-355.00,'Order #138: status → preparing','ibra@gmail','2025-09-03 19:05:15'),
(125,'dj3y149',5,'restock',6050.00,'Supply order PO-30 received','ibra@gmail','2025-09-03 19:08:19'),
(126,'dj3y149',5,'waste',-9000.00,'Expired on 9/8/2025 — auto-expired','justin@gmail','2026-04-10 20:59:54'),
(223,'dj3y149',5,'restock',9000.00,'Supply order PO-31 received','ibra@gmail','2026-04-10 21:45:52'),
(224,'dj3y149',4,'order-deduction',-160.00,'Order #140: status → preparing','justin@gmail','2026-04-10 21:46:23'),
(225,'dj3y149',7,'order-deduction',-100.00,'Order #140: status → preparing','justin@gmail','2026-04-10 21:46:23'),
(226,'dj3y149',8,'order-deduction',-100.00,'Order #140: status → preparing','justin@gmail','2026-04-10 21:46:23'),
(227,'dj3y149',3,'order-deduction',-6.00,'Order #140: status → preparing','justin@gmail','2026-04-10 21:46:23'),
(228,'dj3y149',4,'order-deduction',-100.00,'Order #140: status → preparing','justin@gmail','2026-04-10 21:46:23'),
(229,'dj3y149',15,'order-deduction',-40.00,'Order #140: status → preparing','justin@gmail','2026-04-10 21:46:23'),
(230,'dj3y149',3,'order-deduction',-5.00,'Order #140: status → preparing','justin@gmail','2026-04-10 21:46:23'),
(231,'dj3y149',14,'order-deduction',-60.00,'Order #140: status → preparing','justin@gmail','2026-04-10 21:46:23'),
(232,'dj3y149',5,'order-deduction',-60.00,'Order #140: status → preparing','justin@gmail','2026-04-10 21:46:23'),
(233,'dj3y149',6,'order-deduction',-50.00,'Order #140: status → preparing','justin@gmail','2026-04-10 21:46:23'),
(234,'dj3y149',4,'order-deduction',-160.00,'Order #141: status → preparing','ibra@gmail','2026-04-10 22:31:56'),
(235,'dj3y149',7,'order-deduction',-100.00,'Order #141: status → preparing','ibra@gmail','2026-04-10 22:31:56'),
(236,'dj3y149',8,'order-deduction',-100.00,'Order #141: status → preparing','ibra@gmail','2026-04-10 22:31:56'),
(237,'dj3y149',3,'order-deduction',-6.00,'Order #141: status → preparing','ibra@gmail','2026-04-10 22:31:56'),
(238,'dj3y149',12,'order-deduction',-150.00,'Order #141: status → preparing','ibra@gmail','2026-04-10 22:31:56'),
(239,'dj3y149',13,'order-deduction',-100.00,'Order #141: status → preparing','ibra@gmail','2026-04-10 22:31:56'),
(240,'dj3y149',4,'order-deduction',-160.00,'Order #142: status → preparing','ibra@gmail','2026-04-10 22:33:46'),
(241,'dj3y149',7,'order-deduction',-100.00,'Order #142: status → preparing','ibra@gmail','2026-04-10 22:33:46'),
(242,'dj3y149',8,'order-deduction',-100.00,'Order #142: status → preparing','ibra@gmail','2026-04-10 22:33:46'),
(243,'dj3y149',3,'order-deduction',-6.00,'Order #142: status → preparing','ibra@gmail','2026-04-10 22:33:46'),
(244,'dj3y149',5,'order-deduction',-750.00,'Order #143: status → preparing','ibra@gmail','2026-04-11 18:57:06'),
(245,'dj3y149',3,'order-deduction',-15.00,'Order #143: status → preparing','ibra@gmail','2026-04-11 18:57:06'),
(246,'dj3y149',1,'order-deduction',-450.00,'Order #143: status → preparing','ibra@gmail','2026-04-11 18:57:06'),
(247,'dj3y149',6,'order-deduction',-120.00,'Order #143: status → preparing','ibra@gmail','2026-04-11 18:57:06'),
(248,'dj3y149',7,'order-deduction',-150.00,'Order #143: status → preparing','ibra@gmail','2026-04-11 18:57:06'),
(249,'dj3y149',4,'waste',-4820.00,'STOLEN','ibra@gmail','2026-04-11 19:06:05'),
(250,'dj3y149',5,'waste',-8940.00,'STOLEN','ibra@gmail','2026-04-11 19:06:42'),
(251,'dj3y149',17,'waste',-20945.00,'STOLEN','ibra@gmail','2026-04-11 19:06:59'),
(252,'dj3y149',4,'order-deduction',-160.00,'Order #144: status → preparing','ibra@gmail','2026-04-11 19:07:22'),
(253,'dj3y149',7,'order-deduction',-100.00,'Order #144: status → preparing','ibra@gmail','2026-04-11 19:07:22'),
(254,'dj3y149',8,'order-deduction',-100.00,'Order #144: status → preparing','ibra@gmail','2026-04-11 19:07:22'),
(255,'dj3y149',3,'order-deduction',-6.00,'Order #144: status → preparing','ibra@gmail','2026-04-11 19:07:22'),
(256,'dj3y149',4,'order-deduction',-160.00,'Order #148: status → preparing','ibra@gmail','2026-04-11 19:16:53'),
(257,'dj3y149',7,'order-deduction',-100.00,'Order #148: status → preparing','ibra@gmail','2026-04-11 19:16:53'),
(258,'dj3y149',8,'order-deduction',-100.00,'Order #148: status → preparing','ibra@gmail','2026-04-11 19:16:53'),
(259,'dj3y149',3,'order-deduction',-6.00,'Order #148: status → preparing','ibra@gmail','2026-04-11 19:16:53'),
(260,'dj3y149',4,'order-deduction',-160.00,'Order #149: status → preparing','ibra@gmail','2026-04-11 19:17:25'),
(261,'dj3y149',7,'order-deduction',-100.00,'Order #149: status → preparing','ibra@gmail','2026-04-11 19:17:25'),
(262,'dj3y149',8,'order-deduction',-100.00,'Order #149: status → preparing','ibra@gmail','2026-04-11 19:17:25'),
(263,'dj3y149',3,'order-deduction',-6.00,'Order #149: status → preparing','ibra@gmail','2026-04-11 19:17:25'),
(264,'dj3y149',4,'order-deduction',-160.00,'Order #151: status → preparing','ibra@gmail','2026-04-11 19:18:43'),
(265,'dj3y149',7,'order-deduction',-100.00,'Order #151: status → preparing','ibra@gmail','2026-04-11 19:18:43'),
(266,'dj3y149',8,'order-deduction',-100.00,'Order #151: status → preparing','ibra@gmail','2026-04-11 19:18:43'),
(267,'dj3y149',3,'order-deduction',-6.00,'Order #151: status → preparing','ibra@gmail','2026-04-11 19:18:43'),
(268,'bnt8626',5,'order-deduction',-50.00,'Order #155: status → preparing','ibra@gmail','2026-04-14 21:10:14'),
(269,'bnt8626',4,'order-deduction',-50.00,'Order #155: status → preparing','ibra@gmail','2026-04-14 21:10:14'),
(270,'bnt8626',3,'order-deduction',-10.00,'Order #155: status → preparing','ibra@gmail','2026-04-14 21:10:14'),
(271,'bnt8626',6,'order-deduction',-30.00,'Order #155: status → preparing','ibra@gmail','2026-04-14 21:10:14'),
(272,'dj3y149',6,'waste',-1630.00,'Expired on 4/12/2026 — auto-expired','ibra@gmail','2026-04-14 21:13:23'),
(273,'dj3y149',7,'waste',-3850.00,'Expired on 4/11/2026 — auto-expired','ibra@gmail','2026-04-14 21:13:23'),
(274,'dj3y149',8,'waste',-2000.00,'Expired on 4/13/2026 — auto-expired','ibra@gmail','2026-04-14 21:13:23'),
(275,'dj3y149',13,'waste',-4400.00,'Expired on 4/11/2026 — auto-expired','ibra@gmail','2026-04-14 21:13:23'),
(276,'dj3y149',14,'waste',-5940.00,'Expired on 4/13/2026 — auto-expired','ibra@gmail','2026-04-14 21:13:23'),
(277,'dj3y149',15,'waste',-7160.00,'Expired on 4/14/2026 — auto-expired','ibra@gmail','2026-04-14 21:13:23'),
(278,'dj3y149',4,'order-deduction',-100.00,'Order #156: status → preparing','ibra@gmail','2026-04-14 21:18:15'),
(279,'dj3y149',3,'order-deduction',-2.00,'Order #156: status → preparing','ibra@gmail','2026-04-14 21:18:15'),
(280,'dj3y149',9,'order-deduction',-30.00,'Order #158: status → preparing','ibra@gmail','2026-04-15 17:55:37'),
(281,'dj3y149',11,'order-deduction',-100.00,'Order #158: status → preparing','ibra@gmail','2026-04-15 17:55:37'),
(282,'dj3y149',10,'order-deduction',-40.00,'Order #158: status → preparing','ibra@gmail','2026-04-15 17:55:37'),
(283,'bnt8626',5,'order-deduction',-250.00,'Order #152: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(284,'bnt8626',3,'order-deduction',-5.00,'Order #152: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(285,'bnt8626',1,'order-deduction',-150.00,'Order #152: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(286,'bnt8626',6,'order-deduction',-40.00,'Order #152: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(287,'bnt8626',7,'order-deduction',-50.00,'Order #152: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(288,'bnt8626',5,'order-deduction',-3000.00,'Order #157: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(289,'bnt8626',3,'order-deduction',-60.00,'Order #157: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(290,'bnt8626',1,'order-deduction',-1800.00,'Order #157: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(291,'bnt8626',6,'order-deduction',-480.00,'Order #157: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(292,'bnt8626',7,'order-deduction',-600.00,'Order #157: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(293,'bnt8626',4,'order-deduction',-2600.00,'Order #157: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(294,'bnt8626',7,'order-deduction',-1300.00,'Order #157: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(295,'bnt8626',6,'order-deduction',-1300.00,'Order #157: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(296,'bnt8626',5,'order-deduction',-2600.00,'Order #157: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(297,'bnt8626',14,'order-deduction',-2800.00,'Order #157: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(298,'bnt8626',3,'order-deduction',-56.00,'Order #157: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(299,'bnt8626',22,'order-deduction',-220.00,'Order #157: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(300,'bnt8626',16,'order-deduction',-15500.00,'Order #157: status → preparing','ibra@gmail','2026-04-15 21:30:36'),
(301,'bnt8626',5,'order-cancel',250.00,'Order #152 cancelled','ibra@gmail','2026-04-15 21:45:20'),
(302,'bnt8626',3,'order-cancel',5.00,'Order #152 cancelled','ibra@gmail','2026-04-15 21:45:20'),
(303,'bnt8626',1,'order-cancel',150.00,'Order #152 cancelled','ibra@gmail','2026-04-15 21:45:20'),
(304,'bnt8626',6,'order-cancel',40.00,'Order #152 cancelled','ibra@gmail','2026-04-15 21:45:20'),
(305,'bnt8626',7,'order-cancel',50.00,'Order #152 cancelled','ibra@gmail','2026-04-15 21:45:20'),
(306,'bnt8626',5,'order-cancel',50.00,'Order #155 cancelled','ibra@gmail','2026-04-15 21:47:21'),
(307,'bnt8626',4,'order-cancel',50.00,'Order #155 cancelled','ibra@gmail','2026-04-15 21:47:21'),
(308,'bnt8626',3,'order-cancel',10.00,'Order #155 cancelled','ibra@gmail','2026-04-15 21:47:21'),
(309,'bnt8626',6,'order-cancel',30.00,'Order #155 cancelled','ibra@gmail','2026-04-15 21:47:21'),
(310,'bnt8626',5,'order-deduction',-100.00,'Order #163: status → preparing','ibra@gmail','2026-04-15 22:17:15'),
(311,'bnt8626',4,'order-deduction',-100.00,'Order #163: status → preparing','ibra@gmail','2026-04-15 22:17:15'),
(312,'bnt8626',3,'order-deduction',-20.00,'Order #163: status → preparing','ibra@gmail','2026-04-15 22:17:15'),
(313,'bnt8626',6,'order-deduction',-60.00,'Order #163: status → preparing','ibra@gmail','2026-04-15 22:17:15'),
(314,'bnt8626',4,'order-deduction',-160.00,'Order #164: status → preparing','ibra@gmail','2026-04-16 03:44:02'),
(315,'bnt8626',7,'order-deduction',-100.00,'Order #164: status → preparing','ibra@gmail','2026-04-16 03:44:02'),
(316,'bnt8626',8,'order-deduction',-100.00,'Order #164: status → preparing','ibra@gmail','2026-04-16 03:44:02'),
(317,'bnt8626',3,'order-deduction',-6.00,'Order #164: status → preparing','ibra@gmail','2026-04-16 03:44:02');
/*!40000 ALTER TABLE `inventory_adjustments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_category_lookup`
--

DROP TABLE IF EXISTS `menu_category_lookup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
INSERT INTO `menu_category_lookup` VALUES
(1,'Appetizers'),
(2,'Entrees'),
(3,'Sides'),
(4,'Desserts'),
(5,'Drinks');
/*!40000 ALTER TABLE `menu_category_lookup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `menu_items`
--

DROP TABLE IF EXISTS `menu_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `menu_items`
--

LOCK TABLES `menu_items` WRITE;
/*!40000 ALTER TABLE `menu_items` DISABLE KEYS */;
INSERT INTO `menu_items` VALUES
(1,'Saffron Rice',3,'Fragrant basmati rice with saffron and raisins',3.99,1,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ5Ly6Xolf5ite3ixTDfKYgIl6dijYA4X0ptw&s'),
(2,'Lamb Kofta Plate',2,'Spiced ground lamb skewers served with rice and salad',14.99,1,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8dS-UhKh-EsmTcbs5gh-C7tFuRCFKtlpt-g&s'),
(3,'Falafel Wrap',2,'Crispy falafel with hummus, tomato, and cucumber in pita',9.99,1,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkoBrvwPT2kXVFg4Sv02S80-YwL9C7TE2X9Q&s'),
(4,'Hummus & Pita',1,'Creamy hummus served with warm pita bread',5.99,1,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQPkTljKeD4wkn9raWENWAeWNPK71bTU0rSwA&s'),
(5,'Baklava',4,'Honey-soaked phyllo pastry with pistachios',3.99,1,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQsDKytpDeuHHHIb-jflUdFVQl1A3quZhFvw&s'),
(6,'Mango Lassi',5,'Chilled yogurt mango drink',3.49,1,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSHtmNgNXu01_ixJ4Lx2d0hxQJDnf4X6Q0pCg&s'),
(7,'Nuggets',2,'Fried chicken nuggets',5.99,1,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuWNgqQ-RHepl101DM1Qblt4PPDzw4rFpmbw&s'),
(8,'French Fries',3,'Potato sticks that are fried',2.99,1,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRemFgwbD_8LFsZLqxKhyaW0odUJkkgj4UBRw&s'),
(9,'Water',5,'Water from the tap',0.00,1,'https://www.gundersenhealth.org/sites/default/files/styles/card_medium_4_3_600_450/public/be-well-6-easy-tips-to-drink-more-water-daily.png.webp?h=ae1281eb&itok=TzF1pY-P'),
(10,'Soft drink',5,'Soda of our choosing, you have no choice',0.99,1,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSS_hY6mc4BD5wjyp33SjZU2qSIlBmjPTk5GA&s'),
(11,'Tahdig',1,'Rice',10.00,1,'https://nicolretailer.com/wp-content/uploads/2025/04/Nicol-Retailer-Limited-Tahdig-Crispy-Saffron-Rice-Recipe-2048x1365.jpeg'),
(12,'Ice Cream',4,NULL,10.00,0,'https://thebigmansworld.com/wp-content/uploads/2024/05/strawberry-ice-cream-recipe2.jpg'),
(15,'Grape Leaves',1,NULL,5.00,0,'https://www.munatycooking.com/wp-content/uploads/2017/06/Stuffed-Grape-Leaves-Feature-image-2022.jpg'),
(17,'The Perfect 100 Shawarma',1,'A legendary shawarma crafted with perfectly seasoned meat, wrapped in warm pita, and topped with fresh veggies and our secret “extra credit” sauce. Rumor has it… one bite increases your chances of getting a 100. No guarantees, but your taste buds will pass for sure.',9.99,1,'https://www.thedailymeal.com/img/gallery/the-onion-hack-thats-perfect-for-making-shawarma-at-home/intro-1692883768.webp'),
(18,'Extra Credit Hummus Dip',2,'Smooth, creamy hummus topped with olive oil and spices that whisper “you deserve extra credit.” Perfect for dipping, sharing, or emotionally recovering from group projects.',1.99,1,'https://assets.epicurious.com/photos/66778a1d43da900c6f45ade8/1:1/w_4000,h_4000,c_limit/hummus_IG_V1_062024_7864_VOG_final.jpg'),
(19,'Dean’s List Lamb Wrap',2,'Premium seasoned lamb wrapped in warm pita with fresh veggies and signature sauce. So good it automatically upgrades your GPA (results may vary… but flavor doesn’t).',10.99,1,'https://vidarbergum.com/wp-content/uploads/2021/06/tantuni-turkish-lamb-wrap-9.jpg'),
(20,'We Tried Our Best, Shawarma',2,'Juicy, flavorful shawarma made with effort, determination, and just a tiny bit of panic. Surprisingly delicious for something made under academic pressure.',8.99,1,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAKfWxgtj4ZsJIwcU5eMoXwZ8n6Gd2JngD6w&s'),
(21,'No Sleep Just Kebabs Combo',2,'A powerful combo of grilled kebabs, rice, and sides designed to fuel all-nighters and last-minute submissions. Who needs sleep when you have this?',12.99,1,'https://www.pamperedchef.com/iceberg/com/recipe/1249033-lg.jpg'),
(22,'Professor Upgrade Ice Cream',4,'One scoop = good mood. Two scoops = maybe a 100. Worth the risk.',6.50,1,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSQ3ZxxFDLEhbLBPCArsrV8F0VlRgT8j7d6A&s'),
(24,'Deadline Destroyer Arabic Coffee',5,'If your project isn’t letting you sleep, this Arabic coffee will help you survive. Strong, bold, and approved by Team 14 after several questionable life choices. Tested under academic pressure.',4.99,1,'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTWIsaUlpglay15OWQSMcXM4arj_oxsdwA4lA&s'),
(25,'Mandi Plate',2,'Yellow rice with grilled chicken',13.99,1,'https://www.munatycooking.com/wp-content/uploads/2022/09/Chicken-Mandi-1200-x1200-2022-500x500.jpg');
/*!40000 ALTER TABLE `menu_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=271 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES
(7,9,3,1,9.99),
(8,9,7,1,5.99),
(9,10,2,1,14.99),
(10,10,3,1,9.99),
(11,10,7,1,5.99),
(12,11,3,1,9.99),
(13,11,2,1,14.99),
(14,12,7,1,5.99),
(15,12,3,1,9.99),
(16,13,3,1,9.99),
(17,14,3,1,9.99),
(18,15,7,1,5.99),
(19,16,3,1,9.99),
(20,16,2,1,14.99),
(21,17,2,1,14.99),
(22,17,3,1,9.99),
(23,17,7,1,5.99),
(24,18,2,1,14.99),
(25,18,3,1,9.99),
(26,19,3,1,9.99),
(27,20,3,1,9.99),
(28,21,3,1,9.99),
(29,22,3,1,9.99),
(30,23,3,1,9.99),
(31,24,3,1,9.99),
(32,24,2,1,14.99),
(33,25,3,1,9.99),
(34,25,2,1,14.99),
(35,27,5,1,3.99),
(36,27,4,1,5.99),
(37,27,6,1,3.49),
(38,27,8,1,2.99),
(39,28,3,1,9.99),
(40,28,2,1,14.99),
(41,29,3,8,79.92),
(42,30,4,3,17.97),
(43,31,3,1,9.99),
(44,31,2,1,14.99),
(45,32,3,1,9.99),
(46,33,2,2,29.98),
(47,34,3,1,9.99),
(48,34,8,1,2.99),
(49,35,3,3,29.97),
(50,36,2,3,44.97),
(51,37,3,3,29.97),
(52,37,7,1,5.99),
(53,37,2,1,14.99),
(54,37,1,1,3.99),
(55,38,2,3,44.97),
(56,39,7,1,5.99),
(57,39,3,1,9.99),
(58,40,2,2,29.98),
(59,41,7,2,11.98),
(60,42,9,1,0.00),
(61,42,4,2,11.98),
(62,43,4,3,17.97),
(63,44,8,2,5.98),
(64,45,2,2,29.98),
(65,46,2,3,44.97),
(66,47,3,1,9.99),
(67,48,2,2,29.98),
(68,49,3,2,19.98),
(69,50,2,2,29.98),
(70,51,3,2,19.98),
(71,52,3,1,9.99),
(72,52,9,1,0.00),
(73,53,3,3,29.97),
(74,54,3,3,29.97),
(75,55,7,2,11.98),
(76,56,3,2,19.98),
(77,57,2,1,14.99),
(78,58,2,1,14.99),
(79,59,3,3,29.97),
(80,60,2,3,44.97),
(81,61,3,3,29.97),
(82,62,3,1,9.99),
(83,62,2,1,14.99),
(84,63,3,2,19.98),
(86,65,2,2,14.99),
(87,66,3,2,9.99),
(88,67,3,2,9.99),
(89,68,3,2,9.99),
(90,69,3,2,9.99),
(91,70,3,2,9.99),
(92,71,2,3,29.98),
(93,72,2,3,29.98),
(94,73,3,3,19.98),
(95,74,3,12,109.89),
(96,74,2,1,14.99),
(97,74,7,1,5.99),
(98,74,8,1,2.99),
(99,74,1,1,3.99),
(100,74,6,1,3.49),
(101,74,10,1,0.99),
(102,74,9,1,0.00),
(103,74,5,1,3.99),
(104,74,4,1,5.99),
(105,75,3,1,9.99),
(106,75,2,1,14.99),
(107,76,15,15,70.00),
(108,77,5,11,39.90),
(109,78,5,1,3.99),
(110,78,4,1,5.99),
(111,78,9,1,0.00),
(112,78,6,1,3.49),
(113,78,10,1,0.99),
(114,78,8,1,2.99),
(115,78,1,1,3.99),
(116,78,7,1,5.99),
(117,78,3,1,9.99),
(118,79,7,1,5.99),
(119,79,8,1,2.99),
(120,80,15,1,5.00),
(121,81,15,3,10.00),
(122,82,15,3,10.00),
(123,83,15,3,10.00),
(124,84,11,1,10.00),
(125,84,12,1,10.00),
(126,85,11,1,10.00),
(127,85,12,1,10.00),
(128,85,15,1,5.00),
(129,86,15,2,5.00),
(130,87,12,1,10.00),
(131,87,15,1,5.00),
(132,88,5,1,3.99),
(133,89,19,1,10.99),
(134,90,15,1,5.00),
(135,91,24,1,4.99),
(136,91,19,1,10.99),
(137,92,3,1,9.99),
(138,93,3,1,9.99),
(139,94,24,2,4.99),
(140,95,24,2,4.99),
(141,96,24,2,4.99),
(142,97,18,3,3.98),
(143,98,19,2,10.99),
(144,99,21,3,25.98),
(145,100,19,2,10.99),
(146,101,19,2,10.99),
(147,102,19,2,10.99),
(148,103,15,1,5.00),
(149,103,18,1,1.99),
(150,104,20,1,8.99),
(151,104,22,1,6.50),
(152,105,19,2,10.99),
(153,106,19,2,10.99),
(154,107,19,3,21.98),
(155,108,24,2,4.99),
(156,109,24,2,4.99),
(157,110,24,2,4.99),
(158,111,24,2,4.99),
(160,113,24,2,4.99),
(161,114,20,1,8.99),
(162,114,2,1,14.99),
(163,115,3,2,9.99),
(166,112,24,3,9.98),
(167,112,10,1,0.99),
(168,112,17,3,19.98),
(169,116,24,3,9.98),
(176,117,19,1,10.99),
(177,117,18,1,1.99),
(178,118,21,3,25.98),
(179,119,15,3,10.00),
(180,120,19,4,32.97),
(181,121,19,3,21.98),
(182,122,19,3,21.98),
(183,123,20,4,26.97),
(185,124,15,7,30.00),
(186,125,19,4,32.97),
(187,126,20,3,17.98),
(188,127,3,4,29.97),
(189,128,4,3,11.98),
(190,129,19,3,21.98),
(191,130,17,5,39.96),
(192,131,18,1,1.99),
(193,131,24,1,4.99),
(194,131,19,1,10.99),
(195,131,15,1,5.00),
(196,131,21,1,12.99),
(197,132,5,4,11.97),
(198,133,24,2,4.99),
(199,133,19,3,21.98),
(200,133,18,4,5.97),
(201,133,22,2,6.50),
(202,133,20,2,8.99),
(203,134,18,2,1.99),
(204,134,19,2,10.99),
(205,134,3,2,9.99),
(206,134,20,2,8.99),
(207,134,21,2,12.99),
(208,134,7,2,5.99),
(209,134,8,2,2.99),
(210,134,1,2,3.99),
(211,134,24,2,4.99),
(212,134,6,2,3.49),
(213,135,18,2,1.99),
(214,136,19,3,21.98),
(215,137,5,1,3.99),
(216,137,18,1,1.99),
(218,138,2,3,29.98),
(219,138,10,1,0.99),
(220,139,19,1,10.99),
(221,140,3,2,9.99),
(222,140,17,1,9.99),
(224,141,3,2,9.99),
(225,141,6,1,3.49),
(226,142,3,2,9.99),
(227,143,2,3,29.98),
(228,144,3,2,9.99),
(229,145,3,3,19.98),
(231,146,15,4,15.00),
(232,147,3,3,19.98),
(234,148,3,2,9.99),
(239,149,3,2,9.99),
(240,150,3,7,59.94),
(241,151,3,2,9.99),
(242,152,18,1,1.99),
(243,152,2,1,14.99),
(244,153,19,1,10.99),
(245,154,20,1,8.99),
(246,155,19,1,10.99),
(248,156,4,1,5.99),
(249,157,18,7,11.94),
(250,157,2,12,164.89),
(251,157,21,16,194.85),
(252,157,20,26,224.75),
(253,157,7,14,77.87),
(254,157,24,22,104.79),
(255,157,9,31,0.00),
(256,157,22,37,234.00),
(258,158,5,1,3.99),
(259,159,19,4,32.97),
(260,159,21,4,38.97),
(261,159,20,1,8.99),
(262,160,7,3,11.98),
(263,161,18,4,5.97),
(266,162,18,2,1.99),
(267,163,19,2,10.99),
(269,164,3,2,9.99),
(270,164,15,1,5.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `order_items_discount_before_insert` BEFORE INSERT ON `order_items` FOR EACH ROW BEGIN
  DECLARE item_price DECIMAL(10,2);
  -- Get the price of the menu item
  SELECT price INTO item_price FROM menu_items WHERE menu_item_id = NEW.menu_item_id;
  IF NEW.quantity >= 2 THEN
    -- Apply discount: 1 item free
    SET NEW.line_total_price = (NEW.quantity - 1) * item_price;
  ELSE
    -- No discount
    SET NEW.line_total_price = NEW.quantity * item_price;
  END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `race_lookup`
--

DROP TABLE IF EXISTS `race_lookup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
INSERT INTO `race_lookup` VALUES
(1,'Arab'),
(2,'Asian'),
(3,'Black or African American'),
(4,'Hispanic or Latino'),
(5,'Native American'),
(6,'Pacific Islander'),
(7,'White'),
(8,'Prefer not to say');
/*!40000 ALTER TABLE `race_lookup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipe_ingredient`
--

DROP TABLE IF EXISTS `recipe_ingredient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=82 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipe_ingredient`
--

LOCK TABLES `recipe_ingredient` WRITE;
/*!40000 ALTER TABLE `recipe_ingredient` DISABLE KEYS */;
INSERT INTO `recipe_ingredient` VALUES
(1,1,1,200.00,'Cook basmati rice in salted water until fluffy'),
(2,1,2,20.00,'Stir raisins into cooked rice'),
(3,1,3,2.00,'Season with saffron and spice blend while cooking'),
(4,2,5,250.00,'Mix ground lamb with spices, form into skewers, grill until cooked through'),
(5,2,3,5.00,'Blend spices into lamb mixture before grilling'),
(6,2,1,150.00,'Serve with a side of saffron rice'),
(7,2,6,40.00,'Arrange fresh lettuce on plate'),
(8,2,7,50.00,'Slice tomato and add to salad side'),
(9,3,4,80.00,'Warm pita and use as the wrap base'),
(10,3,7,50.00,'Dice tomato and layer inside wrap'),
(11,3,8,50.00,'Slice cucumber and layer inside wrap'),
(12,3,3,3.00,'Season falafel mixture with cumin and spice blend before frying'),
(13,4,4,100.00,'Slice and warm pita bread before serving'),
(14,4,3,2.00,'Dust hummus with paprika and spice blend to finish'),
(15,5,9,30.00,'Drizzle honey over finished baklava layers'),
(16,5,11,100.00,'Layer phyllo sheets with butter between each sheet'),
(17,5,10,40.00,'Crush pistachios and distribute between phyllo layers'),
(18,6,12,150.00,'Blend yogurt until smooth as the drink base'),
(19,6,13,100.00,'Add fresh mango and blend with yogurt until combined'),
(20,7,14,200.00,'Cut chicken into bite-sized pieces and coat in breading before frying'),
(21,7,3,4.00,'Season breading with spice blend before coating chicken'),
(22,8,15,250.00,'Slice potatoes into strips and fry until golden'),
(23,8,3,2.00,'Season fries with salt and spice blend immediately after frying'),
(24,9,16,500.00,'Serve chilled tap water in a cup'),
(25,10,17,355.00,'Serve chilled soda of the day in a cup with ice'),
(51,11,20,0.40,NULL),
(53,20,4,100.00,'Place pita on prep'),
(54,20,7,50.00,'place tomatoes on pita'),
(55,20,6,50.00,'place lettuce on pita'),
(56,20,5,100.00,'place lamb on pita, then wrap'),
(57,17,4,100.00,'place pita on prep'),
(58,17,15,40.00,'place potatoes on pita'),
(59,17,3,5.00,'spread spices on pita'),
(60,17,14,60.00,'place chicken over pita'),
(61,17,5,60.00,'place lamb on pita'),
(62,17,6,50.00,'place lettuce on pita, then wrap'),
(67,19,5,50.00,NULL),
(68,19,4,50.00,NULL),
(69,19,3,10.00,NULL),
(70,19,6,30.00,NULL),
(71,24,22,10.00,'Grind the beans'),
(72,25,14,400.00,NULL),
(73,25,1,500.00,NULL),
(74,18,4,120.00,NULL),
(75,15,1,2.00,'Insert into grape leaves'),
(76,15,5,2.00,'Insert into each'),
(77,12,23,1.00,'Requires this and other stuff'),
(78,22,23,1.00,'Mmmm milk'),
(79,21,5,20.00,'Cook it and skew it'),
(80,21,14,20.00,'Cook it and skew it'),
(81,21,19,1.00,'Cook it and skew it');
/*!40000 ALTER TABLE `recipe_ingredient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reorder_alerts`
--

DROP TABLE IF EXISTS `reorder_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reorder_alerts`
--

LOCK TABLES `reorder_alerts` WRITE;
/*!40000 ALTER TABLE `reorder_alerts` DISABLE KEYS */;
INSERT INTO `reorder_alerts` VALUES
(1,'dj3y149',5,0.00,3000.00,'2026-03-23 20:43:34','resolved','2026-03-27 11:26:23','justin@gmail'),
(2,'dj3y149',6,0.00,600.00,'2026-03-23 20:43:34','resolved','2026-03-27 11:32:22','justin@gmail'),
(3,'dj3y149',7,0.00,1400.00,'2026-03-23 20:43:34','resolved','2026-03-27 11:32:19','justin@gmail'),
(4,'dj3y149',14,0.00,2000.00,'2026-03-23 20:43:34','resolved','2026-03-27 11:25:17','justin@gmail'),
(5,'dj3y149',8,0.00,700.00,'2026-03-26 21:40:56','resolved','2026-03-27 11:43:04','justin@gmail'),
(6,'dj3y149',12,0.00,1800.00,'2026-03-26 21:46:45','resolved','2026-04-02 20:26:48','justin@gmail'),
(7,'dj3y149',13,0.00,1500.00,'2026-03-26 21:46:45','resolved','2026-04-02 20:37:05','justin@gmail'),
(8,'dj3y149',5,0.00,3000.00,'2026-03-27 11:26:28','resolved','2026-04-02 20:37:10','justin@gmail'),
(9,'dj3y149',14,6000.00,2000.00,'2026-03-27 11:26:28','resolved','2026-03-27 11:32:13','justin@gmail'),
(10,'dj3y149',4,0.00,1800.00,'2026-04-02 20:26:28','resolved','2026-04-04 19:23:38','ibra@gmail'),
(11,'dj3y149',6,0.00,600.00,'2026-04-02 20:26:28','resolved','2026-04-04 19:23:36','ibra@gmail'),
(12,'dj3y149',7,0.00,1400.00,'2026-04-02 20:26:28','resolved','2026-04-04 19:23:34','ibra@gmail'),
(13,'dj3y149',8,0.00,700.00,'2026-04-02 20:26:28','resolved','2026-04-04 19:23:31','ibra@gmail'),
(14,'dj3y149',14,0.00,2000.00,'2026-04-02 20:26:28','resolved','2026-04-04 19:23:23','ibra@gmail'),
(15,'dj3y149',4,0.00,1800.00,'2026-04-04 23:44:13','resolved','2026-04-06 22:20:08','ibra@gmail'),
(16,'dj3y149',7,0.00,1400.00,'2026-04-04 23:44:13','resolved','2026-04-08 21:45:14','justin@gmail'),
(17,'dj3y149',8,0.00,700.00,'2026-04-04 23:44:13','resolved','2026-04-08 21:45:11','justin@gmail'),
(18,'dj3y149',4,0.00,1800.00,'2026-04-06 21:42:51','resolved','2026-04-06 22:20:08','ibra@gmail'),
(19,'dj3y149',11,0.00,1000.00,'2026-04-06 22:10:16','resolved','2026-04-08 21:45:07','justin@gmail'),
(20,'dj3y149',5,0.00,3000.00,'2026-04-06 22:10:33','resolved','2026-04-06 22:20:31','ibra@gmail'),
(21,'dj3y149',4,1080.00,1800.00,'2026-04-06 22:20:09','resolved','2026-04-08 21:45:18','justin@gmail'),
(22,'dj3y149',7,0.00,1400.00,'2026-04-06 22:20:09','resolved','2026-04-08 21:45:14','justin@gmail'),
(23,'dj3y149',8,0.00,700.00,'2026-04-06 22:20:09','resolved','2026-04-08 21:45:11','justin@gmail'),
(24,'dj3y149',14,1800.00,2000.00,'2026-04-07 21:59:17','resolved','2026-04-08 21:45:23','justin@gmail'),
(25,'dj3y149',6,0.00,600.00,'2026-04-07 21:59:17','resolved','2026-04-08 21:45:21','justin@gmail'),
(26,'dj3y149',13,0.00,1500.00,'2026-04-08 21:44:12','resolved','2026-04-08 21:45:26','justin@gmail'),
(27,'dj3y149',12,0.00,1800.00,'2026-04-10 08:51:25','resolved','2026-04-10 09:07:11','justin@gmail'),
(28,'dj3y149',15,0.00,2400.00,'2026-04-10 08:51:25','resolved','2026-04-10 09:07:07','justin@gmail'),
(29,'dj3y149',11,900.00,1000.00,'2026-04-10 09:28:29','resolved','2026-04-10 09:39:41','justin@gmail'),
(30,'dj3y149',8,0.00,700.00,'2026-04-10 09:28:49','resolved','2026-04-10 09:39:44','justin@gmail'),
(31,'dj3y149',5,2950.00,3000.00,'2025-09-03 19:05:15','resolved','2025-09-03 19:08:18','ibra@gmail'),
(32,'dj3y149',5,0.00,3000.00,'2026-04-10 20:59:54','resolved','2026-04-10 21:45:52','ibra@gmail'),
(33,'dj3y149',4,60.00,1800.00,'2026-04-11 19:06:05','active',NULL,NULL),
(34,'dj3y149',5,0.00,3000.00,'2026-04-11 19:06:42','active',NULL,NULL),
(35,'dj3y149',17,0.00,4260.00,'2026-04-11 19:06:59','active',NULL,NULL),
(36,'dj3y149',6,0.00,600.00,'2026-04-14 21:13:23','ordered',NULL,NULL),
(37,'dj3y149',7,0.00,1400.00,'2026-04-14 21:13:23','ordered',NULL,NULL),
(38,'dj3y149',8,0.00,700.00,'2026-04-14 21:13:23','ordered',NULL,NULL),
(39,'dj3y149',13,0.00,1500.00,'2026-04-14 21:13:23','active',NULL,NULL),
(40,'dj3y149',14,0.00,2000.00,'2026-04-14 21:13:23','active',NULL,NULL),
(41,'dj3y149',15,0.00,2400.00,'2026-04-14 21:13:23','active',NULL,NULL);
/*!40000 ALTER TABLE `reorder_alerts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `supplier_id` int NOT NULL AUTO_INCREMENT,
  `supplier_name` varchar(100) NOT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `address` text,
  `is_reliable_supplier` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`supplier_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES
(1,'COSTCO','Cost Costingson','isinfo@costco.com','18007742678','3836 Richmond Ave, Houston, TX 77027',1),
(2,'HEB','He Eat Bob','customer.relations@heb.com','12109389836','6055 South Fwy, Houston, TX 77004',1),
(7,'Restaurant Depot','Stanley Fleishman','info@jetrord.com','7187628700','1431 W 20th St, Houston, TX 77008',0);
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supply_order_items`
--

DROP TABLE IF EXISTS `supply_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supply_order_items`
--

LOCK TABLES `supply_order_items` WRITE;
/*!40000 ALTER TABLE `supply_order_items` DISABLE KEYS */;
INSERT INTO `supply_order_items` VALUES
(1,1,5,9000.00,9000.00,1.00,9000.00),
(2,2,6,1800.00,1800.00,1.00,1800.00),
(3,3,7,4200.00,4200.00,1.00,4200.00),
(4,4,14,6000.00,6000.00,4.00,24000.00),
(5,5,5,9000.00,9000.00,1.00,9000.00),
(6,6,12,5400.00,5400.00,3.00,16200.00),
(7,7,13,4500.00,4500.00,1.00,4500.00),
(8,8,8,2100.00,2100.00,1.00,2100.00),
(9,9,12,5400.00,5400.00,3.00,16200.00),
(10,10,5,9000.00,9000.00,1.00,9000.00),
(11,11,13,4500.00,4500.00,1.00,4500.00),
(12,12,4,1900.00,1900.00,1.00,1900.00),
(13,13,6,700.00,700.00,1.00,700.00),
(14,14,7,1500.00,1500.00,1.00,1500.00),
(15,15,8,800.00,800.00,1.00,800.00),
(16,16,14,2100.00,2100.00,4.00,8400.00),
(17,17,4,1900.00,1900.00,1.00,1900.00),
(18,18,5,4000.00,4000.00,1.00,4000.00),
(19,19,13,4500.00,4500.00,1.00,4500.00),
(20,20,14,4200.00,4200.00,4.00,16800.00),
(21,21,6,1800.00,1800.00,1.00,1800.00),
(22,22,4,4320.00,4320.00,1.00,4320.00),
(23,23,7,4200.00,4200.00,1.00,4200.00),
(24,24,8,2100.00,2100.00,1.00,2100.00),
(25,25,11,3000.00,3000.00,3.00,9000.00),
(26,26,12,5400.00,5400.00,3.00,16200.00),
(27,27,15,7200.00,7200.00,1.00,7200.00),
(28,28,8,2100.00,2100.00,1.00,2100.00),
(29,29,11,2100.00,2100.00,3.00,6300.00),
(30,30,5,6050.00,6050.00,1.00,6050.00),
(31,31,5,9000.00,9000.00,1.00,9000.00),
(32,32,6,1800.00,0.00,1.00,1800.00),
(33,33,7,4200.00,0.00,1.00,4200.00),
(34,34,8,2100.00,0.00,1.00,2100.00);
/*!40000 ALTER TABLE `supply_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supply_orders`
--

DROP TABLE IF EXISTS `supply_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supply_orders`
--

LOCK TABLES `supply_orders` WRITE;
/*!40000 ALTER TABLE `supply_orders` DISABLE KEYS */;
INSERT INTO `supply_orders` VALUES
(1,1,'dj3y149','justin@gmail',NULL,'2026-03-27','received',9000.00),
(2,1,'dj3y149','justin@gmail',NULL,'2026-03-27','received',1800.00),
(3,1,'dj3y149','justin@gmail',NULL,'2026-03-27','received',4200.00),
(4,1,'dj3y149','justin@gmail',NULL,'2026-03-27','received',24000.00),
(5,1,'dj3y149','justin@gmail',NULL,'2026-04-02','received',9000.00),
(6,1,'dj3y149','justin@gmail',NULL,'2026-04-02','received',16200.00),
(7,1,'dj3y149','justin@gmail',NULL,'2026-04-02','received',4500.00),
(8,1,'dj3y149','justin@gmail',NULL,'2026-03-27','received',2100.00),
(9,1,'dj3y149','justin@gmail',NULL,'2026-04-02','received',16200.00),
(10,1,'dj3y149','justin@gmail',NULL,'2026-04-02','received',9000.00),
(11,1,'dj3y149','justin@gmail',NULL,'2026-04-02','received',4500.00),
(12,1,'dj3y149','ibra@gmail',NULL,'2026-04-04','received',1900.00),
(13,1,'dj3y149','ibra@gmail',NULL,'2026-04-04','received',700.00),
(14,1,'dj3y149','ibra@gmail',NULL,'2026-04-04','received',1500.00),
(15,1,'dj3y149','ibra@gmail',NULL,'2026-04-04','received',800.00),
(16,1,'dj3y149','ibra@gmail',NULL,'2026-04-04','received',8400.00),
(17,1,'dj3y149','ibra@gmail',NULL,'2026-04-06','received',1900.00),
(18,1,'dj3y149','ibra@gmail',NULL,'2026-04-06','received',4000.00),
(19,1,'dj3y149','justin@gmail',NULL,'2026-04-08','received',4500.00),
(20,1,'dj3y149','justin@gmail',NULL,'2026-04-08','received',16800.00),
(21,1,'dj3y149','justin@gmail',NULL,'2026-04-08','received',1800.00),
(22,1,'dj3y149','justin@gmail',NULL,'2026-04-08','received',4320.00),
(23,1,'dj3y149','justin@gmail',NULL,'2026-04-08','received',4200.00),
(24,1,'dj3y149','justin@gmail',NULL,'2026-04-08','received',2100.00),
(25,1,'dj3y149','justin@gmail',NULL,'2026-04-08','received',9000.00),
(26,1,'dj3y149','justin@gmail',NULL,'2026-04-10','received',16200.00),
(27,1,'dj3y149','justin@gmail',NULL,'2026-04-10','received',7200.00),
(28,1,'dj3y149','justin@gmail',NULL,'2026-04-10','received',2100.00),
(29,1,'dj3y149','justin@gmail',NULL,'2026-04-10','received',6300.00),
(30,1,'dj3y149','ibra@gmail',NULL,'2025-09-03','received',6050.00),
(31,1,'dj3y149','justin@gmail',NULL,'2026-04-10','received',9000.00),
(32,1,'dj3y149','ibra@gmail',NULL,NULL,'ordered',1800.00),
(33,7,'dj3y149','ibra@gmail',NULL,NULL,'ordered',4200.00),
(34,2,'dj3y149','justin@gmail',NULL,NULL,'ordered',2100.00);
/*!40000 ALTER TABLE `supply_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `truck_inventory`
--

DROP TABLE IF EXISTS `truck_inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `truck_inventory`
--

LOCK TABLES `truck_inventory` WRITE;
/*!40000 ALTER TABLE `truck_inventory` DISABLE KEYS */;
INSERT INTO `truck_inventory` VALUES
(1,'dj3y149',1,14400.00,3000.00,'2026-06-01 00:00:00','2026-03-15 08:00:00'),
(2,'dj3y149',2,1200.00,200.00,'2026-06-01 00:00:00','2026-03-15 08:00:00'),
(3,'dj3y149',3,1407.00,300.00,'2026-12-31 00:00:00','2026-03-15 08:00:00'),
(4,'dj3y149',4,60.00,1800.00,'2026-04-18 16:45:18','2026-04-08 21:45:18'),
(5,'dj3y149',5,0.00,3000.00,'2026-04-15 16:45:52','2026-04-10 21:45:52'),
(6,'dj3y149',6,0.00,600.00,'2026-04-12 16:45:21','2026-04-08 21:45:21'),
(7,'dj3y149',7,0.00,1400.00,'2026-04-11 16:45:14','2026-04-08 21:45:14'),
(8,'dj3y149',8,0.00,700.00,'2026-04-13 04:39:44','2026-04-10 09:39:44'),
(9,'dj3y149',9,1970.00,400.00,'2026-12-31 00:00:00','2026-03-15 08:00:00'),
(10,'dj3y149',10,2460.00,500.00,'2026-12-31 00:00:00','2026-03-15 08:00:00'),
(11,'dj3y149',11,2900.00,1000.00,'2026-04-30 04:39:41','2026-04-10 09:39:41'),
(12,'dj3y149',12,5250.00,1800.00,'2026-04-17 04:07:11','2026-04-10 09:07:11'),
(13,'dj3y149',13,0.00,1500.00,'2026-04-11 16:45:26','2026-04-08 21:45:26'),
(14,'dj3y149',14,0.00,2000.00,'2026-04-13 16:45:23','2026-04-08 21:45:23'),
(15,'dj3y149',15,0.00,2400.00,'2026-04-14 04:07:07','2026-04-10 09:07:07'),
(16,'dj3y149',16,21000.00,4200.00,NULL,'2026-03-15 08:00:00'),
(17,'dj3y149',17,0.00,4260.00,'2026-12-31 00:00:00','2026-03-15 08:00:00'),
(18,'bnt8626',1,13950.00,3000.00,'2026-06-01 00:00:00','2026-03-16 08:00:00'),
(19,'bnt8626',2,1200.00,200.00,'2026-06-01 00:00:00','2026-03-16 08:00:00'),
(20,'bnt8626',3,1383.00,300.00,'2026-12-31 00:00:00','2026-03-16 08:00:00'),
(21,'bnt8626',4,6140.00,1800.00,'2026-04-01 00:00:00','2026-03-16 08:00:00'),
(22,'bnt8626',5,10550.00,3000.00,'2026-03-22 00:00:00','2026-03-16 08:00:00'),
(23,'bnt8626',6,1360.00,600.00,'2026-03-23 00:00:00','2026-03-16 08:00:00'),
(24,'bnt8626',7,5250.00,1400.00,'2026-03-23 00:00:00','2026-03-16 08:00:00'),
(25,'bnt8626',8,3400.00,700.00,'2026-03-25 00:00:00','2026-03-16 08:00:00'),
(26,'bnt8626',9,2000.00,400.00,'2026-12-31 00:00:00','2026-03-16 08:00:00'),
(27,'bnt8626',10,2500.00,500.00,'2026-12-31 00:00:00','2026-03-16 08:00:00'),
(28,'bnt8626',11,5000.00,1000.00,'2026-04-15 00:00:00','2026-03-16 08:00:00'),
(29,'bnt8626',12,9000.00,1800.00,'2026-03-24 00:00:00','2026-03-16 08:00:00'),
(30,'bnt8626',13,7500.00,1500.00,'2026-03-26 00:00:00','2026-03-16 08:00:00'),
(31,'bnt8626',14,7200.00,2000.00,'2026-03-22 00:00:00','2026-03-16 08:00:00'),
(32,'bnt8626',15,12000.00,2400.00,'2026-04-10 00:00:00','2026-03-16 08:00:00'),
(33,'bnt8626',16,5500.00,4200.00,NULL,'2026-03-16 08:00:00'),
(34,'bnt8626',17,21655.00,4260.00,'2026-12-31 00:00:00','2026-03-16 08:00:00');
/*!40000 ALTER TABLE `truck_inventory` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`%`*/ /*!50003 TRIGGER `truck_inventory_AFTER_UPDATE` AFTER UPDATE ON `truck_inventory` FOR EACH ROW BEGIN
  DECLARE alert_exists INT DEFAULT 0;

  -- Check if this ingredient is already below threshold with an active alert
  SELECT COUNT(*) INTO alert_exists
  FROM `reorder_alerts`
  WHERE `ingredient_id` = NEW.`ingredient_id`
    AND `license_plate` = NEW.`license_plate`
    AND `alert_status` = 'active'
    AND `alert_created` > DATE_SUB(NOW(), INTERVAL 24 HOUR);

  -- If ingredient now falls below threshold AND no recent alert exists
  IF NEW.`quantity_on_hand` < NEW.`reorder_threshold`
     AND OLD.`quantity_on_hand` >= OLD.`reorder_threshold`
     AND alert_exists = 0 THEN

    INSERT INTO `reorder_alerts`
    (`ingredient_id`, `license_plate`, `current_quantity`, `reorder_threshold`, `alert_status`, `alert_created`)
    VALUES (
      NEW.`ingredient_id`,
      NEW.`license_plate`,
      NEW.`quantity_on_hand`,
      NEW.`reorder_threshold`,
      'active',
      NOW()
    );
  END IF;

  -- Update alert if one exists and quantity changed
  UPDATE `reorder_alerts`
  SET `current_quantity` = NEW.`quantity_on_hand`
  WHERE `ingredient_id` = NEW.`ingredient_id`
    AND `license_plate` = NEW.`license_plate`
    AND `alert_status` = 'active';

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `email` varchar(100) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `password` varchar(50) NOT NULL,
  `phone_number` varchar(15) DEFAULT NULL,
  `user_type` enum('customer','employee') DEFAULT NULL,
  `gender` int DEFAULT NULL,
  `ethnicity` int DEFAULT NULL,
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
INSERT INTO `users` VALUES
('c@g','Carl','Test','password',NULL,'customer',1,2,'2026-03-30 18:48:09'),
('cash@ier','cash','ier','money','3271892321','employee',1,2,'2026-03-24 20:38:00'),
('cleo@gmail','cleo','doe','12345678','12345600000','customer',NULL,NULL,'2026-04-10 14:11:06'),
('cooked@cook','cooked','goated','c','3271893321',NULL,1,7,'2026-03-24 20:37:08'),
('erikanatajim@gmail.com','Erika','Botero','Arcoiris101','7132618756','customer',NULL,NULL,'2026-04-14 11:11:37'),
('f2@G','j','h','12345678','1234567890','customer',NULL,NULL,'2026-04-08 15:36:01'),
('gg@E','h','kkk','3',NULL,'customer',NULL,NULL,'2026-03-25 23:48:28'),
('ibra_customer@gmail','ibrahim','customer','i','9334434433','customer',1,1,'2026-03-25 21:47:03'),
('ibra@gmail','Ibrahim','Mohammad','i','9167193134','employee',1,1,'2026-03-23 19:59:34'),
('john.doe@email.com','John','Doe','hashedpassword123','713-555-0101','customer',NULL,NULL,'2026-03-22 22:58:18'),
('joshua.j.lopsil@gmail.com','Joshua','Lopez','pokemongo','7137435268','employee',1,4,'2026-03-22 22:58:18'),
('justin@bruh','justin','kondrankote','bruh',NULL,'customer',1,7,'2026-03-24 19:40:19'),
('justin@gmail','justin','kondratenko','j','3218902893','employee',1,1,'2026-03-22 22:58:18'),
('must1@gmail','mu','re','12345678','1346526023',NULL,2,4,'2026-04-15 12:20:24'),
('must3@gmail','mu','re','12345678','111111111',NULL,2,4,'2026-04-15 12:25:18'),
('mustelierrebeca99@gmail.com','Rebeca','Mustelier Trinchet','lkjhg','765','employee',1,1,'2026-03-23 23:21:45'),
('new@customer','new','customer','bruhmoment','3728191828','customer',NULL,NULL,'2026-04-12 13:27:24'),
('rebe1@gmail','rebe','m','12345678','11111111111',NULL,NULL,NULL,'2026-04-15 10:47:18'),
('rebe2@gmail','rebe','mu','12345678','11111111111',NULL,NULL,NULL,'2026-04-15 11:47:29'),
('rebecca@rebe','rebecca','lastname','1234','3427189321','employee',2,4,'2026-03-23 19:59:34'),
('test1@gmail.com','test','test','password',NULL,'customer',NULL,NULL,'2026-03-26 22:44:06'),
('TOUCHME@REALGOOD.COM','Touch','merealgood','password123','93852907345','customer',NULL,NULL,'2026-04-15 12:52:01'),
('uma@professor.com','Uma','Ramamurthy','databases','2189328919','employee',2,2,'2026-04-02 14:05:31'),
('vanne@gmail','vannesa','lara','12345678','12345678900','customer',NULL,NULL,'2026-04-10 11:46:38'),
('yhh@y','cleo','doe','12345678','12345789988','customer',3,7,'2025-09-03 14:02:25'),
('you@example.com','John','Doe','you',NULL,'customer',1,NULL,'2026-03-25 23:22:51');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'default'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-16  9:56:05
