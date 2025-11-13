-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: bibliontec
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

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
-- Table structure for table `acessibilidade`
--

DROP TABLE IF EXISTS `acessibilidade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `acessibilidade` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `daltonismo` tinyint(1) DEFAULT NULL,
  `cego` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acessibilidade`
--

LOCK TABLES `acessibilidade` WRITE;
/*!40000 ALTER TABLE `acessibilidade` DISABLE KEYS */;
/*!40000 ALTER TABLE `acessibilidade` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `autor`
--

DROP TABLE IF EXISTS `autor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `autor` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `autor`
--

LOCK TABLES `autor` WRITE;
/*!40000 ALTER TABLE `autor` DISABLE KEYS */;
INSERT INTO `autor` VALUES (1,'Machado de Assis'),(2,'José de Alencar'),(3,'Monteiro Lobato'),(4,'Carlos Drummond de Andrade'),(5,'Clarice Lispector'),(6,'Graciliano Ramos'),(7,'Jorge Amado'),(8,'Érico Veríssimo'),(9,'Ariano Suassuna'),(10,'Cecília Meireles'),(11,'William Shakespeare'),(12,'Victor Hugo'),(13,'George Orwell'),(14,'Jane Austen'),(15,'Franz Kafka'),(16,'Fiódor Dostoiévski'),(17,'Liev Tolstói'),(18,'Charles Dickens'),(19,'Edgar Allan Poe'),(20,'Gabriel García Márquez'),(21,'Stephen King'),(22,'J.K. Rowling'),(23,'Paulo Coelho'),(24,'Agatha Christie'),(25,'Dan Brown'),(26,'Sun Tzu'),(27,'Platão'),(28,'Aristóteles'),(29,'Jean-Jacques Rousseau'),(30,'Karl Marx'),(31,'H. P. Lovecraft'),(32,'Oscar Wilde'),(33,'Mark Twain'),(34,'Virginia Woolf'),(35,'Emily Brontë'),(36,'Herman Melville'),(37,'Leo Tolstoy'),(38,'Émile Zola'),(39,'Sophocles'),(40,'Homer'),(41,'F. Scott Fitzgerald'),(42,'Ernest Hemingway'),(43,'John Steinbeck'),(44,'Haruki Murakami'),(45,'J.R.R. Tolkien'),(46,'C.S. Lewis'),(47,'Miguel de Cervantes'),(48,'Alexandre Dumas'),(49,'Anne Rice'),(50,'Ralph Ellison'),(51,'K.T. HAO'),(52,'Nivio Ziviani');
/*!40000 ALTER TABLE `autor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup`
--

DROP TABLE IF EXISTS `backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `backup` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` enum('manual','automatico') NOT NULL,
  `caminho_arquivo` varchar(255) NOT NULL,
  `data_criacao` datetime DEFAULT current_timestamp(),
  `status` enum('concluido','falhou') DEFAULT 'concluido',
  `tamanho` varchar(50) DEFAULT NULL,
  `FK_funcionario_id` int(11) DEFAULT NULL,
  `mensagem` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_funcionario_id` (`FK_funcionario_id`),
  CONSTRAINT `backup_ibfk_1` FOREIGN KEY (`FK_funcionario_id`) REFERENCES `funcionario` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup`
--

LOCK TABLES `backup` WRITE;
/*!40000 ALTER TABLE `backup` DISABLE KEYS */;
INSERT INTO `backup` VALUES (7,'manual','backup_1761078048356.zip','2025-10-21 17:20:53','concluido','18.95 MB',8,NULL),(8,'manual','backup_1761078971502.zip','2025-10-21 17:36:13','concluido','18.95 MB',8,NULL),(9,'manual','backup_1761079429813.zip','2025-10-21 17:43:51','concluido','18.95 MB',8,NULL),(10,'manual','backup_1761079444229.zip','2025-10-21 17:44:06','concluido','18.95 MB',8,NULL),(11,'manual','backup_1761083540502.zip','2025-10-21 18:52:22','concluido','18.95 MB',8,NULL),(12,'manual','backup_1761084215567.zip','2025-10-21 19:03:38','concluido','18.95 MB',8,NULL),(13,'manual','backup_1761085220613.zip','2025-10-21 19:20:24','concluido','31.36 MB',8,NULL),(14,'manual','backup_1761085787590.zip','2025-10-21 19:29:51','concluido','50.19 MB',8,NULL),(15,'manual','backup_1761086177143.zip','2025-10-21 19:36:20','concluido','50.19 MB',8,NULL),(16,'manual','backup_1761089164632.zip','2025-10-21 20:26:10','concluido','69.03 MB',8,NULL),(17,'manual','backup_1761089356413.zip','2025-10-21 20:29:22','concluido','69.03 MB',8,NULL),(18,'manual','backup_1761089840824.zip','2025-10-21 20:37:26','concluido','69.03 MB',8,NULL),(19,'manual','backup_1761089858801.zip','2025-10-21 20:37:43','concluido','69.03 MB',8,NULL),(20,'manual','backup_1761090107243.zip','2025-10-21 20:41:54','concluido','79.91 MB',8,NULL),(21,'manual','backup_1761090203628.zip','2025-10-21 20:43:31','concluido','79.91 MB',8,NULL),(22,'manual','backup_1761090360731.zip','2025-10-21 20:46:08','concluido','79.91 MB',8,NULL),(23,'manual','backup_1761090396285.zip','2025-10-21 20:46:42','concluido','79.91 MB',8,NULL),(24,'manual','backup_1761090491894.zip','2025-10-21 20:48:19','concluido','79.91 MB',8,NULL),(25,'manual','backup_1761090618943.zip','2025-10-21 20:50:26','concluido','79.91 MB',8,NULL),(26,'manual','backup_1761090861462.zip','2025-10-21 20:54:30','concluido','79.91 MB',8,NULL),(27,'manual','backup_1761091716406.zip','2025-10-21 21:08:47','concluido','79.91 MB',8,NULL),(28,'manual','backup_1761091944431.zip','2025-10-21 21:12:32','concluido','79.91 MB',8,NULL),(29,'manual','backup_1761092392452.zip','2025-10-21 21:20:00','concluido','79.91 MB',8,NULL),(30,'manual','backup_1761094191210.zip','2025-10-21 21:49:58','concluido','79.91 MB',8,NULL),(31,'manual','backup_1761094478649.zip','2025-10-21 21:54:51','concluido','79.91 MB',8,NULL),(32,'manual','backup_1761094478715.zip','2025-10-21 21:54:51','concluido','79.91 MB',8,NULL),(33,'manual','backup_1761094571449.zip','2025-10-21 21:56:24','concluido','79.91 MB',8,NULL),(34,'manual','backup_1761094571494.zip','2025-10-21 21:56:25','concluido','79.91 MB',8,NULL),(35,'manual','backup_1761094788539.zip','2025-10-21 21:59:57','concluido','79.91 MB',8,NULL),(36,'manual','backup_1761094803220.zip','2025-10-21 22:00:10','concluido','79.91 MB',8,NULL),(37,'manual','backup_1761094984302.zip','2025-10-21 22:03:12','concluido','79.91 MB',8,NULL),(38,'manual','backup_1761095200511.zip','2025-10-21 22:06:47','concluido','79.91 MB',8,NULL),(39,'manual','backup_1761095370000.zip','2025-10-21 22:09:38','concluido','79.91 MB',8,NULL),(40,'manual','backup_1761095490586.zip','2025-10-21 22:11:37','concluido','79.91 MB',8,NULL),(41,'manual','backup_1761096825421.zip','2025-10-21 22:33:55','concluido',NULL,8,NULL);
/*!40000 ALTER TABLE `backup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_config`
--

DROP TABLE IF EXISTS `backup_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `backup_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `FK_instituicao_id` int(11) NOT NULL,
  `hora` varchar(10) DEFAULT '03:00',
  `dias_retencao` int(11) DEFAULT 30,
  `compressao` tinyint(1) DEFAULT 1,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `FK_instituicao_id` (`FK_instituicao_id`),
  CONSTRAINT `fk_backup_config_instituicao` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_config`
--

LOCK TABLES `backup_config` WRITE;
/*!40000 ALTER TABLE `backup_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `backup_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classificacao`
--

DROP TABLE IF EXISTS `classificacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `classificacao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `classificacao` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classificacao`
--

LOCK TABLES `classificacao` WRITE;
/*!40000 ALTER TABLE `classificacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `classificacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comentario`
--

DROP TABLE IF EXISTS `comentario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `comentario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `comentario` varchar(255) DEFAULT NULL,
  `data_comentario` date DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_comentario_instituicao` (`FK_instituicao_id`),
  CONSTRAINT `FK_comentario_instituicao` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comentario`
--

LOCK TABLES `comentario` WRITE;
/*!40000 ALTER TABLE `comentario` DISABLE KEYS */;
INSERT INTO `comentario` VALUES (1,'adorei','2025-09-16',NULL),(2,'adorei','2025-09-16',NULL),(3,'putta','2025-09-16',NULL),(4,'*','2025-09-16',NULL);
/*!40000 ALTER TABLE `comentario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comentario_livro`
--

DROP TABLE IF EXISTS `comentario_livro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `comentario_livro` (
  `FK_comentario_id` int(11) DEFAULT NULL,
  `FK_livro_id` int(11) DEFAULT NULL,
  KEY `FK_comentario_livro_1` (`FK_comentario_id`),
  KEY `FK_comentario_livro_id` (`FK_livro_id`),
  CONSTRAINT `FK_comentario_livro_1` FOREIGN KEY (`FK_comentario_id`) REFERENCES `comentario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_comentario_livro_id` FOREIGN KEY (`FK_livro_id`) REFERENCES `livro` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comentario_livro`
--

LOCK TABLES `comentario_livro` WRITE;
/*!40000 ALTER TABLE `comentario_livro` DISABLE KEYS */;
INSERT INTO `comentario_livro` VALUES (1,11),(2,1),(3,1),(4,1);
/*!40000 ALTER TABLE `comentario_livro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracoes_gerais`
--

DROP TABLE IF EXISTS `configuracoes_gerais`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `configuracoes_gerais` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `duracao_padrao_emprestimo` int(11) NOT NULL,
  `numero_maximo_renovacoes` int(11) NOT NULL,
  `tempo_retirada_reserva` int(11) NOT NULL,
  `numero_maximo_emprestimos` int(11) NOT NULL,
  `multa_por_atraso` decimal(10,2) NOT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `FK_instituicao_id` (`FK_instituicao_id`),
  CONSTRAINT `configuracoes_gerais_ibfk_1` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracoes_gerais`
--

LOCK TABLES `configuracoes_gerais` WRITE;
/*!40000 ALTER TABLE `configuracoes_gerais` DISABLE KEYS */;
INSERT INTO `configuracoes_gerais` VALUES (12,8,1,2,3,2.00,1);
/*!40000 ALTER TABLE `configuracoes_gerais` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracoes_notificacao`
--

DROP TABLE IF EXISTS `configuracoes_notificacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `configuracoes_notificacao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lembrete_vencimento` tinyint(1) DEFAULT 1,
  `dias_antes_vencimento` int(11) DEFAULT 2,
  `notificacao_atraso` tinyint(1) DEFAULT 1,
  `notificacao_reserva` tinyint(1) DEFAULT 1,
  `notificacao_livro_disponivel` tinyint(1) DEFAULT 1,
  `FK_instituicao_id` int(11) DEFAULT NULL,
  `sms_notificacao` tinyint(4) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `FK_instituicao_id` (`FK_instituicao_id`),
  CONSTRAINT `configuracoes_notificacao_ibfk_1` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracoes_notificacao`
--

LOCK TABLES `configuracoes_notificacao` WRITE;
/*!40000 ALTER TABLE `configuracoes_notificacao` DISABLE KEYS */;
INSERT INTO `configuracoes_notificacao` VALUES (4,0,4,1,1,1,1,0);
/*!40000 ALTER TABLE `configuracoes_notificacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracoes_tipo_usuario`
--

DROP TABLE IF EXISTS `configuracoes_tipo_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `configuracoes_tipo_usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `FK_tipo_usuario_id` int(11) DEFAULT NULL,
  `maximo_emprestimos` int(11) NOT NULL,
  `duracao_emprestimo` int(11) NOT NULL,
  `pode_reservar` tinyint(1) DEFAULT 0,
  `pode_renovar` tinyint(1) DEFAULT 0,
  `FK_instituicao_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_tipo_usuario_id` (`FK_tipo_usuario_id`),
  CONSTRAINT `configuracoes_tipo_usuario_ibfk_1` FOREIGN KEY (`FK_tipo_usuario_id`) REFERENCES `tipo_usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracoes_tipo_usuario`
--

LOCK TABLES `configuracoes_tipo_usuario` WRITE;
/*!40000 ALTER TABLE `configuracoes_tipo_usuario` DISABLE KEYS */;
INSERT INTO `configuracoes_tipo_usuario` VALUES (7,1,1,5,1,1,1),(8,2,2,7,0,0,1),(9,3,2,7,1,1,1);
/*!40000 ALTER TABLE `configuracoes_tipo_usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `curso`
--

DROP TABLE IF EXISTS `curso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `curso` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `curso` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `curso`
--

LOCK TABLES `curso` WRITE;
/*!40000 ALTER TABLE `curso` DISABLE KEYS */;
INSERT INTO `curso` VALUES (1,'Desenvolvimento de Sistemas'),(2,'Administração'),(3,'Automação Industrial');
/*!40000 ALTER TABLE `curso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `editora`
--

DROP TABLE IF EXISTS `editora`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `editora` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `editora` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `editora`
--

LOCK TABLES `editora` WRITE;
/*!40000 ALTER TABLE `editora` DISABLE KEYS */;
INSERT INTO `editora` VALUES (1,'Companhia das Letras'),(2,'Editora Record'),(3,'Saraiva'),(4,'Editora Ática'),(5,'Globo Livros'),(6,'Rocco'),(7,'Objetiva'),(8,'LeYa'),(9,'Principis'),(10,'Leya Brasil'),(11,'Intrínseca'),(12,'BestSeller'),(13,'Alfaguara'),(14,'HarperCollins'),(15,'Penguin Random House'),(16,'Oxford University Press'),(17,'Cambridge University Press'),(18,'Springer'),(19,'Elsevier'),(20,'Wiley'),(21,'Macmillan'),(22,'Simon & Schuster'),(23,'Hachette Livre'),(24,'Bloomsbury'),(25,'Editora Moderna'),(26,'Editora Positivo'),(27,'Scipione'),(28,'Zahar'),(29,'Fundamento'),(30,'Vozes'),(31,'Ediouro'),(32,'Companhia Editora Nacional'),(33,'Editora Martins Fontes'),(34,'Editora Paulus'),(35,'Editora Loyola'),(36,'Editora Cultura'),(37,'Editora Record Juvenil'),(38,'Editora Callis'),(39,'Editora Summus'),(40,'Editora Objetiva Infantil');
/*!40000 ALTER TABLE `editora` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emprestimo`
--

DROP TABLE IF EXISTS `emprestimo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `emprestimo` (
  `fila` varchar(50) DEFAULT NULL,
  `data_emprestimo` date DEFAULT NULL,
  `data_devolucao_prevista` date DEFAULT NULL,
  `data_real_devolucao` date DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `FK_instituicao_id` int(11) DEFAULT NULL,
  `FK_usuario_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_emprestimo_instituicao` (`FK_instituicao_id`),
  KEY `fk_emprestimo_usuario` (`FK_usuario_id`),
  CONSTRAINT `FK_emprestimo_instituicao` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_emprestimo_usuario` FOREIGN KEY (`FK_usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emprestimo`
--

LOCK TABLES `emprestimo` WRITE;
/*!40000 ALTER TABLE `emprestimo` DISABLE KEYS */;
INSERT INTO `emprestimo` VALUES (NULL,'2025-09-16','2025-09-23','2025-09-16',1,1,30),(NULL,'2025-09-16','2025-09-23','2025-09-16',2,NULL,30),(NULL,'2025-09-17','2025-09-25','2025-09-17',3,1,30),(NULL,'2025-09-18','2025-09-26',NULL,4,1,30);
/*!40000 ALTER TABLE `emprestimo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emprestimo_livro`
--

DROP TABLE IF EXISTS `emprestimo_livro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `emprestimo_livro` (
  `FK_emprestimo_id` int(11) DEFAULT NULL,
  `FK_livro_id` int(11) DEFAULT NULL,
  KEY `FK_emprestimo_livro_1` (`FK_emprestimo_id`),
  KEY `FK_emprestimo_livro_id` (`FK_livro_id`),
  CONSTRAINT `FK_emprestimo_livro_1` FOREIGN KEY (`FK_emprestimo_id`) REFERENCES `emprestimo` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_emprestimo_livro_id` FOREIGN KEY (`FK_livro_id`) REFERENCES `livro` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emprestimo_livro`
--

LOCK TABLES `emprestimo_livro` WRITE;
/*!40000 ALTER TABLE `emprestimo_livro` DISABLE KEYS */;
INSERT INTO `emprestimo_livro` VALUES (1,6),(2,6),(3,1),(4,6);
/*!40000 ALTER TABLE `emprestimo_livro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `evento`
--

DROP TABLE IF EXISTS `evento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `evento` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `data_evento` date NOT NULL,
  `hora_evento` time DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `FK_instituicao_id` int(11) NOT NULL,
  `FK_funcionario_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_instituicao_id` (`FK_instituicao_id`),
  KEY `FK_funcionario_id` (`FK_funcionario_id`),
  CONSTRAINT `evento_ibfk_1` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`),
  CONSTRAINT `evento_ibfk_2` FOREIGN KEY (`FK_funcionario_id`) REFERENCES `funcionario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evento`
--

LOCK TABLES `evento` WRITE;
/*!40000 ALTER TABLE `evento` DISABLE KEYS */;
/*!40000 ALTER TABLE `evento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `funcao`
--

DROP TABLE IF EXISTS `funcao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `funcao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `funcao` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `funcao`
--

LOCK TABLES `funcao` WRITE;
/*!40000 ALTER TABLE `funcao` DISABLE KEYS */;
INSERT INTO `funcao` VALUES (1,'Administrador'),(2,'Bibliotecário'),(3,'Circulacao'),(4,'Catalogacao');
/*!40000 ALTER TABLE `funcao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `funcionario`
--

DROP TABLE IF EXISTS `funcionario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `funcionario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(200) DEFAULT NULL,
  `senha` varchar(255) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `FK_funcao_id` int(11) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL,
  `ultimo_login` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_funcionario_1` (`FK_funcao_id`),
  KEY `FK_funcionario_instituicao` (`FK_instituicao_id`),
  CONSTRAINT `FK_funcionario_1` FOREIGN KEY (`FK_funcao_id`) REFERENCES `funcao` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_funcionario_instituicao` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `funcionario`
--

LOCK TABLES `funcionario` WRITE;
/*!40000 ALTER TABLE `funcionario` DISABLE KEYS */;
INSERT INTO `funcionario` VALUES (4,'João Silva dos santos','$2b$12$tVUS/6uLjMGP04EMTblqhuezcdfL6uYKW.gvfMvng/j9ink.iMrj2','joaodograu@gmail.com','1755194757132.jpg',2,'11987654328',1,'2025-10-20 16:09:42'),(5,'joao carlos ','$2b$12$LObz6anCBt/bIDCQ4qzJz.VlXO5kyd49SJm4J5iF1HT2IEzF9qqbS','josefina@gmail.com','1757887433078.jpg',4,'11987654321',1,NULL),(8,'Admin Principal','$2b$12$rVucKo1Mud6SLlgNiU3MouyDmrDqvuBn3TDOYOCaRr0/zap1GF79O','admin@bibliotec.com','1757887328295.png',1,'11999999994',1,'2025-10-21 18:51:39'),(9,'cletin do pneu ','$2b$12$EYZ9dyuribSMa1a9oeq91OJxvAvG4/ojIILfhfgNQpd9iYn6IqVnS','cleitindopneu@gmail.com','1756407461200.jpg',3,'74859678541',1,NULL),(10,'shaulin porco','$2b$12$UbUgnWQup4cgnmPh6TOV2ucm5zQ5nVpqK3OnfC887DYxeJeakD3iu','shaulinmatadordeporco@gmail.com','1756413188838.jpg',3,'74859641875',1,NULL);
/*!40000 ALTER TABLE `funcionario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `funcionario_acessibilidade`
--

DROP TABLE IF EXISTS `funcionario_acessibilidade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `funcionario_acessibilidade` (
  `FK_funcionario_id` int(11) DEFAULT NULL,
  `FK_acessibilidade_id` int(11) DEFAULT NULL,
  KEY `FK_funcionario_acessibilidade_0` (`FK_funcionario_id`),
  KEY `FK_funcionario_acessibilidade_1` (`FK_acessibilidade_id`),
  CONSTRAINT `FK_funcionario_acessibilidade_0` FOREIGN KEY (`FK_funcionario_id`) REFERENCES `funcionario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_funcionario_acessibilidade_1` FOREIGN KEY (`FK_acessibilidade_id`) REFERENCES `acessibilidade` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `funcionario_acessibilidade`
--

LOCK TABLES `funcionario_acessibilidade` WRITE;
/*!40000 ALTER TABLE `funcionario_acessibilidade` DISABLE KEYS */;
/*!40000 ALTER TABLE `funcionario_acessibilidade` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `funcionario_notificacao`
--

DROP TABLE IF EXISTS `funcionario_notificacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `funcionario_notificacao` (
  `FK_funcionario_id` int(11) DEFAULT NULL,
  `FK_notificacao_id` int(11) DEFAULT NULL,
  KEY `FK_funcionario_notificacao_0` (`FK_funcionario_id`),
  KEY `FK_funcionario_notificacao_1` (`FK_notificacao_id`),
  CONSTRAINT `FK_funcionario_notificacao_0` FOREIGN KEY (`FK_funcionario_id`) REFERENCES `funcionario` (`id`),
  CONSTRAINT `FK_funcionario_notificacao_1` FOREIGN KEY (`FK_notificacao_id`) REFERENCES `notificacao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `funcionario_notificacao`
--

LOCK TABLES `funcionario_notificacao` WRITE;
/*!40000 ALTER TABLE `funcionario_notificacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `funcionario_notificacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `funcionario_permissao`
--

DROP TABLE IF EXISTS `funcionario_permissao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `funcionario_permissao` (
  `FK_permissao_id` int(11) DEFAULT NULL,
  `FK_funcionario_id` int(11) DEFAULT NULL,
  KEY `FK_funcionario_permissao_0` (`FK_permissao_id`),
  KEY `FK_funcionario_permissao_1` (`FK_funcionario_id`),
  CONSTRAINT `FK_funcionario_permissao_0` FOREIGN KEY (`FK_permissao_id`) REFERENCES `permissao` (`id`),
  CONSTRAINT `FK_funcionario_permissao_1` FOREIGN KEY (`FK_funcionario_id`) REFERENCES `funcionario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `funcionario_permissao`
--

LOCK TABLES `funcionario_permissao` WRITE;
/*!40000 ALTER TABLE `funcionario_permissao` DISABLE KEYS */;
INSERT INTO `funcionario_permissao` VALUES (NULL,8),(NULL,8),(NULL,8),(NULL,8),(NULL,8),(NULL,8);
/*!40000 ALTER TABLE `funcionario_permissao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `genero`
--

DROP TABLE IF EXISTS `genero`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `genero` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `genero` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `genero`
--

LOCK TABLES `genero` WRITE;
/*!40000 ALTER TABLE `genero` DISABLE KEYS */;
INSERT INTO `genero` VALUES (1,'Romance'),(2,'Fantasia'),(3,'Ficção científica'),(4,'Suspense'),(5,'Drama'),(6,'Aventura'),(7,'Terror'),(8,'Biografia'),(9,'História'),(10,'Autoajuda'),(11,'Religião'),(12,'Didático'),(13,'Infantil'),(14,'Juvenil'),(15,'Poesia'),(16,'Conto'),(17,'Crônica'),(18,'Novela'),(19,'Fábula'),(20,'Farsa'),(21,'Poema'),(22,'Soneto'),(23,'Tragicomédia'),(24,'Tragédia'),(25,'Comédia'),(26,'Épico'),(27,'Ensaio'),(28,'Auto'),(29,'Ação'),(30,'Mistério'),(31,'Romance Policial'),(32,'Romance Histórico'),(33,'Romance de Época'),(34,'Romance Contemporâneo'),(35,'Romance Espírita'),(36,'Romance Juvenil'),(37,'Distopia'),(38,'Mitologia'),(39,'Realismo Fantástico'),(40,'Literatura Infantojuvenil'),(41,'Chick-lit'),(42,'Young Adult'),(43,'Autobiografia'),(44,'Motivacional'),(45,'Espiritualidade'),(46,'Teologia'),(47,'Filosofia'),(48,'Sociologia'),(49,'Psicologia'),(50,'Ciências Humanas'),(51,'Ciências Exatas'),(52,'Ciências Biológicas'),(53,'Administração'),(54,'Marketing'),(55,'Finanças'),(56,'Direito'),(57,'Política'),(58,'Geografia'),(59,'Matemática'),(60,'Física'),(61,'Química'),(62,'Astronomia'),(63,'Saúde'),(64,'Medicina'),(65,'Educação'),(66,'Pedagogia'),(67,'Acadêmico'),(68,'Técnico'),(69,'Profissionalizante'),(70,'Culinária'),(71,'Gastronomia'),(72,'Turismo'),(73,'Moda'),(74,'Design'),(75,'Arte'),(76,'Música'),(77,'Fotografia'),(78,'Arquitetura'),(79,'Engenharia'),(80,'Informática'),(81,'Tecnologia'),(82,'Graphic Novel'),(83,'Mangá'),(84,'HQ'),(85,'Antologia'),(86,'Coletânea'),(87,'Manual'),(88,'Catálogo'),(89,'Ficção'),(90,'Computadores');
/*!40000 ALTER TABLE `genero` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historico`
--

DROP TABLE IF EXISTS `historico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `historico` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `data_leitura` date DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_historico_instituicao` (`FK_instituicao_id`),
  CONSTRAINT `FK_historico_instituicao` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historico`
--

LOCK TABLES `historico` WRITE;
/*!40000 ALTER TABLE `historico` DISABLE KEYS */;
INSERT INTO `historico` VALUES (1,'2025-10-06',1);
/*!40000 ALTER TABLE `historico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historico_indicacao`
--

DROP TABLE IF EXISTS `historico_indicacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `historico_indicacao` (
  `FK_historico_id` int(11) DEFAULT NULL,
  `FK_indicacao_id` int(11) DEFAULT NULL,
  KEY `FK_historico_indicacao_0` (`FK_historico_id`),
  KEY `FK_historico_indicacao_1` (`FK_indicacao_id`),
  CONSTRAINT `FK_historico_indicacao_0` FOREIGN KEY (`FK_historico_id`) REFERENCES `historico` (`id`),
  CONSTRAINT `FK_historico_indicacao_1` FOREIGN KEY (`FK_indicacao_id`) REFERENCES `indicacao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historico_indicacao`
--

LOCK TABLES `historico_indicacao` WRITE;
/*!40000 ALTER TABLE `historico_indicacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `historico_indicacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historico_livro`
--

DROP TABLE IF EXISTS `historico_livro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `historico_livro` (
  `FK_historico_id` int(11) DEFAULT NULL,
  `FK_livro_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historico_livro`
--

LOCK TABLES `historico_livro` WRITE;
/*!40000 ALTER TABLE `historico_livro` DISABLE KEYS */;
INSERT INTO `historico_livro` VALUES (1,6);
/*!40000 ALTER TABLE `historico_livro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historico_usuario`
--

DROP TABLE IF EXISTS `historico_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `historico_usuario` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_historico_id` int(11) DEFAULT NULL,
  KEY `FK_historico_usuario_0` (`FK_usuario_id`),
  KEY `FK_historico_usuario_1` (`FK_historico_id`),
  CONSTRAINT `FK_historico_usuario_0` FOREIGN KEY (`FK_usuario_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `FK_historico_usuario_1` FOREIGN KEY (`FK_historico_id`) REFERENCES `historico` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historico_usuario`
--

LOCK TABLES `historico_usuario` WRITE;
/*!40000 ALTER TABLE `historico_usuario` DISABLE KEYS */;
INSERT INTO `historico_usuario` VALUES (34,1);
/*!40000 ALTER TABLE `historico_usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `indicacao`
--

DROP TABLE IF EXISTS `indicacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `indicacao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `indicacao` varchar(50) DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_indicacao_instituicao` (`FK_instituicao_id`),
  CONSTRAINT `FK_indicacao_instituicao` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `indicacao`
--

LOCK TABLES `indicacao` WRITE;
/*!40000 ALTER TABLE `indicacao` DISABLE KEYS */;
INSERT INTO `indicacao` VALUES (1,'11',1),(2,'11',1),(3,'11',1);
/*!40000 ALTER TABLE `indicacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `indicacao_usuario`
--

DROP TABLE IF EXISTS `indicacao_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `indicacao_usuario` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_indicacao_id` int(11) DEFAULT NULL,
  `FK_curso_id` int(11) DEFAULT NULL,
  `serie` int(11) DEFAULT NULL,
  KEY `FK_indicacao_usuario_0` (`FK_usuario_id`),
  KEY `FK_indicacao_usuario_1` (`FK_indicacao_id`),
  KEY `fk_indicacao_usuario_curso` (`FK_curso_id`),
  CONSTRAINT `FK_indicacao_usuario_0` FOREIGN KEY (`FK_usuario_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `FK_indicacao_usuario_1` FOREIGN KEY (`FK_indicacao_id`) REFERENCES `indicacao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_indicacao_usuario_curso` FOREIGN KEY (`FK_curso_id`) REFERENCES `curso` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `indicacao_usuario`
--

LOCK TABLES `indicacao_usuario` WRITE;
/*!40000 ALTER TABLE `indicacao_usuario` DISABLE KEYS */;
INSERT INTO `indicacao_usuario` VALUES (32,2,1,2),(32,3,2,2);
/*!40000 ALTER TABLE `indicacao_usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `instituicao`
--

DROP TABLE IF EXISTS `instituicao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `instituicao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `FK_tipo_instituicao_id` int(11) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `endereco` varchar(200) DEFAULT NULL,
  `horario_funcionamento` varchar(100) DEFAULT NULL,
  `website` varchar(100) DEFAULT NULL,
  `FK_config_gerais_id` int(11) DEFAULT NULL,
  `FK_config_notificacao_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_instituicao_tipo` (`FK_tipo_instituicao_id`),
  KEY `FK_instituicao_config_gerais` (`FK_config_gerais_id`),
  KEY `FK_instituicao_config_notificacao` (`FK_config_notificacao_id`),
  CONSTRAINT `FK_instituicao_config_gerais` FOREIGN KEY (`FK_config_gerais_id`) REFERENCES `configuracoes_gerais` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_instituicao_config_notificacao` FOREIGN KEY (`FK_config_notificacao_id`) REFERENCES `configuracoes_notificacao` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_instituicao_tipo` FOREIGN KEY (`FK_tipo_instituicao_id`) REFERENCES `tipo_instituicao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `instituicao`
--

LOCK TABLES `instituicao` WRITE;
/*!40000 ALTER TABLE `instituicao` DISABLE KEYS */;
INSERT INTO `instituicao` VALUES (1,'teste etec',3,'testeeteceuro.com.br','1985794623','','8 as 9','',NULL,NULL);
/*!40000 ALTER TABLE `instituicao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lista_desejo`
--

DROP TABLE IF EXISTS `lista_desejo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lista_desejo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lista_desejo` varchar(255) DEFAULT NULL,
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_lista_desejo_usuario` (`FK_usuario_id`),
  KEY `FK_lista_desejo_instituicao` (`FK_instituicao_id`),
  CONSTRAINT `FK_lista_desejo_instituicao` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_lista_desejo_usuario` FOREIGN KEY (`FK_usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lista_desejo`
--

LOCK TABLES `lista_desejo` WRITE;
/*!40000 ALTER TABLE `lista_desejo` DISABLE KEYS */;
/*!40000 ALTER TABLE `lista_desejo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lista_livro`
--

DROP TABLE IF EXISTS `lista_livro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lista_livro` (
  `FK_lista_desejo_id` int(11) DEFAULT NULL,
  `FK_livro_id` int(11) DEFAULT NULL,
  KEY `FK_lista_livro_1` (`FK_lista_desejo_id`),
  KEY `FK_lista_livro_id` (`FK_livro_id`),
  CONSTRAINT `FK_lista_livro_1` FOREIGN KEY (`FK_lista_desejo_id`) REFERENCES `lista_desejo` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FK_lista_livro_id` FOREIGN KEY (`FK_livro_id`) REFERENCES `livro` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lista_livro`
--

LOCK TABLES `lista_livro` WRITE;
/*!40000 ALTER TABLE `lista_livro` DISABLE KEYS */;
/*!40000 ALTER TABLE `lista_livro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `livro`
--

DROP TABLE IF EXISTS `livro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `livro` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `edicao` varchar(20) DEFAULT NULL,
  `capa` varchar(255) DEFAULT NULL,
  `paginas` varchar(20) DEFAULT NULL,
  `quantidade` varchar(20) DEFAULT NULL,
  `local_publicacao` varchar(50) DEFAULT NULL,
  `data_publicacao` date DEFAULT NULL,
  `sinopse` varchar(255) DEFAULT NULL,
  `isbn` varchar(20) NOT NULL,
  `titulo` varchar(200) DEFAULT NULL,
  `cdd` varchar(20) DEFAULT NULL,
  `assunto_discutido` varchar(200) DEFAULT NULL,
  `subtitulo` varchar(200) DEFAULT NULL,
  `volume` varchar(20) DEFAULT NULL,
  `FK_funcionario_id` int(11) DEFAULT NULL,
  `FK_classificacao_id` int(11) DEFAULT NULL,
  `FK_status_id` int(11) DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL,
  `FK_genero_id` int(11) DEFAULT NULL,
  `FK_editora_id` int(11) DEFAULT NULL,
  `FK_autor_id` int(11) DEFAULT NULL,
  `disponivel` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `FK_livro_1` (`FK_funcionario_id`),
  KEY `FK_livro_2` (`FK_classificacao_id`),
  KEY `FK_livro_3` (`FK_status_id`),
  KEY `FK_livro_instituicao` (`FK_instituicao_id`),
  KEY `FK_livro_genero` (`FK_genero_id`),
  KEY `fk_editora` (`FK_editora_id`),
  KEY `fk_livro_autor` (`FK_autor_id`),
  CONSTRAINT `FK_livro_1` FOREIGN KEY (`FK_funcionario_id`) REFERENCES `funcionario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_livro_2` FOREIGN KEY (`FK_classificacao_id`) REFERENCES `classificacao` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_livro_3` FOREIGN KEY (`FK_status_id`) REFERENCES `status` (`id`),
  CONSTRAINT `FK_livro_genero` FOREIGN KEY (`FK_genero_id`) REFERENCES `genero` (`id`),
  CONSTRAINT `FK_livro_instituicao` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_editora` FOREIGN KEY (`FK_editora_id`) REFERENCES `editora` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_livro_autor` FOREIGN KEY (`FK_autor_id`) REFERENCES `autor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `livro`
--

LOCK TABLES `livro` WRITE;
/*!40000 ALTER TABLE `livro` DISABLE KEYS */;
INSERT INTO `livro` VALUES (1,'1','1754168499834.png','186','1','São Paulo','2007-02-10','Bruno, um menino de 9 anos, se muda com a família para uma casa próxima a um campo de concentração nazista. Lá, ele conhece Shmuel, um menino judeu da mesma idade, do outro lado da cerca. Uma amizade proibida e comovente se forma, com consequências trágic','9788574063669','O Menino do Pijama ',NULL,'Holocausto, Segunda Guerra Mundial, amizade, preconceito',NULL,NULL,4,NULL,NULL,1,1,13,NULL,1),(6,'1ª','1757811238700.png','357','4',NULL,'2018-05-01','NESTE LIVRO A AUTORA APRESENTA O FRUTO DE SUAS REFLUSES DESDE que um passageiro da cultura de Massas para a cultura da Míndias Fertilizou o Terreno Sociocultural Para O Surgimento Da Cultura Digital. ','978-85-349-2101-5','Culturas e artes do pós-humano',NULL,'arte,cultura ','Da Cultura Das Míndias à Cibcultura','1',4,NULL,NULL,1,2,24,NULL,0),(11,'1ª','1758059242787.png','926','1','Rio de Janeiro ','2012-01-01','Este livro se propõe um texto abrangente abrangente o moderno estudo de algoritmos para computadores, inclluindo capítulos, exercícios e problemas, revisão de pseudocódigos e um estilo de Redação Mais Claro.','978-85-352-3699-6','Algoritmos e programação',NULL,'numeros,programação','Teoria e Prática','1',4,NULL,NULL,1,1,19,NULL,1),(12,'1ª','1758064651448.png','31','1','São Paulo','2022-01-01','O Elefantinho Nino Sofre Muito com Sua Dificuldade para Dormir. ','9788532271464','Ó Livro Magico',NULL,NULL,NULL,'1',4,NULL,NULL,1,1,26,51,1);
/*!40000 ALTER TABLE `livro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `livro_autor`
--

DROP TABLE IF EXISTS `livro_autor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `livro_autor` (
  `FK_autor_id` int(11) DEFAULT NULL,
  `FK_livro_id` int(11) DEFAULT NULL,
  UNIQUE KEY `FK_autor_id` (`FK_autor_id`,`FK_livro_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `livro_autor`
--

LOCK TABLES `livro_autor` WRITE;
/*!40000 ALTER TABLE `livro_autor` DISABLE KEYS */;
INSERT INTO `livro_autor` VALUES (10,1),(24,6),(48,11),(51,12);
/*!40000 ALTER TABLE `livro_autor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `livro_editora`
--

DROP TABLE IF EXISTS `livro_editora`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `livro_editora` (
  `FK_editora_id` int(11) DEFAULT NULL,
  `FK_livro_id` int(11) DEFAULT NULL,
  KEY `FK_livro_editora_0` (`FK_editora_id`),
  KEY `FK_livro_editora_id` (`FK_livro_id`),
  CONSTRAINT `FK_livro_editora_0` FOREIGN KEY (`FK_editora_id`) REFERENCES `editora` (`id`),
  CONSTRAINT `FK_livro_editora_id` FOREIGN KEY (`FK_livro_id`) REFERENCES `livro` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `livro_editora`
--

LOCK TABLES `livro_editora` WRITE;
/*!40000 ALTER TABLE `livro_editora` DISABLE KEYS */;
/*!40000 ALTER TABLE `livro_editora` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacao`
--

DROP TABLE IF EXISTS `notificacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notificacao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mensagem` varchar(255) DEFAULT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `data_envio` date DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_notificacao_instituicao` (`FK_instituicao_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacao`
--

LOCK TABLES `notificacao` WRITE;
/*!40000 ALTER TABLE `notificacao` DISABLE KEYS */;
INSERT INTO `notificacao` VALUES (1,'Lembretes por E-mail','email','2025-09-04',1),(2,'Lembretes por SMS','sms','2025-09-04',1),(3,'Notificação de atraso','atraso','2025-09-04',1),(4,'Notificação de reserva','reserva','2025-09-04',1);
/*!40000 ALTER TABLE `notificacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacao_emprestimo`
--

DROP TABLE IF EXISTS `notificacao_emprestimo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notificacao_emprestimo` (
  `FK_notificacao_id` int(11) DEFAULT NULL,
  `FK_emprestimo_id` int(11) DEFAULT NULL,
  KEY `FK_notificacao_emprestimo_0` (`FK_notificacao_id`),
  KEY `FK_notificacao_emprestimo_1` (`FK_emprestimo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacao_emprestimo`
--

LOCK TABLES `notificacao_emprestimo` WRITE;
/*!40000 ALTER TABLE `notificacao_emprestimo` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificacao_emprestimo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacao_livro`
--

DROP TABLE IF EXISTS `notificacao_livro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notificacao_livro` (
  `FK_notificacao_id` int(11) DEFAULT NULL,
  `FK_livro_id` int(11) DEFAULT NULL,
  KEY `FK_notificacao_livro_1` (`FK_notificacao_id`),
  KEY `FK_notificacao_livro_id` (`FK_livro_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacao_livro`
--

LOCK TABLES `notificacao_livro` WRITE;
/*!40000 ALTER TABLE `notificacao_livro` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificacao_livro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacao_reserva`
--

DROP TABLE IF EXISTS `notificacao_reserva`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notificacao_reserva` (
  `FK_reserva_id` int(11) DEFAULT NULL,
  `FK_notificacao_id` int(11) DEFAULT NULL,
  KEY `FK_notificacao_reserva_0` (`FK_reserva_id`),
  KEY `FK_notificacao_reserva_1` (`FK_notificacao_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacao_reserva`
--

LOCK TABLES `notificacao_reserva` WRITE;
/*!40000 ALTER TABLE `notificacao_reserva` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificacao_reserva` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissao`
--

DROP TABLE IF EXISTS `permissao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `permissao` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissao`
--

LOCK TABLES `permissao` WRITE;
/*!40000 ALTER TABLE `permissao` DISABLE KEYS */;
INSERT INTO `permissao` VALUES (1,'Administração'),(2,'Circulação'),(3,'Catalogação');
/*!40000 ALTER TABLE `permissao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reserva`
--

DROP TABLE IF EXISTS `reserva`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reserva` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reserva` tinyint(1) DEFAULT NULL,
  `hora_reserva` date DEFAULT NULL,
  `retirada` tinyint(1) DEFAULT NULL,
  `posicao` varchar(20) DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_reserva_instituicao` (`FK_instituicao_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reserva`
--

LOCK TABLES `reserva` WRITE;
/*!40000 ALTER TABLE `reserva` DISABLE KEYS */;
INSERT INTO `reserva` VALUES (1,1,'2025-10-06',0,'1',1);
/*!40000 ALTER TABLE `reserva` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reserva_livro`
--

DROP TABLE IF EXISTS `reserva_livro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reserva_livro` (
  `FK_reserva_id` int(11) DEFAULT NULL,
  `FK_livro_id` int(11) DEFAULT NULL,
  KEY `FK_reserva_livro_1` (`FK_reserva_id`),
  KEY `FK_reserva_livro_id` (`FK_livro_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reserva_livro`
--

LOCK TABLES `reserva_livro` WRITE;
/*!40000 ALTER TABLE `reserva_livro` DISABLE KEYS */;
INSERT INTO `reserva_livro` VALUES (1,6);
/*!40000 ALTER TABLE `reserva_livro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reserva_usuario`
--

DROP TABLE IF EXISTS `reserva_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reserva_usuario` (
  `FK_reserva_id` int(11) DEFAULT NULL,
  `FK_usuario_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reserva_usuario`
--

LOCK TABLES `reserva_usuario` WRITE;
/*!40000 ALTER TABLE `reserva_usuario` DISABLE KEYS */;
INSERT INTO `reserva_usuario` VALUES (1,34);
/*!40000 ALTER TABLE `reserva_usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `status`
--

DROP TABLE IF EXISTS `status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `status`
--

LOCK TABLES `status` WRITE;
/*!40000 ALTER TABLE `status` DISABLE KEYS */;
/*!40000 ALTER TABLE `status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_instituicao`
--

DROP TABLE IF EXISTS `tipo_instituicao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tipo_instituicao` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_instituicao`
--

LOCK TABLES `tipo_instituicao` WRITE;
/*!40000 ALTER TABLE `tipo_instituicao` DISABLE KEYS */;
INSERT INTO `tipo_instituicao` VALUES (1,'Escola'),(2,'Biblioteca Pública'),(3,'Livraria');
/*!40000 ALTER TABLE `tipo_instituicao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipo_usuario`
--

DROP TABLE IF EXISTS `tipo_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tipo_usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipo_usuario`
--

LOCK TABLES `tipo_usuario` WRITE;
/*!40000 ALTER TABLE `tipo_usuario` DISABLE KEYS */;
INSERT INTO `tipo_usuario` VALUES (1,'Aluno'),(2,'Professor'),(3,'Funcionário');
/*!40000 ALTER TABLE `tipo_usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `nome` varchar(200) DEFAULT NULL,
  `senha` varchar(255) DEFAULT NULL,
  `FK_tipo_usuario_id` int(11) DEFAULT NULL,
  `FK_funcionario_id` int(11) DEFAULT NULL,
  `curso_id` int(11) DEFAULT NULL,
  `serie` int(11) DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL,
  `codigo_recuperacao` varchar(10) DEFAULT NULL,
  `expiracao_codigo` datetime DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `ultimo_login` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_usuario_1` (`FK_funcionario_id`),
  KEY `fk_usuario_curso` (`curso_id`),
  KEY `FK_usuario_instituicao` (`FK_instituicao_id`),
  KEY `FK_usuario_tipo` (`FK_tipo_usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (30,'1966258747','cleitindopneu@gmail.com','1757886539725.png','cletin do pneu','$2b$12$r40IXzR66oRxHtuQYIb0JejCaebFefLlNuSptT74Rh1NWbisDj4nu',1,4,3,1,1,NULL,NULL,1,'2025-10-03 08:11:53'),(31,'11988887777','maria.souza@gmail.com','padrao.jpg','Maria Souza','$2b$12$bRgIwXwzzMe1WBD9OfFufe0ggsYOP8UDiSx2olWyhOtIvKmns2hAW',1,4,1,1,1,NULL,NULL,1,'2025-09-16 21:26:13'),(32,'11999996666','joao.pereira@gmail.com','padrao.jpg','João Pereira','$2b$12$BdQh8aZ2vosGRq/dmPNhH.N844Cw5M5Y0.ePnx7rDWVVYkPDRp8I.',2,5,2,2,1,NULL,NULL,1,'2025-10-03 07:27:56'),(34,'11966663333','carlos.santos@gmail.com','padrao.jpg','Carlos Santos','$2b$12$7CCAt7u7Jh9/517iB2sXu.rEZEVaL5ADGSlDcd7k.PWFedAHIVMmS',1,9,1,2,1,NULL,NULL,1,'2025-10-06 13:24:10'),(35,'11955552222','beatriz.mendes@gmail.com','padrao.jpg','Beatriz Mendes','$2b$12$b4uCP5bgVNJi69NEW97n9uGz5BEPnktvMfvc2r3aTcmu6N1Fwm6RO',2,10,2,3,1,NULL,NULL,1,'2025-09-18 19:19:29');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_acessibilidade`
--

DROP TABLE IF EXISTS `usuario_acessibilidade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuario_acessibilidade` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_acessibilidade_id` int(11) DEFAULT NULL,
  KEY `FK_usuario_acessibilidade_0` (`FK_usuario_id`),
  KEY `FK_usuario_acessibilidade_1` (`FK_acessibilidade_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_acessibilidade`
--

LOCK TABLES `usuario_acessibilidade` WRITE;
/*!40000 ALTER TABLE `usuario_acessibilidade` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuario_acessibilidade` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_comentario`
--

DROP TABLE IF EXISTS `usuario_comentario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuario_comentario` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_comentario_id` int(11) DEFAULT NULL,
  KEY `FK_usuario_comentario_0` (`FK_usuario_id`),
  KEY `FK_usuario_comentario_1` (`FK_comentario_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_comentario`
--

LOCK TABLES `usuario_comentario` WRITE;
/*!40000 ALTER TABLE `usuario_comentario` DISABLE KEYS */;
INSERT INTO `usuario_comentario` VALUES (30,1),(30,2),(30,3),(30,4);
/*!40000 ALTER TABLE `usuario_comentario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_curso`
--

DROP TABLE IF EXISTS `usuario_curso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuario_curso` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_curso_id` int(11) DEFAULT NULL,
  KEY `FK_usuario_curso_0` (`FK_usuario_id`),
  KEY `FK_usuario_curso_1` (`FK_curso_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_curso`
--

LOCK TABLES `usuario_curso` WRITE;
/*!40000 ALTER TABLE `usuario_curso` DISABLE KEYS */;
INSERT INTO `usuario_curso` VALUES (13,1),(30,2);
/*!40000 ALTER TABLE `usuario_curso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_emprestimo`
--

DROP TABLE IF EXISTS `usuario_emprestimo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuario_emprestimo` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_emprestimo_id` int(11) DEFAULT NULL,
  KEY `FK_usuario_emprestimo_0` (`FK_usuario_id`),
  KEY `FK_usuario_emprestimo_1` (`FK_emprestimo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_emprestimo`
--

LOCK TABLES `usuario_emprestimo` WRITE;
/*!40000 ALTER TABLE `usuario_emprestimo` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuario_emprestimo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_notificacao`
--

DROP TABLE IF EXISTS `usuario_notificacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usuario_notificacao` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_notificacao_id` int(11) DEFAULT NULL,
  KEY `FK_usuario_notificacao_0` (`FK_usuario_id`),
  KEY `FK_usuario_notificacao_1` (`FK_notificacao_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_notificacao`
--

LOCK TABLES `usuario_notificacao` WRITE;
/*!40000 ALTER TABLE `usuario_notificacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuario_notificacao` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-21 22:37:13
