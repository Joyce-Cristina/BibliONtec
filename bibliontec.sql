-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 06/10/2025 às 19:15
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `bibliontec`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `acessibilidade`
--

CREATE TABLE `acessibilidade` (
  `id` int(11) NOT NULL,
  `daltonismo` tinyint(1) DEFAULT NULL,
  `cego` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `autor`
--

CREATE TABLE `autor` (
  `id` int(11) NOT NULL,
  `nome` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `autor`
--

INSERT INTO `autor` (`id`, `nome`) VALUES
(1, 'Machado de Assis'),
(2, 'José de Alencar'),
(3, 'Monteiro Lobato'),
(4, 'Carlos Drummond de Andrade'),
(5, 'Clarice Lispector'),
(6, 'Graciliano Ramos'),
(7, 'Jorge Amado'),
(8, 'Érico Veríssimo'),
(9, 'Ariano Suassuna'),
(10, 'Cecília Meireles'),
(11, 'William Shakespeare'),
(12, 'Victor Hugo'),
(13, 'George Orwell'),
(14, 'Jane Austen'),
(15, 'Franz Kafka'),
(16, 'Fiódor Dostoiévski'),
(17, 'Liev Tolstói'),
(18, 'Charles Dickens'),
(19, 'Edgar Allan Poe'),
(20, 'Gabriel García Márquez'),
(21, 'Stephen King'),
(22, 'J.K. Rowling'),
(23, 'Paulo Coelho'),
(24, 'Agatha Christie'),
(25, 'Dan Brown'),
(26, 'Sun Tzu'),
(27, 'Platão'),
(28, 'Aristóteles'),
(29, 'Jean-Jacques Rousseau'),
(30, 'Karl Marx'),
(31, 'H. P. Lovecraft'),
(32, 'Oscar Wilde'),
(33, 'Mark Twain'),
(34, 'Virginia Woolf'),
(35, 'Emily Brontë'),
(36, 'Herman Melville'),
(37, 'Leo Tolstoy'),
(38, 'Émile Zola'),
(39, 'Sophocles'),
(40, 'Homer'),
(41, 'F. Scott Fitzgerald'),
(42, 'Ernest Hemingway'),
(43, 'John Steinbeck'),
(44, 'Haruki Murakami'),
(45, 'J.R.R. Tolkien'),
(46, 'C.S. Lewis'),
(47, 'Miguel de Cervantes'),
(48, 'Alexandre Dumas'),
(49, 'Anne Rice'),
(50, 'Ralph Ellison'),
(51, 'K.T. HAO'),
(52, 'Nivio Ziviani');

-- --------------------------------------------------------

--
-- Estrutura para tabela `classificacao`
--

CREATE TABLE `classificacao` (
  `id` int(11) NOT NULL,
  `classificacao` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `comentario`
--

CREATE TABLE `comentario` (
  `id` int(11) NOT NULL,
  `comentario` varchar(255) DEFAULT NULL,
  `data_comentario` date DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `comentario`
--

INSERT INTO `comentario` (`id`, `comentario`, `data_comentario`, `FK_instituicao_id`) VALUES
(1, 'adorei', '2025-09-16', NULL),
(2, 'adorei', '2025-09-16', NULL),
(3, 'putta', '2025-09-16', NULL),
(4, '*', '2025-09-16', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `comentario_livro`
--

CREATE TABLE `comentario_livro` (
  `FK_comentario_id` int(11) DEFAULT NULL,
  `FK_livro_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `comentario_livro`
--

INSERT INTO `comentario_livro` (`FK_comentario_id`, `FK_livro_id`) VALUES
(1, 11),
(2, 1),
(3, 1),
(4, 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `configuracoes_gerais`
--

CREATE TABLE `configuracoes_gerais` (
  `id` int(11) NOT NULL,
  `duracao_padrao_emprestimo` int(11) NOT NULL,
  `numero_maximo_renovacoes` int(11) NOT NULL,
  `tempo_retirada_reserva` int(11) NOT NULL,
  `numero_maximo_emprestimos` int(11) NOT NULL,
  `multa_por_atraso` decimal(10,2) NOT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `configuracoes_gerais`
--

INSERT INTO `configuracoes_gerais` (`id`, `duracao_padrao_emprestimo`, `numero_maximo_renovacoes`, `tempo_retirada_reserva`, `numero_maximo_emprestimos`, `multa_por_atraso`, `FK_instituicao_id`) VALUES
(12, 8, 1, 2, 3, 2.00, 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `configuracoes_notificacao`
--

CREATE TABLE `configuracoes_notificacao` (
  `id` int(11) NOT NULL,
  `lembrete_vencimento` tinyint(1) DEFAULT 1,
  `dias_antes_vencimento` int(11) DEFAULT 2,
  `notificacao_atraso` tinyint(1) DEFAULT 1,
  `notificacao_reserva` tinyint(1) DEFAULT 1,
  `notificacao_livro_disponivel` tinyint(1) DEFAULT 1,
  `FK_instituicao_id` int(11) DEFAULT NULL,
  `sms_notificacao` tinyint(4) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `configuracoes_notificacao`
--

INSERT INTO `configuracoes_notificacao` (`id`, `lembrete_vencimento`, `dias_antes_vencimento`, `notificacao_atraso`, `notificacao_reserva`, `notificacao_livro_disponivel`, `FK_instituicao_id`, `sms_notificacao`) VALUES
(4, 0, 4, 1, 1, 1, 1, 0);

-- --------------------------------------------------------

--
-- Estrutura para tabela `configuracoes_tipo_usuario`
--

CREATE TABLE `configuracoes_tipo_usuario` (
  `id` int(11) NOT NULL,
  `FK_tipo_usuario_id` int(11) DEFAULT NULL,
  `maximo_emprestimos` int(11) NOT NULL,
  `duracao_emprestimo` int(11) NOT NULL,
  `pode_reservar` tinyint(1) DEFAULT 0,
  `pode_renovar` tinyint(1) DEFAULT 0,
  `FK_instituicao_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `configuracoes_tipo_usuario`
--

INSERT INTO `configuracoes_tipo_usuario` (`id`, `FK_tipo_usuario_id`, `maximo_emprestimos`, `duracao_emprestimo`, `pode_reservar`, `pode_renovar`, `FK_instituicao_id`) VALUES
(7, 1, 1, 5, 1, 1, 1),
(8, 2, 2, 7, 0, 0, 1),
(9, 3, 2, 7, 1, 1, 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `curso`
--

CREATE TABLE `curso` (
  `id` int(11) NOT NULL,
  `curso` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `curso`
--

INSERT INTO `curso` (`id`, `curso`) VALUES
(1, 'Desenvolvimento de Sistemas'),
(2, 'Administração'),
(3, 'Automação Industrial');

-- --------------------------------------------------------

--
-- Estrutura para tabela `editora`
--

CREATE TABLE `editora` (
  `id` int(11) NOT NULL,
  `editora` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `editora`
--

INSERT INTO `editora` (`id`, `editora`) VALUES
(1, 'Companhia das Letras'),
(2, 'Editora Record'),
(3, 'Saraiva'),
(4, 'Editora Ática'),
(5, 'Globo Livros'),
(6, 'Rocco'),
(7, 'Objetiva'),
(8, 'LeYa'),
(9, 'Principis'),
(10, 'Leya Brasil'),
(11, 'Intrínseca'),
(12, 'BestSeller'),
(13, 'Alfaguara'),
(14, 'HarperCollins'),
(15, 'Penguin Random House'),
(16, 'Oxford University Press'),
(17, 'Cambridge University Press'),
(18, 'Springer'),
(19, 'Elsevier'),
(20, 'Wiley'),
(21, 'Macmillan'),
(22, 'Simon & Schuster'),
(23, 'Hachette Livre'),
(24, 'Bloomsbury'),
(25, 'Editora Moderna'),
(26, 'Editora Positivo'),
(27, 'Scipione'),
(28, 'Zahar'),
(29, 'Fundamento'),
(30, 'Vozes'),
(31, 'Ediouro'),
(32, 'Companhia Editora Nacional'),
(33, 'Editora Martins Fontes'),
(34, 'Editora Paulus'),
(35, 'Editora Loyola'),
(36, 'Editora Cultura'),
(37, 'Editora Record Juvenil'),
(38, 'Editora Callis'),
(39, 'Editora Summus'),
(40, 'Editora Objetiva Infantil');

-- --------------------------------------------------------

--
-- Estrutura para tabela `emprestimo`
--

CREATE TABLE `emprestimo` (
  `fila` varchar(50) DEFAULT NULL,
  `data_emprestimo` date DEFAULT NULL,
  `data_devolucao_prevista` date DEFAULT NULL,
  `data_real_devolucao` date DEFAULT NULL,
  `id` int(11) NOT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL,
  `FK_usuario_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `emprestimo`
--

INSERT INTO `emprestimo` (`fila`, `data_emprestimo`, `data_devolucao_prevista`, `data_real_devolucao`, `id`, `FK_instituicao_id`, `FK_usuario_id`) VALUES
(NULL, '2025-09-16', '2025-09-23', '2025-09-16', 1, 1, 30),
(NULL, '2025-09-16', '2025-09-23', '2025-09-16', 2, NULL, 30),
(NULL, '2025-09-17', '2025-09-25', '2025-09-17', 3, 1, 30),
(NULL, '2025-09-18', '2025-09-26', NULL, 4, 1, 30);

-- --------------------------------------------------------

--
-- Estrutura para tabela `emprestimo_livro`
--

CREATE TABLE `emprestimo_livro` (
  `FK_emprestimo_id` int(11) DEFAULT NULL,
  `FK_livro_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `emprestimo_livro`
--

INSERT INTO `emprestimo_livro` (`FK_emprestimo_id`, `FK_livro_id`) VALUES
(1, 6),
(2, 6),
(3, 1),
(4, 6);

-- --------------------------------------------------------

--
-- Estrutura para tabela `evento`
--

CREATE TABLE `evento` (
  `id` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `data_evento` date NOT NULL,
  `hora_evento` time DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `FK_instituicao_id` int(11) NOT NULL,
  `FK_funcionario_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `funcao`
--

CREATE TABLE `funcao` (
  `id` int(11) NOT NULL,
  `funcao` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `funcao`
--

INSERT INTO `funcao` (`id`, `funcao`) VALUES
(1, 'Administrador'),
(2, 'Bibliotecário'),
(3, 'Circulacao'),
(4, 'Catalogacao');

-- --------------------------------------------------------

--
-- Estrutura para tabela `funcionario`
--

CREATE TABLE `funcionario` (
  `id` int(11) NOT NULL,
  `nome` varchar(200) DEFAULT NULL,
  `senha` varchar(10) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `FK_funcao_id` int(11) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `funcionario`
--

INSERT INTO `funcionario` (`id`, `nome`, `senha`, `email`, `foto`, `FK_funcao_id`, `telefone`, `FK_instituicao_id`) VALUES
(4, 'João Silva dos santos', '123Abc@1', 'joaodograu@gmail.com', '1755194757132.jpg', 2, '11987654328', 1),
(5, 'joao carlos ', '123Abc@1', 'josefina@gmail.com', '1757887433078.jpg', 4, '11987654321', 1),
(8, 'Admin Principal', 'Admin123', 'admin@bibliotec.com', '1757887328295.png', 1, '11999999994', 1),
(9, 'cletin do pneu ', 'e32zy2mK', 'cleitindopneu@gmail.com', '1756407461200.jpg', 3, '74859678541', 1),
(10, 'shaulin porco', 'YvP4t1Ev', 'shaulinmatadordeporco@gmail.com', '1756413188838.jpg', 3, '74859641875', 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `funcionario_acessibilidade`
--

CREATE TABLE `funcionario_acessibilidade` (
  `FK_funcionario_id` int(11) DEFAULT NULL,
  `FK_acessibilidade_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `funcionario_notificacao`
--

CREATE TABLE `funcionario_notificacao` (
  `FK_funcionario_id` int(11) DEFAULT NULL,
  `FK_notificacao_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `funcionario_permissao`
--

CREATE TABLE `funcionario_permissao` (
  `FK_permissao_id` int(11) DEFAULT NULL,
  `FK_funcionario_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `funcionario_permissao`
--

INSERT INTO `funcionario_permissao` (`FK_permissao_id`, `FK_funcionario_id`) VALUES
(NULL, 8),
(NULL, 8),
(NULL, 8),
(NULL, 8),
(NULL, 8),
(NULL, 8);

-- --------------------------------------------------------

--
-- Estrutura para tabela `genero`
--

CREATE TABLE `genero` (
  `id` int(11) NOT NULL,
  `genero` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `genero`
--

INSERT INTO `genero` (`id`, `genero`) VALUES
(1, 'Romance'),
(2, 'Fantasia'),
(3, 'Ficção científica'),
(4, 'Suspense'),
(5, 'Drama'),
(6, 'Aventura'),
(7, 'Terror'),
(8, 'Biografia'),
(9, 'História'),
(10, 'Autoajuda'),
(11, 'Religião'),
(12, 'Didático'),
(13, 'Infantil'),
(14, 'Juvenil'),
(15, 'Poesia'),
(16, 'Conto'),
(17, 'Crônica'),
(18, 'Novela'),
(19, 'Fábula'),
(20, 'Farsa'),
(21, 'Poema'),
(22, 'Soneto'),
(23, 'Tragicomédia'),
(24, 'Tragédia'),
(25, 'Comédia'),
(26, 'Épico'),
(27, 'Ensaio'),
(28, 'Auto'),
(29, 'Ação'),
(30, 'Mistério'),
(31, 'Romance Policial'),
(32, 'Romance Histórico'),
(33, 'Romance de Época'),
(34, 'Romance Contemporâneo'),
(35, 'Romance Espírita'),
(36, 'Romance Juvenil'),
(37, 'Distopia'),
(38, 'Mitologia'),
(39, 'Realismo Fantástico'),
(40, 'Literatura Infantojuvenil'),
(41, 'Chick-lit'),
(42, 'Young Adult'),
(43, 'Autobiografia'),
(44, 'Motivacional'),
(45, 'Espiritualidade'),
(46, 'Teologia'),
(47, 'Filosofia'),
(48, 'Sociologia'),
(49, 'Psicologia'),
(50, 'Ciências Humanas'),
(51, 'Ciências Exatas'),
(52, 'Ciências Biológicas'),
(53, 'Administração'),
(54, 'Marketing'),
(55, 'Finanças'),
(56, 'Direito'),
(57, 'Política'),
(58, 'Geografia'),
(59, 'Matemática'),
(60, 'Física'),
(61, 'Química'),
(62, 'Astronomia'),
(63, 'Saúde'),
(64, 'Medicina'),
(65, 'Educação'),
(66, 'Pedagogia'),
(67, 'Acadêmico'),
(68, 'Técnico'),
(69, 'Profissionalizante'),
(70, 'Culinária'),
(71, 'Gastronomia'),
(72, 'Turismo'),
(73, 'Moda'),
(74, 'Design'),
(75, 'Arte'),
(76, 'Música'),
(77, 'Fotografia'),
(78, 'Arquitetura'),
(79, 'Engenharia'),
(80, 'Informática'),
(81, 'Tecnologia'),
(82, 'Graphic Novel'),
(83, 'Mangá'),
(84, 'HQ'),
(85, 'Antologia'),
(86, 'Coletânea'),
(87, 'Manual'),
(88, 'Catálogo'),
(89, 'Ficção'),
(90, 'Computadores');

-- --------------------------------------------------------

--
-- Estrutura para tabela `historico`
--

CREATE TABLE `historico` (
  `id` int(11) NOT NULL,
  `data_leitura` date DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `historico`
--

INSERT INTO `historico` (`id`, `data_leitura`, `FK_instituicao_id`) VALUES
(1, '2025-10-06', 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `historico_indicacao`
--

CREATE TABLE `historico_indicacao` (
  `FK_historico_id` int(11) DEFAULT NULL,
  `FK_indicacao_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `historico_livro`
--

CREATE TABLE `historico_livro` (
  `FK_historico_id` int(11) DEFAULT NULL,
  `FK_livro_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `historico_livro`
--

INSERT INTO `historico_livro` (`FK_historico_id`, `FK_livro_id`) VALUES
(1, 6);

-- --------------------------------------------------------

--
-- Estrutura para tabela `historico_usuario`
--

CREATE TABLE `historico_usuario` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_historico_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `historico_usuario`
--

INSERT INTO `historico_usuario` (`FK_usuario_id`, `FK_historico_id`) VALUES
(34, 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `indicacao`
--

CREATE TABLE `indicacao` (
  `id` int(11) NOT NULL,
  `indicacao` varchar(50) DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `indicacao`
--

INSERT INTO `indicacao` (`id`, `indicacao`, `FK_instituicao_id`) VALUES
(1, '11', 1),
(2, '11', 1),
(3, '11', 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `indicacao_usuario`
--

CREATE TABLE `indicacao_usuario` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_indicacao_id` int(11) DEFAULT NULL,
  `FK_curso_id` int(11) DEFAULT NULL,
  `serie` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `indicacao_usuario`
--

INSERT INTO `indicacao_usuario` (`FK_usuario_id`, `FK_indicacao_id`, `FK_curso_id`, `serie`) VALUES
(32, 2, 1, 2),
(32, 3, 2, 2);

-- --------------------------------------------------------

--
-- Estrutura para tabela `instituicao`
--

CREATE TABLE `instituicao` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `FK_tipo_instituicao_id` int(11) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `endereco` varchar(200) DEFAULT NULL,
  `horario_funcionamento` varchar(100) DEFAULT NULL,
  `website` varchar(100) DEFAULT NULL,
  `FK_config_gerais_id` int(11) DEFAULT NULL,
  `FK_config_notificacao_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `instituicao`
--

INSERT INTO `instituicao` (`id`, `nome`, `FK_tipo_instituicao_id`, `email`, `telefone`, `endereco`, `horario_funcionamento`, `website`, `FK_config_gerais_id`, `FK_config_notificacao_id`) VALUES
(1, 'teste etec', 3, 'testeeteceuro.com.br', '1985794623', '', '8 as 9', '', NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `lista_desejo`
--

CREATE TABLE `lista_desejo` (
  `id` int(11) NOT NULL,
  `lista_desejo` varchar(255) DEFAULT NULL,
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `lista_livro`
--

CREATE TABLE `lista_livro` (
  `FK_lista_desejo_id` int(11) DEFAULT NULL,
  `FK_livro_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `livro`
--

CREATE TABLE `livro` (
  `id` int(11) NOT NULL,
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
  `disponivel` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `livro`
--

INSERT INTO `livro` (`id`, `edicao`, `capa`, `paginas`, `quantidade`, `local_publicacao`, `data_publicacao`, `sinopse`, `isbn`, `titulo`, `cdd`, `assunto_discutido`, `subtitulo`, `volume`, `FK_funcionario_id`, `FK_classificacao_id`, `FK_status_id`, `FK_instituicao_id`, `FK_genero_id`, `FK_editora_id`, `FK_autor_id`, `disponivel`) VALUES
(1, '1', '1754168499834.png', '186', '1', 'São Paulo', '2007-02-10', 'Bruno, um menino de 9 anos, se muda com a família para uma casa próxima a um campo de concentração nazista. Lá, ele conhece Shmuel, um menino judeu da mesma idade, do outro lado da cerca. Uma amizade proibida e comovente se forma, com consequências trágic', '9788574063669', 'O Menino do Pijama ', NULL, 'Holocausto, Segunda Guerra Mundial, amizade, preconceito', NULL, NULL, 4, NULL, NULL, 1, 1, 13, NULL, 1),
(6, '1ª', '1757811238700.png', '357', '4', NULL, '2018-05-01', 'NESTE LIVRO A AUTORA APRESENTA O FRUTO DE SUAS REFLUSES DESDE que um passageiro da cultura de Massas para a cultura da Míndias Fertilizou o Terreno Sociocultural Para O Surgimento Da Cultura Digital. ', '978-85-349-2101-5', 'Culturas e artes do pós-humano', NULL, 'arte,cultura ', 'Da Cultura Das Míndias à Cibcultura', '1', 4, NULL, NULL, 1, 2, 24, NULL, 0),
(11, '1ª', '1758059242787.png', '926', '1', 'Rio de Janeiro ', '2012-01-01', 'Este livro se propõe um texto abrangente abrangente o moderno estudo de algoritmos para computadores, inclluindo capítulos, exercícios e problemas, revisão de pseudocódigos e um estilo de Redação Mais Claro.', '978-85-352-3699-6', 'Algoritmos e programação', NULL, 'numeros,programação', 'Teoria e Prática', '1', 4, NULL, NULL, 1, 1, 19, NULL, 1),
(12, '1ª', '1758064651448.png', '31', '1', 'São Paulo', '2022-01-01', 'O Elefantinho Nino Sofre Muito com Sua Dificuldade para Dormir. ', '9788532271464', 'Ó Livro Magico', NULL, NULL, NULL, '1', 4, NULL, NULL, 1, 1, 26, 51, 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `livro_autor`
--

CREATE TABLE `livro_autor` (
  `FK_autor_id` int(11) DEFAULT NULL,
  `FK_livro_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `livro_autor`
--

INSERT INTO `livro_autor` (`FK_autor_id`, `FK_livro_id`) VALUES
(10, 1),
(24, 6),
(48, 11),
(51, 12);

-- --------------------------------------------------------

--
-- Estrutura para tabela `livro_editora`
--

CREATE TABLE `livro_editora` (
  `FK_editora_id` int(11) DEFAULT NULL,
  `FK_livro_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `notificacao`
--

CREATE TABLE `notificacao` (
  `id` int(11) NOT NULL,
  `mensagem` varchar(255) DEFAULT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `data_envio` date DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `notificacao`
--

INSERT INTO `notificacao` (`id`, `mensagem`, `tipo`, `data_envio`, `FK_instituicao_id`) VALUES
(1, 'Lembretes por E-mail', 'email', '2025-09-04', 1),
(2, 'Lembretes por SMS', 'sms', '2025-09-04', 1),
(3, 'Notificação de atraso', 'atraso', '2025-09-04', 1),
(4, 'Notificação de reserva', 'reserva', '2025-09-04', 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `notificacao_emprestimo`
--

CREATE TABLE `notificacao_emprestimo` (
  `FK_notificacao_id` int(11) DEFAULT NULL,
  `FK_emprestimo_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `notificacao_livro`
--

CREATE TABLE `notificacao_livro` (
  `FK_notificacao_id` int(11) DEFAULT NULL,
  `FK_livro_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `notificacao_reserva`
--

CREATE TABLE `notificacao_reserva` (
  `FK_reserva_id` int(11) DEFAULT NULL,
  `FK_notificacao_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `permissao`
--

CREATE TABLE `permissao` (
  `id` int(11) NOT NULL,
  `permissao` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `permissao`
--

INSERT INTO `permissao` (`id`, `permissao`) VALUES
(1, 'Administração'),
(2, 'Circulação'),
(3, 'Catalogação');

-- --------------------------------------------------------

--
-- Estrutura para tabela `reserva`
--

CREATE TABLE `reserva` (
  `id` int(11) NOT NULL,
  `reserva` tinyint(1) DEFAULT NULL,
  `hora_reserva` date DEFAULT NULL,
  `retirada` tinyint(1) DEFAULT NULL,
  `posicao` varchar(20) DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `reserva`
--

INSERT INTO `reserva` (`id`, `reserva`, `hora_reserva`, `retirada`, `posicao`, `FK_instituicao_id`) VALUES
(1, 1, '2025-10-06', 0, '1', 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `reserva_livro`
--

CREATE TABLE `reserva_livro` (
  `FK_reserva_id` int(11) DEFAULT NULL,
  `FK_livro_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `reserva_livro`
--

INSERT INTO `reserva_livro` (`FK_reserva_id`, `FK_livro_id`) VALUES
(1, 6);

-- --------------------------------------------------------

--
-- Estrutura para tabela `reserva_usuario`
--

CREATE TABLE `reserva_usuario` (
  `FK_reserva_id` int(11) DEFAULT NULL,
  `FK_usuario_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `reserva_usuario`
--

INSERT INTO `reserva_usuario` (`FK_reserva_id`, `FK_usuario_id`) VALUES
(1, 34);

-- --------------------------------------------------------

--
-- Estrutura para tabela `status`
--

CREATE TABLE `status` (
  `id` int(11) NOT NULL,
  `status` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tipo_instituicao`
--

CREATE TABLE `tipo_instituicao` (
  `id` int(11) NOT NULL,
  `tipo` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `tipo_instituicao`
--

INSERT INTO `tipo_instituicao` (`id`, `tipo`) VALUES
(1, 'Escola'),
(2, 'Biblioteca Pública'),
(3, 'Livraria');

-- --------------------------------------------------------

--
-- Estrutura para tabela `tipo_usuario`
--

CREATE TABLE `tipo_usuario` (
  `id` int(11) NOT NULL,
  `tipo` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `tipo_usuario`
--

INSERT INTO `tipo_usuario` (`id`, `tipo`) VALUES
(1, 'Aluno'),
(2, 'Professor'),
(3, 'Funcionário');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario`
--

CREATE TABLE `usuario` (
  `id` int(11) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `nome` varchar(200) DEFAULT NULL,
  `senha` varchar(10) DEFAULT NULL,
  `FK_tipo_usuario_id` int(11) DEFAULT NULL,
  `FK_funcionario_id` int(11) DEFAULT NULL,
  `curso_id` int(11) DEFAULT NULL,
  `serie` int(11) DEFAULT NULL,
  `FK_instituicao_id` int(11) DEFAULT NULL,
  `codigo_recuperacao` varchar(10) DEFAULT NULL,
  `expiracao_codigo` datetime DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `ultimo_login` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuario`
--

INSERT INTO `usuario` (`id`, `telefone`, `email`, `foto`, `nome`, `senha`, `FK_tipo_usuario_id`, `FK_funcionario_id`, `curso_id`, `serie`, `FK_instituicao_id`, `codigo_recuperacao`, `expiracao_codigo`, `ativo`, `ultimo_login`) VALUES
(30, '1966258747', 'cleitindopneu@gmail.com', '1757886539725.png', 'cletin do pneu', 'Abc1235', 1, 4, 3, 1, 1, NULL, NULL, 1, '2025-10-03 08:11:53'),
(31, '11988887777', 'maria.souza@gmail.com', 'padrao.jpg', 'Maria Souza', 'Abc12345', 1, 4, 1, 1, 1, NULL, NULL, 1, '2025-09-16 21:26:13'),
(32, '11999996666', 'joao.pereira@gmail.com', 'padrao.jpg', 'João Pereira', 'SenhaSegur', 2, 5, 2, 2, 1, NULL, NULL, 1, '2025-10-03 07:27:56'),
(33, '11977774444', 'ana.lima@gmail.com', 'padrao.jpg', 'Ana Lima', 'Teste@2025', 3, 8, 3, 1, 1, NULL, NULL, 1, '2025-10-03 08:11:26'),
(34, '11966663333', 'carlos.santos@gmail.com', 'padrao.jpg', 'Carlos Santos', 'Xyz78910', 1, 9, 1, 2, 1, NULL, NULL, 1, '2025-10-06 13:24:10'),
(35, '11955552222', 'beatriz.mendes@gmail.com', 'padrao.jpg', 'Beatriz Mendes', 'Qwe123Rt', 2, 10, 2, 3, 1, NULL, NULL, 1, '2025-09-18 19:19:29');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario_acessibilidade`
--

CREATE TABLE `usuario_acessibilidade` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_acessibilidade_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario_comentario`
--

CREATE TABLE `usuario_comentario` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_comentario_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuario_comentario`
--

INSERT INTO `usuario_comentario` (`FK_usuario_id`, `FK_comentario_id`) VALUES
(30, 1),
(30, 2),
(30, 3),
(30, 4);

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario_curso`
--

CREATE TABLE `usuario_curso` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_curso_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuario_curso`
--

INSERT INTO `usuario_curso` (`FK_usuario_id`, `FK_curso_id`) VALUES
(13, 1),
(30, 2);

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario_emprestimo`
--

CREATE TABLE `usuario_emprestimo` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_emprestimo_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario_notificacao`
--

CREATE TABLE `usuario_notificacao` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_notificacao_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `acessibilidade`
--
ALTER TABLE `acessibilidade`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `autor`
--
ALTER TABLE `autor`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `classificacao`
--
ALTER TABLE `classificacao`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `comentario`
--
ALTER TABLE `comentario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_comentario_instituicao` (`FK_instituicao_id`);

--
-- Índices de tabela `comentario_livro`
--
ALTER TABLE `comentario_livro`
  ADD KEY `FK_comentario_livro_1` (`FK_comentario_id`),
  ADD KEY `FK_comentario_livro_id` (`FK_livro_id`);

--
-- Índices de tabela `configuracoes_gerais`
--
ALTER TABLE `configuracoes_gerais`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `FK_instituicao_id` (`FK_instituicao_id`);

--
-- Índices de tabela `configuracoes_notificacao`
--
ALTER TABLE `configuracoes_notificacao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_instituicao_id` (`FK_instituicao_id`);

--
-- Índices de tabela `configuracoes_tipo_usuario`
--
ALTER TABLE `configuracoes_tipo_usuario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_tipo_usuario_id` (`FK_tipo_usuario_id`);

--
-- Índices de tabela `curso`
--
ALTER TABLE `curso`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `editora`
--
ALTER TABLE `editora`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `emprestimo`
--
ALTER TABLE `emprestimo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_emprestimo_instituicao` (`FK_instituicao_id`),
  ADD KEY `fk_emprestimo_usuario` (`FK_usuario_id`);

--
-- Índices de tabela `emprestimo_livro`
--
ALTER TABLE `emprestimo_livro`
  ADD KEY `FK_emprestimo_livro_1` (`FK_emprestimo_id`),
  ADD KEY `FK_emprestimo_livro_id` (`FK_livro_id`);

--
-- Índices de tabela `evento`
--
ALTER TABLE `evento`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_instituicao_id` (`FK_instituicao_id`),
  ADD KEY `FK_funcionario_id` (`FK_funcionario_id`);

--
-- Índices de tabela `funcao`
--
ALTER TABLE `funcao`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `funcionario`
--
ALTER TABLE `funcionario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_funcionario_1` (`FK_funcao_id`),
  ADD KEY `FK_funcionario_instituicao` (`FK_instituicao_id`);

--
-- Índices de tabela `funcionario_acessibilidade`
--
ALTER TABLE `funcionario_acessibilidade`
  ADD KEY `FK_funcionario_acessibilidade_0` (`FK_funcionario_id`),
  ADD KEY `FK_funcionario_acessibilidade_1` (`FK_acessibilidade_id`);

--
-- Índices de tabela `funcionario_notificacao`
--
ALTER TABLE `funcionario_notificacao`
  ADD KEY `FK_funcionario_notificacao_0` (`FK_funcionario_id`),
  ADD KEY `FK_funcionario_notificacao_1` (`FK_notificacao_id`);

--
-- Índices de tabela `funcionario_permissao`
--
ALTER TABLE `funcionario_permissao`
  ADD KEY `FK_funcionario_permissao_0` (`FK_permissao_id`),
  ADD KEY `FK_funcionario_permissao_1` (`FK_funcionario_id`);

--
-- Índices de tabela `genero`
--
ALTER TABLE `genero`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `historico`
--
ALTER TABLE `historico`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_historico_instituicao` (`FK_instituicao_id`);

--
-- Índices de tabela `historico_indicacao`
--
ALTER TABLE `historico_indicacao`
  ADD KEY `FK_historico_indicacao_0` (`FK_historico_id`),
  ADD KEY `FK_historico_indicacao_1` (`FK_indicacao_id`);

--
-- Índices de tabela `historico_usuario`
--
ALTER TABLE `historico_usuario`
  ADD KEY `FK_historico_usuario_0` (`FK_usuario_id`),
  ADD KEY `FK_historico_usuario_1` (`FK_historico_id`);

--
-- Índices de tabela `indicacao`
--
ALTER TABLE `indicacao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_indicacao_instituicao` (`FK_instituicao_id`);

--
-- Índices de tabela `indicacao_usuario`
--
ALTER TABLE `indicacao_usuario`
  ADD KEY `FK_indicacao_usuario_0` (`FK_usuario_id`),
  ADD KEY `FK_indicacao_usuario_1` (`FK_indicacao_id`),
  ADD KEY `fk_indicacao_usuario_curso` (`FK_curso_id`);

--
-- Índices de tabela `instituicao`
--
ALTER TABLE `instituicao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_instituicao_tipo` (`FK_tipo_instituicao_id`),
  ADD KEY `FK_instituicao_config_gerais` (`FK_config_gerais_id`),
  ADD KEY `FK_instituicao_config_notificacao` (`FK_config_notificacao_id`);

--
-- Índices de tabela `lista_desejo`
--
ALTER TABLE `lista_desejo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_lista_desejo_usuario` (`FK_usuario_id`),
  ADD KEY `FK_lista_desejo_instituicao` (`FK_instituicao_id`);

--
-- Índices de tabela `lista_livro`
--
ALTER TABLE `lista_livro`
  ADD KEY `FK_lista_livro_1` (`FK_lista_desejo_id`),
  ADD KEY `FK_lista_livro_id` (`FK_livro_id`);

--
-- Índices de tabela `livro`
--
ALTER TABLE `livro`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_livro_1` (`FK_funcionario_id`),
  ADD KEY `FK_livro_2` (`FK_classificacao_id`),
  ADD KEY `FK_livro_3` (`FK_status_id`),
  ADD KEY `FK_livro_instituicao` (`FK_instituicao_id`),
  ADD KEY `FK_livro_genero` (`FK_genero_id`),
  ADD KEY `fk_editora` (`FK_editora_id`),
  ADD KEY `fk_livro_autor` (`FK_autor_id`);

--
-- Índices de tabela `livro_autor`
--
ALTER TABLE `livro_autor`
  ADD UNIQUE KEY `FK_autor_id` (`FK_autor_id`,`FK_livro_id`);

--
-- Índices de tabela `livro_editora`
--
ALTER TABLE `livro_editora`
  ADD KEY `FK_livro_editora_0` (`FK_editora_id`),
  ADD KEY `FK_livro_editora_id` (`FK_livro_id`);

--
-- Índices de tabela `notificacao`
--
ALTER TABLE `notificacao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_notificacao_instituicao` (`FK_instituicao_id`);

--
-- Índices de tabela `notificacao_emprestimo`
--
ALTER TABLE `notificacao_emprestimo`
  ADD KEY `FK_notificacao_emprestimo_0` (`FK_notificacao_id`),
  ADD KEY `FK_notificacao_emprestimo_1` (`FK_emprestimo_id`);

--
-- Índices de tabela `notificacao_livro`
--
ALTER TABLE `notificacao_livro`
  ADD KEY `FK_notificacao_livro_1` (`FK_notificacao_id`),
  ADD KEY `FK_notificacao_livro_id` (`FK_livro_id`);

--
-- Índices de tabela `notificacao_reserva`
--
ALTER TABLE `notificacao_reserva`
  ADD KEY `FK_notificacao_reserva_0` (`FK_reserva_id`),
  ADD KEY `FK_notificacao_reserva_1` (`FK_notificacao_id`);

--
-- Índices de tabela `permissao`
--
ALTER TABLE `permissao`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `reserva`
--
ALTER TABLE `reserva`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_reserva_instituicao` (`FK_instituicao_id`);

--
-- Índices de tabela `reserva_livro`
--
ALTER TABLE `reserva_livro`
  ADD KEY `FK_reserva_livro_1` (`FK_reserva_id`),
  ADD KEY `FK_reserva_livro_id` (`FK_livro_id`);

--
-- Índices de tabela `status`
--
ALTER TABLE `status`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `tipo_instituicao`
--
ALTER TABLE `tipo_instituicao`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `tipo_usuario`
--
ALTER TABLE `tipo_usuario`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_usuario_1` (`FK_funcionario_id`),
  ADD KEY `fk_usuario_curso` (`curso_id`),
  ADD KEY `FK_usuario_instituicao` (`FK_instituicao_id`),
  ADD KEY `FK_usuario_tipo` (`FK_tipo_usuario_id`);

--
-- Índices de tabela `usuario_acessibilidade`
--
ALTER TABLE `usuario_acessibilidade`
  ADD KEY `FK_usuario_acessibilidade_0` (`FK_usuario_id`),
  ADD KEY `FK_usuario_acessibilidade_1` (`FK_acessibilidade_id`);

--
-- Índices de tabela `usuario_comentario`
--
ALTER TABLE `usuario_comentario`
  ADD KEY `FK_usuario_comentario_0` (`FK_usuario_id`),
  ADD KEY `FK_usuario_comentario_1` (`FK_comentario_id`);

--
-- Índices de tabela `usuario_curso`
--
ALTER TABLE `usuario_curso`
  ADD KEY `FK_usuario_curso_0` (`FK_usuario_id`),
  ADD KEY `FK_usuario_curso_1` (`FK_curso_id`);

--
-- Índices de tabela `usuario_emprestimo`
--
ALTER TABLE `usuario_emprestimo`
  ADD KEY `FK_usuario_emprestimo_0` (`FK_usuario_id`),
  ADD KEY `FK_usuario_emprestimo_1` (`FK_emprestimo_id`);

--
-- Índices de tabela `usuario_notificacao`
--
ALTER TABLE `usuario_notificacao`
  ADD KEY `FK_usuario_notificacao_0` (`FK_usuario_id`),
  ADD KEY `FK_usuario_notificacao_1` (`FK_notificacao_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `acessibilidade`
--
ALTER TABLE `acessibilidade`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `autor`
--
ALTER TABLE `autor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT de tabela `classificacao`
--
ALTER TABLE `classificacao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `comentario`
--
ALTER TABLE `comentario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `configuracoes_gerais`
--
ALTER TABLE `configuracoes_gerais`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de tabela `configuracoes_notificacao`
--
ALTER TABLE `configuracoes_notificacao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `configuracoes_tipo_usuario`
--
ALTER TABLE `configuracoes_tipo_usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de tabela `curso`
--
ALTER TABLE `curso`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `editora`
--
ALTER TABLE `editora`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT de tabela `emprestimo`
--
ALTER TABLE `emprestimo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `evento`
--
ALTER TABLE `evento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `funcao`
--
ALTER TABLE `funcao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de tabela `funcionario`
--
ALTER TABLE `funcionario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de tabela `genero`
--
ALTER TABLE `genero`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT de tabela `historico`
--
ALTER TABLE `historico`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `indicacao`
--
ALTER TABLE `indicacao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `instituicao`
--
ALTER TABLE `instituicao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `lista_desejo`
--
ALTER TABLE `lista_desejo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `livro`
--
ALTER TABLE `livro`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de tabela `notificacao`
--
ALTER TABLE `notificacao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `permissao`
--
ALTER TABLE `permissao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `reserva`
--
ALTER TABLE `reserva`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `status`
--
ALTER TABLE `status`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `tipo_instituicao`
--
ALTER TABLE `tipo_instituicao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `tipo_usuario`
--
ALTER TABLE `tipo_usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=38;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `comentario`
--
ALTER TABLE `comentario`
  ADD CONSTRAINT `FK_comentario_instituicao` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `comentario_livro`
--
ALTER TABLE `comentario_livro`
  ADD CONSTRAINT `FK_comentario_livro_1` FOREIGN KEY (`FK_comentario_id`) REFERENCES `comentario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_comentario_livro_id` FOREIGN KEY (`FK_livro_id`) REFERENCES `livro` (`id`);

--
-- Restrições para tabelas `configuracoes_gerais`
--
ALTER TABLE `configuracoes_gerais`
  ADD CONSTRAINT `configuracoes_gerais_ibfk_1` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `configuracoes_notificacao`
--
ALTER TABLE `configuracoes_notificacao`
  ADD CONSTRAINT `configuracoes_notificacao_ibfk_1` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `configuracoes_tipo_usuario`
--
ALTER TABLE `configuracoes_tipo_usuario`
  ADD CONSTRAINT `configuracoes_tipo_usuario_ibfk_1` FOREIGN KEY (`FK_tipo_usuario_id`) REFERENCES `tipo_usuario` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `emprestimo`
--
ALTER TABLE `emprestimo`
  ADD CONSTRAINT `FK_emprestimo_instituicao` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_emprestimo_usuario` FOREIGN KEY (`FK_usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `emprestimo_livro`
--
ALTER TABLE `emprestimo_livro`
  ADD CONSTRAINT `FK_emprestimo_livro_1` FOREIGN KEY (`FK_emprestimo_id`) REFERENCES `emprestimo` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_emprestimo_livro_id` FOREIGN KEY (`FK_livro_id`) REFERENCES `livro` (`id`);

--
-- Restrições para tabelas `evento`
--
ALTER TABLE `evento`
  ADD CONSTRAINT `evento_ibfk_1` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`),
  ADD CONSTRAINT `evento_ibfk_2` FOREIGN KEY (`FK_funcionario_id`) REFERENCES `funcionario` (`id`);

--
-- Restrições para tabelas `funcionario`
--
ALTER TABLE `funcionario`
  ADD CONSTRAINT `FK_funcionario_1` FOREIGN KEY (`FK_funcao_id`) REFERENCES `funcao` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_funcionario_instituicao` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `funcionario_acessibilidade`
--
ALTER TABLE `funcionario_acessibilidade`
  ADD CONSTRAINT `FK_funcionario_acessibilidade_0` FOREIGN KEY (`FK_funcionario_id`) REFERENCES `funcionario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_funcionario_acessibilidade_1` FOREIGN KEY (`FK_acessibilidade_id`) REFERENCES `acessibilidade` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `funcionario_notificacao`
--
ALTER TABLE `funcionario_notificacao`
  ADD CONSTRAINT `FK_funcionario_notificacao_0` FOREIGN KEY (`FK_funcionario_id`) REFERENCES `funcionario` (`id`),
  ADD CONSTRAINT `FK_funcionario_notificacao_1` FOREIGN KEY (`FK_notificacao_id`) REFERENCES `notificacao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `funcionario_permissao`
--
ALTER TABLE `funcionario_permissao`
  ADD CONSTRAINT `FK_funcionario_permissao_0` FOREIGN KEY (`FK_permissao_id`) REFERENCES `permissao` (`id`),
  ADD CONSTRAINT `FK_funcionario_permissao_1` FOREIGN KEY (`FK_funcionario_id`) REFERENCES `funcionario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `historico`
--
ALTER TABLE `historico`
  ADD CONSTRAINT `FK_historico_instituicao` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `historico_indicacao`
--
ALTER TABLE `historico_indicacao`
  ADD CONSTRAINT `FK_historico_indicacao_0` FOREIGN KEY (`FK_historico_id`) REFERENCES `historico` (`id`),
  ADD CONSTRAINT `FK_historico_indicacao_1` FOREIGN KEY (`FK_indicacao_id`) REFERENCES `indicacao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `historico_usuario`
--
ALTER TABLE `historico_usuario`
  ADD CONSTRAINT `FK_historico_usuario_0` FOREIGN KEY (`FK_usuario_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_historico_usuario_1` FOREIGN KEY (`FK_historico_id`) REFERENCES `historico` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `indicacao`
--
ALTER TABLE `indicacao`
  ADD CONSTRAINT `FK_indicacao_instituicao` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `indicacao_usuario`
--
ALTER TABLE `indicacao_usuario`
  ADD CONSTRAINT `FK_indicacao_usuario_0` FOREIGN KEY (`FK_usuario_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_indicacao_usuario_1` FOREIGN KEY (`FK_indicacao_id`) REFERENCES `indicacao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_indicacao_usuario_curso` FOREIGN KEY (`FK_curso_id`) REFERENCES `curso` (`id`);

--
-- Restrições para tabelas `instituicao`
--
ALTER TABLE `instituicao`
  ADD CONSTRAINT `FK_instituicao_config_gerais` FOREIGN KEY (`FK_config_gerais_id`) REFERENCES `configuracoes_gerais` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_instituicao_config_notificacao` FOREIGN KEY (`FK_config_notificacao_id`) REFERENCES `configuracoes_notificacao` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_instituicao_tipo` FOREIGN KEY (`FK_tipo_instituicao_id`) REFERENCES `tipo_instituicao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `lista_desejo`
--
ALTER TABLE `lista_desejo`
  ADD CONSTRAINT `FK_lista_desejo_instituicao` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_lista_desejo_usuario` FOREIGN KEY (`FK_usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Restrições para tabelas `lista_livro`
--
ALTER TABLE `lista_livro`
  ADD CONSTRAINT `FK_lista_livro_1` FOREIGN KEY (`FK_lista_desejo_id`) REFERENCES `lista_desejo` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_lista_livro_id` FOREIGN KEY (`FK_livro_id`) REFERENCES `livro` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `livro`
--
ALTER TABLE `livro`
  ADD CONSTRAINT `FK_livro_1` FOREIGN KEY (`FK_funcionario_id`) REFERENCES `funcionario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_livro_2` FOREIGN KEY (`FK_classificacao_id`) REFERENCES `classificacao` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_livro_3` FOREIGN KEY (`FK_status_id`) REFERENCES `status` (`id`),
  ADD CONSTRAINT `FK_livro_genero` FOREIGN KEY (`FK_genero_id`) REFERENCES `genero` (`id`),
  ADD CONSTRAINT `FK_livro_instituicao` FOREIGN KEY (`FK_instituicao_id`) REFERENCES `instituicao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_editora` FOREIGN KEY (`FK_editora_id`) REFERENCES `editora` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_livro_autor` FOREIGN KEY (`FK_autor_id`) REFERENCES `autor` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `livro_editora`
--
ALTER TABLE `livro_editora`
  ADD CONSTRAINT `FK_livro_editora_0` FOREIGN KEY (`FK_editora_id`) REFERENCES `editora` (`id`),
  ADD CONSTRAINT `FK_livro_editora_id` FOREIGN KEY (`FK_livro_id`) REFERENCES `livro` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
