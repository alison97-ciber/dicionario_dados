"use strict";

/* Perfis de acesso (RBAC) reutilizados nas colunas */
const AC = {
  BARB: "ADMINISTRADOR: leitura e escrita. BARBEIRO: consulta do próprio cadastro.",
  CLI: "ADMINISTRADOR: leitura e escrita. BARBEIRO: consulta apenas do necessário aos próprios atendimentos.",
  CAT: "ADMINISTRADOR: leitura e escrita. BARBEIRO: somente consulta.",
  AGE: "ADMINISTRADOR: criar, consultar, remarcar, cancelar e concluir. BARBEIRO: consulta da agenda; cancelar, concluir e ajustar duração apenas dos próprios.",
  PAG: "ADMINISTRADOR: registrar, consultar e corrigir (rotina controlada). BARBEIRO: registrar e consultar apenas dos próprios atendimentos.",
  EST: "ADMINISTRADOR: entradas, ajustes e consulta. BARBEIRO: consulta de saldo e alerta; baixa apenas pela rotina de conclusão.",
  USR: "ADMINISTRADOR: criar, inativar, redefinir senha e desbloquear. BARBEIRO: autenticar e alterar a própria senha.",
  SEC: "Somente rotinas de autenticação do sistema. Nenhum perfil consulta o valor.",
  ADM: "ADMINISTRADOR: leitura e escrita. BARBEIRO: sem acesso.",
  AUD: "ADMINISTRADOR: somente leitura. Aplicação: apenas INSERT por trigger/rotina; UPDATE e DELETE negados."
};

