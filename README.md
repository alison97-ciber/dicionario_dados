# Dicionário de Dados - Barbearia MF

Dicionário de Dados interativo do **Sistema Integrado de Gestão e Agendamento** da Barbearia MF, elaborado com foco em governança de dados (DAMA-DMBOK e COBIT). Projeto da disciplina de Modelagem de Banco de Dados, curso de Análise e Desenvolvimento de Sistemas, Universidade Cidade de São Paulo.

**Acesse online:** `https://SEU_USUARIO.github.io/NOME_DO_REPOSITORIO/` (substitua pelos dados do seu repositório).

## Sobre o projeto

A Barbearia MF atua em serviços de barbearia e cuidados masculinos, em uma única unidade, e atende mediante agendamento prévio registrado pela equipe. O sistema centraliza clientes e dependentes, barbeiros, serviços, produtos e insumos, e permite registrar, consultar, remarcar, cancelar e concluir agendamentos. Também registra pagamentos por atendimento, controla movimentações e estoque mínimo, gerencia acessos por perfil e mantém a trilha de auditoria.

Fora do escopo: gestão financeira, cobrança online, documentos fiscais, autoagendamento pelo cliente e integração com WhatsApp.

## O que o dicionário contém

- 15 tabelas e 101 colunas, conforme o script DDL.
- Para cada atributo: descrição e regra de negócio, tipo e tamanho, constraints (`[PK]`, `[FK]`, `[NOT NULL]`, `[NULL]`, `[UNIQUE]`), classificação de privacidade LGPD (`DPS`, `DP`, `N/A`), linhagem (origem e destino) e controle de acesso (RBAC).
- Menu lateral com todas as tabelas, responsivo para celulares.
- Busca em tempo real por nome de tabela ou de coluna.
- Modo claro e escuro.
- Visualizador do DER em tela cheia, com zoom por scroll, arrastar para navegar e botões Zoom +, Zoom - e Reset (Panzoom.js).
- Download da Especificação de Requisitos e Regras de Negócio em PDF.

## Tecnologias

- HTML5, CSS3 e JavaScript puro (sem build e sem dependências locais).
- [Panzoom](https://github.com/timmywil/panzoom) 4.5.1, carregado via CDN jsDelivr.
- Banco de dados documentado: MySQL 8.4 LTS, InnoDB.

## Estrutura do repositório

```text
.
├── index.html
├── style.css
├── script.js
├── docs/
│   └── Especificacao_Requisitos_Regras_Negocio_BD.pdf
└── assets/
    └── der.png
```

## Alterando o conteúdo

Os dados do dicionário ficam na constante `TABELAS` do arquivo `script.js`. Cada coluna é uma lista com: atributo, descrição, tipo, constraints, privacidade, linhagem e controle de acesso. Se o DDL mudar, atualize essa constante e republique.

## Equipe (Grupo 7)

| Integrante | Responsabilidade |
|---|---|
| Albert dos Santos Mariano | Requisitos funcionais, não funcionais e regras de negócio |
| Alessandra Guimarães da Silva | Líder do grupo; Qualidade Técnica e Dicionário |
| Alison Belen Condori Mayta | Entidades de dados e restrições de integridade |
| Davi Pereira de Oliveira Silva | Requisitos funcionais, não funcionais e regras de negócio |
| Ellen Cristina Soares de Jesus | Introdução, escopo e revisão |
| Giovana Moura Alves da Silva | Requisitos funcionais, não funcionais e regras de negócio |
| João Pedro Theodoro de Sousa Andrade | Representante do cliente (Barbearia MF); introdução e escopo |
| Petterson Michel Lima Aguilar | Entidades de dados e restrições de integridade |
| Samuel Carmoni de Oliveira | Entidades de dados e restrições de integridade |
| Samuel Guimarães da Silva | Analista de requisitos e de negócio |

**Orientador:** Prof. Dr. Diego Carvalho.

## Observações

- O dicionário documenta o DDL entregue. As colunas em que o DDL diverge da especificação (por exemplo, domínios numéricos no lugar de códigos textuais) estão sinalizadas nas descrições.
- Dados pessoais foram classificados conforme a LGPD (Lei nº 13.709/2018). Nenhum atributo foi classificado como dado pessoal sensível.

## Licença e uso

Projeto acadêmico, sem fins comerciais.
