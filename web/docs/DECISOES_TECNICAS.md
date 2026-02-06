# Decis�es T�cnicas do Projeto

## Arquitetura
- Usamos Next.js com Pages Router
- N�o usamos App Router
- APIs s�o internas (pages/api)

## Organiza��o
- Regras de neg�cio ficam em /lib
- P�ginas n�o devem conter l�gica complexa
- Scripts de migra��o ficam em /scripts

## Dados
- Encontros e eventos t�m ID est�vel
- Migra��es s�o feitas por script, n�o manualmente

## Evolu��o
- Altera��es devem preservar dados existentes
- Novas funcionalidades devem reutilizar lib/

## Conceito anual
- O ano pastoral (ex: 2026, 2027) é uma entidade central do sistema
- Funcionalidades devem considerar reutilização anual do modelo
- Exportações (PDF / livro) são pensadas por ano pastoral