/* Colunas: [atributo, descrição/regra, tipo, constraints, privacidade, linhagem, rbac] */
const TABELAS = [
{ n:"barbeiro", d:"Profissional que presta os serviços da barbearia; o dono também é cadastrado como barbeiro. Máximo de 4 barbeiros ativos (RN17).", c:[
 ["id_barbeiro","Identificador único do barbeiro (chave substituta).","INT","[PK] [AUTO_INCREMENT] [NOT NULL]","N/A","Origem: gerado pelo SGBD. Destino: FK em disponibilidade_barbeiro, usuario e agendamento.",AC.BARB],
 ["nome","Nome do barbeiro; obrigatório.","VARCHAR(100)","[NOT NULL]","DP","Origem: cadastro do administrador (RF02). Destino: consultas de agenda.",AC.BARB],
 ["cpf","CPF com 11 dígitos, dígito verificador validado por trigger/rotina e único entre barbeiros.","CHAR(11)","[NOT NULL] [UNIQUE]","DP","Origem: cadastro do administrador (RF02). Destino: consulta administrativa.",AC.ADM],
 ["telefone","Telefone com DDD, 10 ou 11 dígitos, somente números.","VARCHAR(11)","[NOT NULL]","DP","Origem: cadastro do administrador (RF02). Destino: contato interno.",AC.BARB],
 ["ativo","Exclusão lógica: 1 ativo, 0 inativo. Inativação bloqueada com agendamento AGENDADO (RN17).","TINYINT(1)","[NOT NULL]","N/A","Origem: administrador. Destino: validações de agendamento e de usuario.ativo.",AC.BARB],
 ["data_cadastro","Data e hora de criação do registro, gerada pelo servidor (RN12).","DATETIME","[NOT NULL]","N/A","Origem: servidor. Destino: auditoria e consulta.",AC.BARB]
]},
{ n:"disponibilidade_barbeiro", d:"Faixas semanais de disponibilidade do barbeiro, dentro do funcionamento de segunda a sábado, 09h às 21h (RN08).", c:[
 ["id_disponibilidade_barbeiro","Identificador da faixa de disponibilidade.","INT","[PK] [AUTO_INCREMENT] [NOT NULL]","N/A","Origem: gerado pelo SGBD. Destino: apenas identificação.",AC.BARB],
 ["dia_semana","Dia da semana da faixa (segunda a sábado; domingo vedado). No DDL é numérico; a especificação prevê SEG a SAB.","INT","[NOT NULL]","N/A","Origem: administrador (RF02). Destino: validação de agendamento (RN08).",AC.BARB],
 ["hora_inicio","Início da faixa; deve ser menor que hora_fim e a partir de 09:00.","TIME","[NOT NULL]","N/A","Origem: administrador (RF02). Destino: validação de agendamento.",AC.BARB],
 ["hora_fim","Fim da faixa; até 21:00 e sem sobreposição com outras faixas do barbeiro.","TIME","[NOT NULL]","N/A","Origem: administrador (RF02). Destino: validação de agendamento.",AC.BARB],
 ["barbeiro_id_barbeiro","Barbeiro dono da faixa.","INT","[PK] [FK -> barbeiro.id_barbeiro] [NOT NULL]","N/A","Origem: barbeiro. Destino: relacionamento N:1.",AC.BARB]
]},
{ n:"cliente", d:"Pessoa atendida pela barbearia; titular dos dados pessoais para fins da LGPD. Capacidade de até 1.500 clientes.", c:[
 ["id_cliente","Identificador único do cliente.","INT","[PK] [AUTO_INCREMENT] [NOT NULL]","N/A","Origem: gerado pelo SGBD. Destino: FK em dependente, agendamento e solicitacao_titular.",AC.CLI],
 ["nome","Nome do cliente; obrigatório. Substituído por valor neutro em neutralização aprovada (RF10).","VARCHAR(100)","[NOT NULL]","DP","Origem: cadastro do administrador (RF01). Destino: agenda e consultas.",AC.CLI],
 ["telefone","Telefone com DDD (10 ou 11 dígitos), único por cliente. Após neutralização, token ANON-<id_cliente>.","VARCHAR(15)","[NOT NULL] [UNIQUE]","DP","Origem: cadastro do administrador (RF01). Destino: contato operacional externo.",AC.CLI],
 ["ativo","Exclusão lógica: 1 ativo, 0 inativo; inativo não recebe novos agendamentos (RN14).","TINYINT(1)","[NOT NULL]","N/A","Origem: administrador. Destino: validação de novos agendamentos.",AC.CLI],
 ["data_cadastro","Data e hora de criação do registro, gerada pelo servidor.","DATETIME","[NOT NULL]","N/A","Origem: servidor. Destino: auditoria.",AC.CLI]
]},
{ n:"dependente", d:"Dependente vinculado a um cliente responsável; guarda apenas o nome e o estado do consentimento (LGPD art. 14, dados de crianças).", c:[
 ["id_dependente","Identificador único do dependente.","INT","[PK] [AUTO_INCREMENT] [NOT NULL]","N/A","Origem: gerado pelo SGBD. Destino: FK em agendamento.",AC.CLI],
 ["nome","Nome do dependente; obrigatório. Sem telefone próprio.","VARCHAR(100)","[NOT NULL]","DP","Origem: cadastro do administrador (RF01). Destino: agenda.",AC.CLI],
 ["consentimento_responsavel_confirmado","NULL: não se aplica; 0: exigido e não confirmado; 1: confirmado. Com 0, o dependente não entra em agendamento nem remarcação (RN02).","TINYINT(1)","[NULL]","DP","Origem: administrador, após avaliação externa da base legal. Destino: validação do agendamento.",AC.CLI],
 ["data_consentimento_responsavel","Data do consentimento; preenchida somente quando o estado for 1.","DATETIME","[NULL]","DP","Origem: administrador (RF01/RF10). Destino: evidência de consentimento.",AC.CLI],
 ["ativo","Exclusão lógica do dependente.","TINYINT(1)","[NOT NULL]","N/A","Origem: administrador. Destino: validação de novos agendamentos.",AC.CLI],
 ["data_cadastro","Data e hora de criação do registro, gerada pelo servidor.","DATETIME","[NOT NULL]","N/A","Origem: servidor. Destino: auditoria.",AC.CLI],
 ["cliente_id_cliente","Cliente responsável pelo dependente.","INT","[PK] [FK -> cliente.id_cliente] [NOT NULL]","N/A","Origem: cliente. Destino: relacionamento N:1.",AC.CLI]
]},
{ n:"usuario", d:"Credencial de acesso de um barbeiro, com perfil ADMINISTRADOR (dono) ou BARBEIRO. Controle de bloqueio por tentativas falhas (RF07).", c:[
 ["id_usuario","Identificador único do usuário; usado como autor nas tabelas de auditoria e movimentação.","INT","[PK] [AUTO_INCREMENT] [NOT NULL]","N/A","Origem: gerado pelo SGBD. Destino: FK em agendamento, pagamento, movimentacao_estoque, solicitacao_titular e log_auditoria.",AC.USR],
 ["nome_usuario","Nome de login único.","VARCHAR(50)","[NOT NULL] [UNIQUE]","DP","Origem: administrador (RF07). Destino: autenticação.",AC.USR],
 ["senha_hash","Hash seguro (Argon2id ou bcrypt), mínimo de 10 caracteres na origem; nunca em texto simples nem em logs.","VARCHAR(255)","[NOT NULL]","DP","Origem: back-end, a partir da senha informada. Destino: validação de login.",AC.SEC],
 ["nivel_acesso","Perfil de acesso: ADMINISTRADOR ou BARBEIRO. No DDL é numérico; a especificação prevê códigos textuais.","INT","[NOT NULL]","N/A","Origem: administrador (RF07). Destino: RBAC na aplicação.",AC.USR],
 ["ativo","Exclusão lógica; sincronizado com barbeiro.ativo (RN17).","TINYINT(1)","[NOT NULL]","N/A","Origem: administrador ou rotina de inativação de barbeiro. Destino: autenticação.",AC.USR],
 ["tentativas_login_falhas","Contador de falhas consecutivas; zerado após login válido; 5 falhas bloqueiam por 15 minutos.","INT","[NOT NULL]","N/A","Origem: rotina de autenticação. Destino: regra de bloqueio.",AC.USR],
 ["data_hora_fim_bloqueio","Fim do bloqueio temporário (quinta falha mais 15 minutos); NULL sem bloqueio.","DATETIME","[NULL]","N/A","Origem: rotina de autenticação. Destino: validação de login.",AC.USR],
 ["data_hora_ultimo_acesso","Data e hora do último login bem-sucedido.","DATETIME","[NULL]","DP","Origem: rotina de autenticação. Destino: consulta administrativa.",AC.USR],
 ["data_cadastro","Data e hora de criação do usuário, gerada pelo servidor.","DATETIME","[NOT NULL]","N/A","Origem: servidor. Destino: auditoria.",AC.USR],
 ["barbeiro_id_barbeiro","Barbeiro associado; cada usuário vincula-se a exatamente um barbeiro (RN11).","INT","[PK] [FK -> barbeiro.id_barbeiro] [NOT NULL]","N/A","Origem: barbeiro. Destino: relacionamento N:1.",AC.USR]
]},
{ n:"agendamento", d:"Registro de atendimento previamente agendado; representa o atendimento em todo o ciclo AGENDADO, CONCLUIDO, CANCELADO ou NAO_COMPARECEU.", c:[
 ["id_agendamento","Identificador único do agendamento.","INT","[PK] [AUTO_INCREMENT] [NOT NULL]","N/A","Origem: gerado pelo SGBD. Destino: FK em item_agendamento, pagamento e movimentacao_estoque.",AC.AGE],
 ["data_hora_agendamento","Início previsto do atendimento; deve ser futuro na criação e na remarcação, de segunda a sábado, a partir de 09h (RN08, RN12).","DATETIME","[NOT NULL]","N/A","Origem: administrador (RF04). Destino: agenda e validação de sobreposição.",AC.AGE],
 ["duracao_total_minutos","Duração efetiva: max(45, soma dos itens), entre 45 e 720 minutos; ajustável pelo responsável (RN09).","INT","[NOT NULL]","N/A","Origem: calculada pela rotina de registro; ajuste manual (RF05). Destino: data_hora_fim.",AC.AGE],
 ["data_hora_fim","Término do atendimento = início + duração; até 21h.","DATETIME","[NOT NULL]","N/A","Origem: calculada pela rotina. Destino: validação de sobreposição.",AC.AGE],
 ["data_hora_solicitacao","Momento de criação do registro, gerado pelo servidor; não retrodatável (RN12).","DATETIME","[NOT NULL]","N/A","Origem: servidor. Destino: auditoria.",AC.AGE],
 ["status","Estado: AGENDADO, CONCLUIDO, CANCELADO ou NAO_COMPARECEU. No DDL é numérico; a especificação prevê códigos textuais (RN13).","INT","[NOT NULL]","N/A","Origem: rotinas de mudança de estado (RF05). Destino: reservas de estoque e pagamento.",AC.AGE],
 ["data_hora_cancelamento","Preenchida somente quando CANCELADO, sempre antes do início (PR02).","DATETIME","[NULL]","N/A","Origem: rotina de cancelamento. Destino: histórico.",AC.AGE],
 ["cliente_id_cliente","Cliente do agendamento; ativo na criação.","INT","[PK] [FK -> cliente.id_cliente] [NOT NULL]","N/A","Origem: cliente. Destino: relacionamento N:1.",AC.AGE],
 ["barbeiro_id_barbeiro","Barbeiro responsável pelo atendimento; ativo na criação.","INT","[PK] [FK -> barbeiro.id_barbeiro] [NOT NULL]","N/A","Origem: barbeiro. Destino: agenda do barbeiro.",AC.AGE],
 ["dependente_id_dependente","Dependente atendido; deve pertencer ao mesmo cliente. No DDL é obrigatório; a especificação o define como opcional.","INT","[PK] [FK -> dependente.id_dependente] [NOT NULL]","DP","Origem: dependente. Destino: relacionamento N:1.",AC.AGE],
 ["usuario_id_usuario","Usuário que registrou o agendamento (id_usuario_registro na especificação).","INT","[PK] [FK -> usuario.id_usuario] [NOT NULL]","N/A","Origem: sessão autenticada validada pelo back-end. Destino: rastreabilidade.",AC.AGE]
]},
{ n:"servico", d:"Catálogo de serviços oferecidos pela barbearia, com valor e duração padrão.", c:[
 ["id_servico","Identificador único do serviço.","INT","[PK] [AUTO_INCREMENT] [NOT NULL]","N/A","Origem: gerado pelo SGBD. Destino: FK em item_agendamento e servico_produto.",AC.CAT],
 ["nome","Nome do serviço, único.","VARCHAR(100)","[NOT NULL] [UNIQUE]","N/A","Origem: catálogo (RF03). Destino: snapshot em item_agendamento.nome_servico.",AC.CAT],
 ["valor","Valor atual do serviço, maior que zero; alterações não afetam itens históricos (RN03).","DECIMAL(10,2)","[NOT NULL]","N/A","Origem: catálogo (RF03). Destino: snapshot em item_agendamento.valor_cobrado.",AC.CAT],
 ["duracao_minutos","Duração padrão entre 5 e 180 minutos.","INT","[NOT NULL]","N/A","Origem: catálogo (RF03). Destino: snapshot em item_agendamento e cálculo de duração.",AC.CAT],
 ["ativo","Exclusão lógica; serviço inativo não entra em novos agendamentos (RN14).","TINYINT","[NOT NULL]","N/A","Origem: administrador. Destino: validação de agendamento.",AC.CAT],
 ["data_cadastro","Data e hora de criação, gerada pelo servidor.","DATETIME","[NOT NULL]","N/A","Origem: servidor. Destino: auditoria.",AC.CAT]
]},
{ n:"produto", d:"Insumo ou material usado nos serviços, com saldo de estoque e limite mínimo para alerta.", c:[
 ["id_produto","Identificador único do produto.","INT","[PK] [AUTO_INCREMENT] [NOT NULL]","N/A","Origem: gerado pelo SGBD. Destino: FK em servico_produto e movimentacao_estoque.",AC.EST],
 ["nome","Nome do produto, único.","VARCHAR(100)","[NOT NULL] [UNIQUE]","N/A","Origem: catálogo (RF03). Destino: consultas e alertas.",AC.EST],
 ["finalidade","Finalidade de uso do produto; obrigatória.","VARCHAR(255)","[NOT NULL]","N/A","Origem: catálogo (RF03). Destino: consulta de catálogo.",AC.EST],
 ["unidade_medida","Unidade: UN, ML ou G. No DDL é numérico; para UN as quantidades são inteiras. Imutável com saldo ou histórico.","INT","[NOT NULL]","N/A","Origem: catálogo (RF03). Destino: validação de quantidades.",AC.EST],
 ["quantidade_estoque","Saldo físico, maior ou igual a zero; igual à soma das movimentações; inicia em 0.","DECIMAL(10,3)","[NOT NULL]","N/A","Origem: atualizado por movimentacao_estoque (RF08, RF05). Destino: reservas e alerta.",AC.EST],
 ["quantidade_minima","Limite mínimo; NULL ou maior que zero. Saldo menor ou igual gera alerta (PR03).","DECIMAL(10,3)","[NULL]","N/A","Origem: administrador. Destino: vw_alerta_estoque.",AC.EST],
 ["ativo","Exclusão lógica do produto.","TINYINT(1)","[NOT NULL]","N/A","Origem: administrador. Destino: validação de novas associações.",AC.EST],
 ["data_cadastro","Data e hora de criação, gerada pelo servidor.","DATETIME","[NOT NULL]","N/A","Origem: servidor. Destino: auditoria.",AC.EST]
]},
{ n:"servico_produto", d:"Associativa N:N: quantidade de cada produto consumida por serviço (receita de insumos).", c:[
 ["id_servico_produto","Identificador da associação.","INT","[PK] [AUTO_INCREMENT] [NOT NULL]","N/A","Origem: gerado pelo SGBD. Destino: apenas identificação.",AC.CAT],
 ["quantidade_utilizada","Quantidade consumida por execução do serviço, maior que zero, na unidade do produto.","DECIMAL(10,3)","[NOT NULL]","N/A","Origem: administrador (RF03). Destino: baixa e reserva de estoque.",AC.CAT],
 ["servico_id_servico","Serviço que consome o produto.","INT","[PK] [FK -> servico.id_servico] [NOT NULL]","N/A","Origem: servico. Destino: relacionamento N:1.",AC.CAT],
 ["produto_id_produto","Produto consumido pelo serviço; deve estar ativo.","INT","[PK] [FK -> produto.id_produto] [NOT NULL]","N/A","Origem: produto. Destino: relacionamento N:1.",AC.CAT]
]},
{ n:"movimentacao_estoque", d:"Histórico de entradas, ajustes e baixas de estoque; fonte do saldo do produto (RF08).", c:[
 ["id_movimentacao_estoque","Identificador da movimentação.","INT","[PK] [AUTO_INCREMENT] [NOT NULL]","N/A","Origem: gerado pelo SGBD. Destino: histórico de estoque.",AC.EST],
 ["tipo_movimentacao","ENTRADA, AJUSTE ou BAIXA_ATENDIMENTO. No DDL é numérico (RN16).","INT","[NOT NULL]","N/A","Origem: RF08 ou rotina de conclusão. Destino: cálculo de saldo.",AC.EST],
 ["quantidade","Quantidade com sinal: entrada positiva, baixa negativa, ajuste positivo ou negativo; nunca zero.","DECIMAL(10,3)","[NOT NULL]","N/A","Origem: administrador ou cálculo de consumo. Destino: produto.quantidade_estoque.",AC.EST],
 ["motivo","Justificativa; obrigatória para AJUSTE.","VARCHAR(255)","[NULL]","N/A","Origem: administrador (RF08). Destino: auditoria operacional.",AC.EST],
 ["data_hora_movimentacao","Momento da movimentação, gerado pelo servidor.","DATETIME","[NOT NULL]","N/A","Origem: servidor. Destino: histórico.",AC.EST],
 ["produto_id_produto","Produto movimentado.","INT","[PK] [FK -> produto.id_produto] [NOT NULL]","N/A","Origem: produto. Destino: relacionamento N:1.",AC.EST],
 ["agendamento_id_agendamento","Agendamento gerador da baixa. No DDL é obrigatório; a especificação exige NULL para ENTRADA e AJUSTE.","INT","[PK] [FK -> agendamento.id_agendamento] [NOT NULL]","N/A","Origem: rotina de conclusão. Destino: rastreabilidade do consumo.",AC.EST],
 ["usuario_id_usuario","Usuário responsável pela movimentação.","INT","[PK] [FK -> usuario.id_usuario] [NOT NULL]","N/A","Origem: sessão autenticada validada pelo back-end. Destino: rastreabilidade.",AC.EST]
]},
{ n:"solicitacao_titular", d:"Solicitações de direitos do titular (LGPD arts. 18 e 19) vinculadas a um cliente identificado (RF10).", c:[
 ["id_solicitacao_titular","Identificador da solicitação.","INT","[PK] [AUTO_INCREMENT] [NOT NULL]","N/A","Origem: gerado pelo SGBD. Destino: acompanhamento.",AC.ADM],
 ["tipo_solicitacao","CONFIRMACAO, ACESSO, CORRECAO, ANONIMIZACAO, BLOQUEIO, ELIMINACAO, PORTABILIDADE, INFORMACAO_COMPARTILHAMENTO, INFORMACAO_CONSENTIMENTO ou REVOGACAO_CONSENTIMENTO. No DDL é numérico.","INT","[NOT NULL]","DP","Origem: administrador (RF10). Destino: fluxo de atendimento.",AC.ADM],
 ["data_solicitacao","Data de abertura, gerada pelo servidor; prazo do art. 19 da LGPD para confirmação e acesso.","DATETIME","[NOT NULL]","DP","Origem: servidor. Destino: controle de prazos.",AC.ADM],
 ["data_atendimento","NULL enquanto ABERTA ou EM_ANALISE; preenchida em ATENDIDA ou RECUSADA.","DATETIME","[NULL]","DP","Origem: administrador. Destino: evidência de atendimento.",AC.ADM],
 ["situacao","ABERTA, EM_ANALISE, ATENDIDA ou RECUSADA. No DDL é numérico.","INT","[NOT NULL]","N/A","Origem: administrador. Destino: acompanhamento.",AC.ADM],
 ["observacao","Resumo da decisão; indica se o pedido se refere a dependente; sem dados pessoais desnecessários.","VARCHAR(255)","[NULL]","DP","Origem: administrador. Destino: registro da decisão.",AC.ADM],
 ["cliente_id_cliente","Cliente titular da solicitação.","INT","[PK] [FK -> cliente.id_cliente] [NOT NULL]","DP","Origem: cliente. Destino: relacionamento N:1.",AC.ADM],
 ["usuario_id_usuario","Usuário responsável pela análise. No DDL é obrigatório; a especificação o define como opcional.","INT","[PK] [FK -> usuario.id_usuario] [NOT NULL]","N/A","Origem: sessão autenticada. Destino: responsabilização.",AC.ADM]
]},
{ n:"log_auditoria", d:"Trilha de auditoria somente de acréscimo das operações nas tabelas de negócio (RF09). Sem senha_hash e com dados pessoais mascarados.", c:[
 ["id_log_auditoria","Identificador do log; nunca reutilizado.","BIGINT","[PK] [AUTO_INCREMENT] [NOT NULL]","N/A","Origem: gerado pelo SGBD. Destino: consulta de auditoria.",AC.AUD],
 ["nome_tabela","Tabela afetada pela operação (referência polimórfica, sem FK).","VARCHAR(64)","[NOT NULL]","N/A","Origem: triggers/rotinas de auditoria. Destino: filtros do RF09.",AC.AUD],
 ["id_registro_afetado","Chave do registro afetado (referência polimórfica).","BIGINT","[NOT NULL]","N/A","Origem: triggers/rotinas de auditoria. Destino: filtros do RF09.",AC.AUD],
 ["operacao","INSERT, UPDATE ou DELETE. No DDL é numérico.","INT","[NOT NULL]","N/A","Origem: triggers/rotinas de auditoria. Destino: filtros do RF09.",AC.AUD],
 ["data_hora_operacao","Data e hora da operação, geradas pelo servidor.","DATETIME","[NOT NULL]","N/A","Origem: servidor. Destino: filtros por período.",AC.AUD],
 ["valor_anterior","Snapshot JSON anterior, sem senha_hash e com dados pessoais omitidos ou mascarados.","JSON","[NULL]","DP","Origem: trigger/rotina de auditoria. Destino: consulta de auditoria.",AC.AUD],
 ["valor_novo","Snapshot JSON posterior, com as mesmas restrições de privacidade.","JSON","[NULL]","DP","Origem: trigger/rotina de auditoria. Destino: consulta de auditoria.",AC.AUD],
 ["usuario_id_usuario","Usuário autor da operação (em login falho, a conta tentada).","INT","[PK] [FK -> usuario.id_usuario] [NOT NULL]","N/A","Origem: contexto de sessão validado pelo back-end. Destino: responsabilização.",AC.AUD]
]},
{ n:"forma_pagamento", d:"Formas de pagamento aceitas: DINHEIRO, PIX, CARTAO_DEBITO e CARTAO_CREDITO, carregadas na configuração inicial.", c:[
 ["id_forma_pagamento","Identificador da forma de pagamento.","INT","[PK] [AUTO_INCREMENT] [NOT NULL]","N/A","Origem: gerado pelo SGBD. Destino: FK em pagamento.",AC.CAT],
 ["nome","Código da forma de pagamento, único.","VARCHAR(20)","[NOT NULL] [UNIQUE]","N/A","Origem: rotina de configuração inicial. Destino: registro de pagamento.",AC.CAT],
 ["ativo","Exclusão lógica; somente formas ativas são aceitas (CA-06-04).","TINYINT(1)","[NOT NULL]","N/A","Origem: configuração. Destino: validação de pagamento.",AC.CAT]
]},
{ n:"item_agendamento", d:"Associativa N:N entre agendamento e serviço; congela nome, valor e duração do serviço no momento do agendamento (RN03).", c:[
 ["id_item_agendamento","Identificador do item.","INT","[PK] [AUTO_INCREMENT] [NOT NULL]","N/A","Origem: gerado pelo SGBD. Destino: apenas identificação.",AC.AGE],
 ["nome_servico","Nome do serviço congelado na criação do item.","VARCHAR(100)","[NOT NULL]","N/A","Origem: servico.nome (snapshot). Destino: consulta de pagamento.",AC.AGE],
 ["valor_cobrado","Valor histórico, maior que zero; base do total (RN05) e do pagamento (RN15).","DECIMAL(10,2)","[NOT NULL]","N/A","Origem: servico.valor (snapshot). Destino: vw_total_agendamento e pagamento.",AC.AGE],
 ["duracao_minutos","Duração histórica do serviço, entre 5 e 180 minutos.","INT","[NOT NULL]","N/A","Origem: servico.duracao_minutos (snapshot). Destino: duração do agendamento.",AC.AGE],
 ["agendamento_id_agendamento","Agendamento a que o item pertence.","INT","[PK] [FK -> agendamento.id_agendamento] [NOT NULL]","N/A","Origem: agendamento. Destino: relacionamento N:1.",AC.AGE],
 ["servico_id_servico","Serviço do item; ativo quando incluído.","INT","[PK] [FK -> servico.id_servico] [NOT NULL]","N/A","Origem: servico. Destino: relacionamento N:1.",AC.AGE]
]},
{ n:"pagamento", d:"Pagamento único de um agendamento CONCLUIDO; registra valor, forma e data, sem gestão financeira (RF06).", c:[
 ["id_pagamento","Identificador do pagamento.","INT","[PK] [AUTO_INCREMENT] [NOT NULL]","N/A","Origem: gerado pelo SGBD. Destino: consulta de pagamento.",AC.PAG],
 ["valor_pago","Valor pago, maior que zero e igual ao total dos itens (RN15); sem desconto, cortesia ou gorjeta.","DECIMAL(10,2)","[NOT NULL]","N/A","Origem: informado no registro e validado contra vw_total_agendamento. Destino: consulta de pagamento.",AC.PAG],
 ["data_pagamento","Data e hora do registro, geradas pelo servidor; não retrodatável.","DATETIME","[NOT NULL]","N/A","Origem: servidor. Destino: consulta de pagamento.",AC.PAG],
 ["forma_pagamento_id_forma_pagamento","Forma de pagamento utilizada; deve estar ativa.","INT","[PK] [FK -> forma_pagamento.id_forma_pagamento] [NOT NULL]","N/A","Origem: forma_pagamento. Destino: relacionamento N:1.",AC.PAG],
 ["agendamento_id_agendamento","Agendamento pago; no máximo um pagamento por agendamento (RN06).","INT","[PK] [FK -> agendamento.id_agendamento] [NOT NULL] [UNIQUE]","N/A","Origem: agendamento CONCLUIDO. Destino: relacionamento 1:0..1.",AC.PAG],
 ["usuario_id_usuario","Usuário que registrou o pagamento (id_usuario_registro na especificação).","INT","[PK] [FK -> usuario.id_usuario] [NOT NULL]","N/A","Origem: sessão autenticada validada pelo back-end. Destino: rastreabilidade.",AC.PAG]
]}
];

