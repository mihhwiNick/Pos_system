-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 12, 2025 at 06:08 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pos_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `points` int(11) DEFAULT 0,
  `face_encoding` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `name`, `phone`, `points`, `face_encoding`) VALUES
(1, 'Nguyễn Văn A', '0987654321',  0, 'ENCODING_1'),
(2, 'Trần Thị B', '0978123456', 3098, 'ENCODING_2'),
(3, 'Lê Văn C', '0912345678',  0, 'ENCODING_3'),
(4, 'Phạm Minh D', '0934567890', 2949, 'ENCODING_4'),
(5, 'Hoàng Anh E', '0923456789', 0, 'ENCODING_5'),
(6, 'Đặng Quốc F', '0967890123', 1328, 'ENCODING_6'),
(7, 'Bùi Thanh G', '0956789012',  259, 'ENCODING_7'),
(8, 'Võ Mỹ H', '0945678901',  0, 'ENCODING_8'),
(9, 'Dương Khoa I', '0934567809', 880, 'ENCODING_9'),
(10, 'Trịnh Hoài J', '0923456708', 110, 'ENCODING_10'),
(11, 'Bùi Minh Huy', '0334875874',  737, NULL),
(12, 'Bùi Minh Huy5', '243456', 98, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `total_amount` decimal(12,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invoices`
--

INSERT INTO `invoices` (`id`, `customer_id`, `total_amount`, `created_at`) VALUES
(11, 1, 456820000.00, '2025-04-01 03:00:00'),
(12, 2, 112940000.00, '2025-04-01 03:15:00'),
(22, 3, 3990000.00, '2025-04-11 15:26:18'),
(23, 11, 113560000.00, '2025-04-11 15:28:01'),
(24, 6, 21870000.00, '2025-04-11 15:47:49'),
(26, 5, 22940000.00, '2025-04-11 15:53:45'),
(27, 6, 21990000.00, '2025-04-11 15:56:38'),
(28, 5, 10470000.00, '2025-04-11 15:57:19'),
(30, 2, 25980000.00, '2025-04-11 16:13:52'),
(31, 4, 21990000.00, '2025-04-11 16:16:25'),
(37, 6, 60970000.00, '2025-04-11 16:28:58'),
(40, 11, 3990000.00, '2025-04-11 17:29:13'),
(42, 12, 25780000.00, '2025-04-11 17:36:05'),
(43, 8, 25680000.00, '2025-04-12 01:40:45'),
(44, 7, 48980000.00, '2025-04-12 01:45:29'),
(45, 7, 25980000.00, '2025-04-12 01:45:56'),
(46, 8, 34990000.00, '2025-04-12 02:02:08'),
(48, 12, 3990000.00, '2025-04-12 03:29:11');

-- --------------------------------------------------------

--
-- Table structure for table `invoice_details`
--

CREATE TABLE `invoice_details` (
  `id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invoice_details`
--

INSERT INTO `invoice_details` (`id`, `invoice_id`, `product_id`, `quantity`, `price`) VALUES
(7, 11, 3, 2, 21990000.00),
(8, 11, 5, 3, 4990000.00),
(9, 11, 7, 3, 15990000.00),
(11, 12, 2, 1, 34990000.00),
(20, 11, 2, 10, 34990000.00),
(22, 12, 18, 2, 20990000.00),
(23, 12, 19, 3, 11990000.00),
(27, 12, 31, 2, 3990000.00),
(33, 22, 6, 1, 3990000.00),
(34, 23, 2, 2, 34990000.00),
(35, 23, 1, 2, 21790000.00),
(36, 24, 3, 1, 21990000.00),
(39, 26, 29, 1, 22990000.00),
(40, 27, 3, 1, 21990000.00),
(41, 28, 11, 1, 2490000.00),
(42, 28, 6, 1, 3990000.00),
(43, 28, 31, 1, 3990000.00),
(46, 30, 6, 1, 3990000.00),
(48, 31, 3, 1, 21990000.00),
(54, 37, 6, 1, 3990000.00),
(55, 37, 3, 1, 21990000.00),
(56, 37, 2, 1, 34990000.00),
(62, 40, 6, 1, 3990000.00),
(65, 42, 3, 1, 21990000.00),
(66, 42, 6, 1, 3990000.00),
(67, 43, 9, 1, 18090000.00),
(68, 43, 10, 1, 7590000.00),
(69, 44, 23, 1, 39990000.00),
(70, 44, 20, 1, 8990000.00),
(71, 45, 6, 1, 3990000.00),
(72, 45, 3, 1, 21990000.00),
(73, 46, 2, 1, 34990000.00),
(75, 48, 6, 1, 3990000.00);

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `brand` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `image_url` varchar(255) DEFAULT NULL,
  `screen_size` varchar(50) DEFAULT NULL,
  `processor` varchar(100) DEFAULT NULL,
  `ram` varchar(50) DEFAULT NULL,
  `storage` varchar(50) DEFAULT NULL,
  `battery` varchar(50) DEFAULT NULL,
  `camera` varchar(255) DEFAULT NULL,
  `os` varchar(50) DEFAULT NULL,
  `color` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `brand`, `price`, `stock`, `image_url`, `screen_size`, `processor`, `ram`, `storage`, `battery`, `camera`, `os`, `color`) VALUES
(1, 'Samsung Galaxy S23 Ultra 256GB', 'Samsung', 21790000.00, 10, 'img/products/1.jpg', '6.8 inches', 'Snapdragon 8 Gen 2', '8 GB', '256 GB', '5000mAh', '200MP + 12MP + 10MP + 10MP', 'Android', 'Phantom Black'),
(2, 'iPhone 15 Pro Max 256GB', 'Apple', 34990000.00, 15, 'img/products/2.jpg', '6.7 inches', 'A17 Pro', '8 GB', '256 GB', '4422mAh', '48MP + 12MP + 12MP + 12MP', 'iOS', 'Natural Titanium'),
(3, 'iPhone 15 128GB', 'Apple', 21990000.00, 20, 'img/products/3.jpg', '6.1 inches', 'Apple A16 Bionic', '6 GB', '128 GB', '3349mAh', '48MP + 12MP + 12MP', 'iOS', 'Blue'),
(4, 'iPhone 14 Pro Max 128GB', 'Apple', 26390000.00, 8, 'img/products/4.jpg', '6.7 inches', 'Apple A16 Bionic', '6 GB', '128 GB', '4323mAh', '48MP + 12MP + 12MP + TOF 3D', 'iOS', 'Deep Purple'),
(5, 'Xiaomi Redmi Note 12 8GB 128GB', 'Xiaomi', 4990000.00, 25, 'img/products/5.jpg', '6.67 inches', 'Snapdragon 685', '8 GB', '128 GB', '5000mAh', '50MP + 8MP + 2MP', 'Android', 'Onyx Gray'),
(6, 'Xiaomi Redmi Note 12 4GB 128GB', 'Xiaomi', 3990000.00, 30, 'img/products/6.jpg', '6.67 inches', 'Snapdragon 685', '4 GB', '128 GB', '5000mAh', '50MP + 8MP + 2MP', 'Android', 'Mint Green'),
(7, 'Xiaomi 13T Pro 5G (12GB - 512GB)', 'Xiaomi', 15990000.00, 12, 'img/products/7.jpg', '6.67 inches', 'Dimensity 9200+', '12 GB', '512 GB', '5000mAh', '50MP + 12MP + 50MP', 'Android', 'Alpine Blue'),
(8, 'Xiaomi Redmi Note 12 Pro 5G', 'Xiaomi', 8490000.00, 18, 'img/products/8.jpg', '6.67 inches', 'Dimensity 1080', '8 GB', '256 GB', '5000mAh', '50MP + 8MP + 2MP', 'Android', 'Polar White'),
(9, 'Xiaomi 13 8GB 256GB', 'Xiaomi', 18090000.00, 10, 'img/products/9.jpg', '6.36 inches', 'Snapdragon 8 Gen 2', '8 GB', '256 GB', '4500mAh', '50MP + 10MP + 12MP', 'Android', 'Black'),
(10, 'Xiaomi Redmi Note 12 Pro 4G 8GB 256GB', 'Xiaomi', 7590000.00, 22, 'img/products/10.jpg', '6.67 inches', 'Snapdragon 732G', '8 GB', '256 GB', '5000mAh', '108MP + 8MP + 2MP + 2MP', 'Android', 'Blue'),
(11, 'Xiaomi Redmi 12C 4GB 64GB', 'Xiaomi', 2490000.00, 35, 'img/products/11.jpg', '6.71 inches', 'MediaTek Helio G85', '4 GB', '64 GB', '5000mAh', '50MP + 0.08MP', 'Android', 'Graphite Gray'),
(12, 'Xiaomi Redmi Note 12S', 'Xiaomi', 6590000.00, 16, 'img/products/12.jpg', '6.43 inches', 'MediaTek Helio G96', '8 GB', '256 GB', '5000mAh', '108MP + 8MP + 2MP', 'Android', 'Ice Blue'),
(13, 'Xiaomi 13 Lite', 'Xiaomi', 10990000.00, 14, 'img/products/13.jpg', '6.55 inches', 'Snapdragon 7 Gen 1', '8 GB', '256 GB', '4500mAh', '50MP + 8MP + 2MP', 'Android', 'Lite Pink'),
(14, 'Xiaomi 12T 8GB 128GB', 'Xiaomi', 10990000.00, 12, 'img/products/14.jpg', '6.67 inches', 'Dimensity 8100-Ultra', '8 GB', '128 GB', '5000mAh', '108MP + 8MP + 2MP', 'Android', 'Cosmic Black'),
(15, 'Xiaomi Redmi Note 11 Pro Plus 5G', 'Xiaomi', 10490000.00, 17, 'img/products/15.jpg', '6.67 inches', 'Dimensity 920', '8 GB', '256 GB', '4500mAh', '108MP + 8MP + 2MP', 'Android', 'Graphite Gray'),
(16, 'Xiaomi POCO X5 5G 8GB 256GB', 'Xiaomi', 6990000.00, 20, 'img/products/16.jpg', '6.67 inches', 'Snapdragon 695', '8 GB', '256 GB', '5000mAh', '48MP + 8MP + 2MP', 'Android', 'Black'),
(17, 'OPPO Reno10 5G 8GB 256GB', 'OPPO', 10490000.00, 15, 'img/products/17.jpg', '6.7 inches', 'Dimensity 7050', '8 GB', '256 GB', '5000mAh', '64MP + 32MP + 8MP', 'Android', 'Ice Blue'),
(18, 'OPPO Find N2 Flip', 'OPPO', 20990000.00, 12, 'img/products/18.jpg', '6.8 inches', 'Dimensity 9000+', '8 GB', '256 GB', '4300mAh', '50MP + 8MP', 'Android', 'Astral Black'),
(19, 'OPPO Reno8 5G (8GB 256GB)', 'OPPO', 11990000.00, 18, 'img/products/19.jpg', '6.4 inches', 'Dimensity 1300', '8 GB', '256 GB', '4500mAh', '50MP + 8MP + 2MP', 'Android', 'Shimmer Gold'),
(20, 'OPPO Reno8 T 4G 256GB', 'OPPO', 8990000.00, 22, 'img/products/20.jpg', '6.7 inches', 'Helio G99', '8 GB', '256 GB', '5000mAh', '100MP + 2MP', 'Android', 'Midnight Black'),
(21, 'OPPO A58 4G 6GB 128GB', 'OPPO', 4590000.00, 30, 'img/products/21.jpg', '6.72 inches', 'Helio G85', '6 GB', '128 GB', '5000mAh', '50MP + 2MP', 'Android', 'Dazzling Green'),
(22, 'OPPO Find N3 Flip 12GB 256GB', 'OPPO', 25990000.00, 10, 'img/products/22.jpg', '6.8 inches', 'Dimensity 9200', '12 GB', '256 GB', '4300mAh', '50MP + 48MP + 32MP', 'Android', 'Cream Gold'),
(23, 'OPPO Find N3 16GB 512GB', 'OPPO', 39990000.00, 8, 'img/products/23.jpg', '7.8 inches', 'Snapdragon 8 Gen 2', '16 GB', '512 GB', '4800mAh', '50MP + 48MP + 32MP', 'Android', 'Black'),
(24, 'OPPO A18 4GB 128GB', 'OPPO', 2990000.00, 35, 'img/products/24.jpg', '6.56 inches', 'Helio G85', '4 GB', '128 GB', '5000mAh', '8MP', 'Android', 'Glowing Blue'),
(25, 'OPPO A77s', 'OPPO', 5790000.00, 28, 'img/products/25.jpg', '6.56 inches', 'Snapdragon 680', '8 GB', '128 GB', '5000mAh', '50MP + 2MP', 'Android', 'Sunset Orange'),
(26, 'OPPO Reno7 4G (8GB - 128GB)', 'OPPO', 7390000.00, 20, 'img/products/26.jpg', '6.43 inches', 'Snapdragon 680', '8 GB', '128 GB', '4500mAh', '64MP + 2MP + 2MP', 'Android', 'Cosmic Black'),
(27, 'OPPO Reno7 5G (8GB 256GB)', 'OPPO', 11490000.00, 15, 'img/products/27.jpg', '6.43 inches', 'Dimensity 900', '8 GB', '256 GB', '4500mAh', '64MP + 8MP + 2MP', 'Android', 'Starry Black'),
(28, 'OPPO Reno 7 Pro', 'OPPO', 13990000.00, 10, 'img/products/28.jpg', '6.55 inches', 'Dimensity 1200-Max', '8 GB', '256 GB', '4500mAh', '50MP + 8MP + 2MP', 'Android', 'Starlight Blue'),
(29, 'Samsung Galaxy S22 Ultra (12GB - 256GB)', 'Samsung', 22990000.00, 12, 'img/products/29.jpg', '6.8 inches', 'Snapdragon 8 Gen 1', '12 GB', '256 GB', '5000mAh', '108MP + 10MP + 10MP + 12MP', 'Android', 'Burgundy'),
(30, 'realme 10 8GB 256GB', 'Realme', 5990000.00, 25, 'img/products/30.jpg', '6.4 inches', 'Helio G99', '8 GB', '256 GB', '5000mAh', '50MP + 2MP', 'Android', 'Rush Black'),
(31, 'realme C55 (6GB - 128GB)', 'Realme', 3990000.00, 30, 'img/products/31.jpg', '6.72 inches', 'Helio G88', '6 GB', '128 GB', '5000mAh', '64MP + 2MP', 'Android', 'Sunshower'),
(36, 'dfsdf', 'fdfsd', 26.39, 0, '', '', '', '', '', '', '', '', '');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','staff') NOT NULL DEFAULT 'staff'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`) VALUES
(2, 'admin', '123456', 'admin'),
(3, 'tiendat', '123', 'admin'),
(4, 'mihhwi', '456', 'staff');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `phone` (`phone`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `invoice_details`
--
ALTER TABLE `invoice_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`invoice_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `invoice_details`
--
ALTER TABLE `invoice_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=76;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `invoice_details`
--
ALTER TABLE `invoice_details`
  ADD CONSTRAINT `invoice_details_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `invoice_details_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
