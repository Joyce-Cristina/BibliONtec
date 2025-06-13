-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 14/06/2025 às 01:33
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
  `codigo_autor` int(11) NOT NULL,
  `autor` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `data_comentario` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `comentario_livro`
--

CREATE TABLE `comentario_livro` (
  `FK_livro_isbn` varchar(20) DEFAULT NULL,
  `FK_comentario_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `curso`
--

CREATE TABLE `curso` (
  `id` int(11) NOT NULL,
  `curso` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `editora`
--

CREATE TABLE `editora` (
  `id` int(11) NOT NULL,
  `editora` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `emprestimo`
--

CREATE TABLE `emprestimo` (
  `fila` varchar(50) DEFAULT NULL,
  `data_emprestimo` date DEFAULT NULL,
  `data_devolucao_prevista` date DEFAULT NULL,
  `data_real_devolucao` date DEFAULT NULL,
  `id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `emprestimo_livro`
--

CREATE TABLE `emprestimo_livro` (
  `FK_livro_isbn` varchar(20) DEFAULT NULL,
  `FK_emprestimo_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `funcao`
--

CREATE TABLE `funcao` (
  `id` int(11) NOT NULL,
  `funcao` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `FK_funcao_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

-- --------------------------------------------------------

--
-- Estrutura para tabela `historico`
--

CREATE TABLE `historico` (
  `id` int(11) NOT NULL,
  `data_leitura` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Estrutura para tabela `historico_usuario`
--

CREATE TABLE `historico_usuario` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_historico_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `indicacao`
--

CREATE TABLE `indicacao` (
  `id` int(11) NOT NULL,
  `indicacao` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `indicacao_usuario`
--

CREATE TABLE `indicacao_usuario` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_indicacao_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `lista_desejo`
--

CREATE TABLE `lista_desejo` (
  `id` int(11) NOT NULL,
  `FK_usuario_id` int(11) NOT NULL,
  `FK_livro_isbn` varchar(13) NOT NULL,
  `data_adicao` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `lista_livro`
--

CREATE TABLE `lista_livro` (
  `FK_livro_isbn` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `livro`
--

CREATE TABLE `livro` (
  `edicao` varchar(20) DEFAULT NULL,
  `capa` varchar(255) DEFAULT NULL,
  `paginas` varchar(20) DEFAULT NULL,
  `quantidade` varchar(20) DEFAULT NULL,
  `local_publicacao` varchar(50) DEFAULT NULL,
  `data_publicacao` date DEFAULT NULL,
  `sinopse` varchar(255) DEFAULT NULL,
  `isbn` varchar(20) NOT NULL,
  `titulo` varchar(200) DEFAULT NULL,
  `assunto_discutido` varchar(200) DEFAULT NULL,
  `subtitulo` varchar(200) DEFAULT NULL,
  `volume` varchar(20) DEFAULT NULL,
  `genero` varchar(20) DEFAULT NULL,
  `FK_funcionario_id` int(11) DEFAULT NULL,
  `FK_classificacao_id` int(11) DEFAULT NULL,
  `FK_status_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `livro_autor`
--

CREATE TABLE `livro_autor` (
  `FK_autor_codigo_autor` int(11) DEFAULT NULL,
  `FK_livro_isbn` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `livro_editora`
--

CREATE TABLE `livro_editora` (
  `FK_editora_id` int(11) DEFAULT NULL,
  `FK_livro_isbn` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `notificacao`
--

CREATE TABLE `notificacao` (
  `id` int(11) NOT NULL,
  `mensagem` varchar(255) DEFAULT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `data_envio` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `FK_livro_isbn` varchar(20) DEFAULT NULL,
  `FK_notificacao_id` int(11) DEFAULT NULL
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

-- --------------------------------------------------------

--
-- Estrutura para tabela `reserva`
--

CREATE TABLE `reserva` (
  `id` int(11) NOT NULL,
  `reserva` tinyint(1) DEFAULT NULL,
  `hora_reserva` date DEFAULT NULL,
  `retirada` tinyint(1) DEFAULT NULL,
  `posicao` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `reserva_livro`
--

CREATE TABLE `reserva_livro` (
  `FK_livro_isbn` varchar(20) DEFAULT NULL,
  `FK_reserva_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
-- Estrutura para tabela `tipo_usuario`
--

CREATE TABLE `tipo_usuario` (
  `id` int(11) NOT NULL,
  `tipo` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `tipo_usuario`
--

INSERT INTO `tipo_usuario` (`id`, `tipo`) VALUES
(1, 'Aluno'),
(2, 'Professor');

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
  `FK_funcionario_id` int(11) DEFAULT NULL,
  `FK_tipo_usuario_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuario_curso`
--

CREATE TABLE `usuario_curso` (
  `FK_usuario_id` int(11) DEFAULT NULL,
  `FK_curso_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  ADD PRIMARY KEY (`codigo_autor`);

--
-- Índices de tabela `classificacao`
--
ALTER TABLE `classificacao`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `comentario`
--
ALTER TABLE `comentario`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `comentario_livro`
--
ALTER TABLE `comentario_livro`
  ADD KEY `FK_comentario_livro_0` (`FK_livro_isbn`),
  ADD KEY `FK_comentario_livro_1` (`FK_comentario_id`);

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
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `emprestimo_livro`
--
ALTER TABLE `emprestimo_livro`
  ADD KEY `FK_emprestimo_livro_0` (`FK_livro_isbn`),
  ADD KEY `FK_emprestimo_livro_1` (`FK_emprestimo_id`);

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
  ADD KEY `FK_funcionario_1` (`FK_funcao_id`);

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
-- Índices de tabela `historico`
--
ALTER TABLE `historico`
  ADD PRIMARY KEY (`id`);

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
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `indicacao_usuario`
--
ALTER TABLE `indicacao_usuario`
  ADD KEY `FK_indicacao_usuario_0` (`FK_usuario_id`),
  ADD KEY `FK_indicacao_usuario_1` (`FK_indicacao_id`);

--
-- Índices de tabela `lista_desejo`
--
ALTER TABLE `lista_desejo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_usuario_id` (`FK_usuario_id`),
  ADD KEY `FK_livro_isbn` (`FK_livro_isbn`);

--
-- Índices de tabela `lista_livro`
--
ALTER TABLE `lista_livro`
  ADD KEY `FK_lista_livro_0` (`FK_livro_isbn`);

--
-- Índices de tabela `livro`
--
ALTER TABLE `livro`
  ADD PRIMARY KEY (`isbn`),
  ADD KEY `FK_livro_1` (`FK_funcionario_id`),
  ADD KEY `FK_livro_2` (`FK_classificacao_id`),
  ADD KEY `FK_livro_3` (`FK_status_id`);

--
-- Índices de tabela `livro_autor`
--
ALTER TABLE `livro_autor`
  ADD KEY `FK_livro_autor_0` (`FK_autor_codigo_autor`),
  ADD KEY `FK_livro_autor_1` (`FK_livro_isbn`);

--
-- Índices de tabela `livro_editora`
--
ALTER TABLE `livro_editora`
  ADD KEY `FK_livro_editora_0` (`FK_editora_id`),
  ADD KEY `FK_livro_editora_1` (`FK_livro_isbn`);

--
-- Índices de tabela `notificacao`
--
ALTER TABLE `notificacao`
  ADD PRIMARY KEY (`id`);

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
  ADD KEY `FK_notificacao_livro_0` (`FK_livro_isbn`),
  ADD KEY `FK_notificacao_livro_1` (`FK_notificacao_id`);

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
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `reserva_livro`
--
ALTER TABLE `reserva_livro`
  ADD KEY `FK_reserva_livro_0` (`FK_livro_isbn`),
  ADD KEY `FK_reserva_livro_1` (`FK_reserva_id`);

--
-- Índices de tabela `status`
--
ALTER TABLE `status`
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
  ADD KEY `fk_usuario_tipo_usuario` (`FK_tipo_usuario_id`);

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
-- AUTO_INCREMENT de tabela `comentario`
--
ALTER TABLE `comentario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `curso`
--
ALTER TABLE `curso`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `funcao`
--
ALTER TABLE `funcao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `funcionario`
--
ALTER TABLE `funcionario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `historico`
--
ALTER TABLE `historico`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `indicacao`
--
ALTER TABLE `indicacao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `lista_desejo`
--
ALTER TABLE `lista_desejo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `notificacao`
--
ALTER TABLE `notificacao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `permissao`
--
ALTER TABLE `permissao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `tipo_usuario`
--
ALTER TABLE `tipo_usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `comentario_livro`
--
ALTER TABLE `comentario_livro`
  ADD CONSTRAINT `FK_comentario_livro_0` FOREIGN KEY (`FK_livro_isbn`) REFERENCES `livro` (`isbn`),
  ADD CONSTRAINT `FK_comentario_livro_1` FOREIGN KEY (`FK_comentario_id`) REFERENCES `comentario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `emprestimo_livro`
--
ALTER TABLE `emprestimo_livro`
  ADD CONSTRAINT `FK_emprestimo_livro_0` FOREIGN KEY (`FK_livro_isbn`) REFERENCES `livro` (`isbn`),
  ADD CONSTRAINT `FK_emprestimo_livro_1` FOREIGN KEY (`FK_emprestimo_id`) REFERENCES `emprestimo` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `funcionario`
--
ALTER TABLE `funcionario`
  ADD CONSTRAINT `FK_funcionario_1` FOREIGN KEY (`FK_funcao_id`) REFERENCES `funcao` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
-- Restrições para tabelas `indicacao_usuario`
--
ALTER TABLE `indicacao_usuario`
  ADD CONSTRAINT `FK_indicacao_usuario_0` FOREIGN KEY (`FK_usuario_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_indicacao_usuario_1` FOREIGN KEY (`FK_indicacao_id`) REFERENCES `indicacao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `lista_desejo`
--
ALTER TABLE `lista_desejo`
  ADD CONSTRAINT `lista_desejo_ibfk_1` FOREIGN KEY (`FK_usuario_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `lista_desejo_ibfk_2` FOREIGN KEY (`FK_livro_isbn`) REFERENCES `livro` (`isbn`);

--
-- Restrições para tabelas `lista_livro`
--
ALTER TABLE `lista_livro`
  ADD CONSTRAINT `FK_lista_livro_0` FOREIGN KEY (`FK_livro_isbn`) REFERENCES `livro` (`isbn`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `livro`
--
ALTER TABLE `livro`
  ADD CONSTRAINT `FK_livro_1` FOREIGN KEY (`FK_funcionario_id`) REFERENCES `funcionario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_livro_2` FOREIGN KEY (`FK_classificacao_id`) REFERENCES `classificacao` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_livro_3` FOREIGN KEY (`FK_status_id`) REFERENCES `status` (`id`);

--
-- Restrições para tabelas `livro_autor`
--
ALTER TABLE `livro_autor`
  ADD CONSTRAINT `FK_livro_autor_0` FOREIGN KEY (`FK_autor_codigo_autor`) REFERENCES `autor` (`codigo_autor`),
  ADD CONSTRAINT `FK_livro_autor_1` FOREIGN KEY (`FK_livro_isbn`) REFERENCES `livro` (`isbn`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `livro_editora`
--
ALTER TABLE `livro_editora`
  ADD CONSTRAINT `FK_livro_editora_0` FOREIGN KEY (`FK_editora_id`) REFERENCES `editora` (`id`),
  ADD CONSTRAINT `FK_livro_editora_1` FOREIGN KEY (`FK_livro_isbn`) REFERENCES `livro` (`isbn`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `notificacao_emprestimo`
--
ALTER TABLE `notificacao_emprestimo`
  ADD CONSTRAINT `FK_notificacao_emprestimo_0` FOREIGN KEY (`FK_notificacao_id`) REFERENCES `notificacao` (`id`),
  ADD CONSTRAINT `FK_notificacao_emprestimo_1` FOREIGN KEY (`FK_emprestimo_id`) REFERENCES `emprestimo` (`id`);

--
-- Restrições para tabelas `notificacao_livro`
--
ALTER TABLE `notificacao_livro`
  ADD CONSTRAINT `FK_notificacao_livro_0` FOREIGN KEY (`FK_livro_isbn`) REFERENCES `livro` (`isbn`),
  ADD CONSTRAINT `FK_notificacao_livro_1` FOREIGN KEY (`FK_notificacao_id`) REFERENCES `notificacao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `notificacao_reserva`
--
ALTER TABLE `notificacao_reserva`
  ADD CONSTRAINT `FK_notificacao_reserva_0` FOREIGN KEY (`FK_reserva_id`) REFERENCES `reserva` (`id`),
  ADD CONSTRAINT `FK_notificacao_reserva_1` FOREIGN KEY (`FK_notificacao_id`) REFERENCES `notificacao` (`id`);

--
-- Restrições para tabelas `reserva_livro`
--
ALTER TABLE `reserva_livro`
  ADD CONSTRAINT `FK_reserva_livro_0` FOREIGN KEY (`FK_livro_isbn`) REFERENCES `livro` (`isbn`),
  ADD CONSTRAINT `FK_reserva_livro_1` FOREIGN KEY (`FK_reserva_id`) REFERENCES `reserva` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `usuario`
--
ALTER TABLE `usuario`
  ADD CONSTRAINT `FK_usuario_1` FOREIGN KEY (`FK_funcionario_id`) REFERENCES `funcionario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_usuario_tipo_usuario` FOREIGN KEY (`FK_tipo_usuario_id`) REFERENCES `tipo_usuario` (`id`);

--
-- Restrições para tabelas `usuario_acessibilidade`
--
ALTER TABLE `usuario_acessibilidade`
  ADD CONSTRAINT `FK_usuario_acessibilidade_0` FOREIGN KEY (`FK_usuario_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `FK_usuario_acessibilidade_1` FOREIGN KEY (`FK_acessibilidade_id`) REFERENCES `acessibilidade` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `usuario_comentario`
--
ALTER TABLE `usuario_comentario`
  ADD CONSTRAINT `FK_usuario_comentario_0` FOREIGN KEY (`FK_usuario_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_usuario_comentario_1` FOREIGN KEY (`FK_comentario_id`) REFERENCES `comentario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `usuario_curso`
--
ALTER TABLE `usuario_curso`
  ADD CONSTRAINT `FK_usuario_curso_0` FOREIGN KEY (`FK_usuario_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_usuario_curso_1` FOREIGN KEY (`FK_curso_id`) REFERENCES `curso` (`id`);

--
-- Restrições para tabelas `usuario_emprestimo`
--
ALTER TABLE `usuario_emprestimo`
  ADD CONSTRAINT `FK_usuario_emprestimo_0` FOREIGN KEY (`FK_usuario_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_usuario_emprestimo_1` FOREIGN KEY (`FK_emprestimo_id`) REFERENCES `emprestimo` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Restrições para tabelas `usuario_notificacao`
--
ALTER TABLE `usuario_notificacao`
  ADD CONSTRAINT `FK_usuario_notificacao_0` FOREIGN KEY (`FK_usuario_id`) REFERENCES `usuario` (`id`),
  ADD CONSTRAINT `FK_usuario_notificacao_1` FOREIGN KEY (`FK_notificacao_id`) REFERENCES `notificacao` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