const $ = (s, r = document) => r.querySelector(s);
const badge = p => {
  const k = p === "DPS" ? "dps" : p === "DP" ? "dp" : "na";
  return '<span class="badge badge-' + k + '">' + p + "</span>";
};
const cons = t => t.replace(/\[([^\]]+)\]/g, '<strong class="cons">[$1]</strong>');

function render() {
  const dic = $("#dicionario"), nav = $("#navTabelas");
  let html = "", links = "";
  TABELAS.forEach(t => {
    links += '<a href="#' + t.n + '" data-t="' + t.n + '">' + t.n + "</a>";
    html += '<section class="tabela-sec" id="' + t.n + '" data-t="' + t.n + '"><header><h2>' + t.n +
      "</h2><p>" + t.d + '</p></header><div class="table-wrap"><table class="dic"><thead><tr>' +
      "<th>Atributo</th><th>Descrição / Regra de Negócio</th><th>Tipo e Tamanho</th><th>Constraints</th>" +
      "<th>Privacidade (LGPD/GDPR)</th><th>Linhagem (Data Lineage)</th><th>Controle de Acesso (RBAC)</th>" +
      "</tr></thead><tbody>";
    t.c.forEach(c => {
      html += '<tr data-a="' + c[0] + '"><td class="attr">' + c[0] + "</td><td>" + c[1] + '</td><td class="tipo">' + c[2] +
        "</td><td>" + cons(c[3]) + "</td><td>" + badge(c[4]) + "</td><td>" + c[5] + "</td><td>" + c[6] + "</td></tr>";
    });
    html += "</tbody></table></div></section>";
  });
  dic.innerHTML = html;
  nav.innerHTML = links;
  $("#countTabelas").textContent = TABELAS.length;
  nav.addEventListener("click", e => { if (e.target.tagName === "A") $("#sidebar").classList.remove("open"); });
}

function filtrar(q) {
  q = q.trim().toLowerCase();
  let visiveis = 0;
  document.querySelectorAll(".tabela-sec").forEach(sec => {
    const nomeTab = sec.dataset.t.toLowerCase();
    const tabelaCasa = q === "" || nomeTab.includes(q);
    let linhas = 0;
    sec.querySelectorAll("tbody tr").forEach(tr => {
      const casa = tabelaCasa || tr.dataset.a.toLowerCase().includes(q);
      tr.hidden = !casa;
      if (casa) linhas++;
    });
    sec.hidden = linhas === 0;
    const link = document.querySelector('#navTabelas a[data-t="' + sec.dataset.t + '"]');
    if (link) link.hidden = sec.hidden;
    if (!sec.hidden) visiveis++;
  });
  $("#semResultado").hidden = visiveis !== 0;
}

function tema() {
  const root = document.documentElement, btn = $("#btnTheme");
  let t = "light";
  try { t = localStorage.getItem("tema") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); } catch (e) {}
  const aplicar = v => { root.dataset.theme = v; btn.textContent = v === "dark" ? "Modo claro" : "Modo escuro"; try { localStorage.setItem("tema", v); } catch (e) {} };
  aplicar(t);
  btn.addEventListener("click", () => aplicar(root.dataset.theme === "dark" ? "light" : "dark"));
}

function modalDer() {
  const modal = $("#modalDer"), area = $("#derArea"), img = $("#derImg");
  let pz = null;
  const iniciar = () => {
    if (pz || typeof Panzoom === "undefined") return;
    pz = Panzoom(img, { maxScale: 8, minScale: 0.3, step: 0.3, cursor: "grab" });
    area.addEventListener("wheel", pz.zoomWithWheel);
  };
  const abrir = () => {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    if (img.complete) iniciar(); else img.addEventListener("load", iniciar, { once: true });
    if (pz) pz.reset({ animate: false });
  };
  const fechar = () => { modal.hidden = true; document.body.style.overflow = ""; };
  $("#btnDer").addEventListener("click", abrir);
  $("#mClose").addEventListener("click", fechar);
  $("#zIn").addEventListener("click", () => pz && pz.zoomIn());
  $("#zOut").addEventListener("click", () => pz && pz.zoomOut());
  $("#zReset").addEventListener("click", () => pz && pz.reset());
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) fechar(); });
}

document.addEventListener("DOMContentLoaded", () => {
  render();
  tema();
  modalDer();
  $("#busca").addEventListener("input", e => filtrar(e.target.value));
  $("#btnMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
});