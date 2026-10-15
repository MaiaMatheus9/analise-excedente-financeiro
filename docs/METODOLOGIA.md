# Metodologia e inspeção dos materiais

## Materiais recebidos

Planilha `Ferramenta 10 — Google Finance (Economia).xlsx` e PDF de seu Dashboard, inspecionados em 13/10/2026. Os originais permanecem intactos na pasta do usuário.

Abas: Dashboard, Comparador, Mercado_B3, Renda_Fixa, Historico e Config. O dashboard contém dois conjuntos de gráficos, de retorno e valor final, para os melhores e menores resultados. A versão web preserva esses objetivos e adota uma navegação própria.

Dependências: Config alimenta renda fixa e mercado; essas abas alimentam Comparador, Dashboard e Histórico. As células de mercado guardam expressões GOOGLEFINANCE encapsuladas como `__xludf.DUMMYFUNCTION` na exportação Excel, com valores salvos de fallback. Isso não é uma integração ativa utilizável pelo site. `Config!B6` chama `CDI()`, mas a implementação dessa função não está contida no XLSX.

## Inconsistências identificadas

1. O período de Config!B5 é subtraído de TODAY para o histórico (dias corridos), mas dividido por 252 em Renda_Fixa!E3:E6 como se representasse dias úteis. A aplicação separa essas unidades.
2. O comparador fixa CDB B como referência. A aplicação permite escolher A, B ou C.
3. INDEX/MATCH combinado com LARGE/SMALL pode repetir o mesmo ativo em empates. O ranking web ordena objetos por retorno e ticker, sem duplicar linhas.
4. A planilha compara a primeira cotação histórica com `price`, potencialmente intradiário. A aplicação exclui o dia em curso e usa sessões comuns completas. No modo histórico, também limita o fim à última observação disponível do CDI.
5. `TEXT(TODAY())` mostra a data da consulta, não necessariamente a data da taxa. A aplicação exibe separadamente a data de referência do CDI.
6. A série de preços e os proventos não são explicitamente diferenciados na fórmula E/D - 1. A versão web identifica o uso de `adjustedClose`, quando completo, e informa quando só há fechamentos com ajuste não uniforme.

## Cálculos da primeira versão

Todos os percentuais internos são decimais. As séries SGS vêm em percentual e são divididas por 100 na entrada. Os percentuais do CDI informados no formulário (por exemplo 110) são divididos por 100 para virar um múltiplo (1,10).

### Renda fixa: histórico (padrão)

Para cada observação diária do CDI entre o início exclusivo e o fim inclusivo:

`retorno = produto(1 + CDI_diário × múltiplo_CDI) − 1`

O intervalo é alinhado às datas comuns das séries de mercado disponíveis. Caso falte uma observação esperada pelo calendário, o cálculo é marcado como indisponível. Não há preenchimento com uma taxa inventada. Esse cálculo é uma comparação bruta hipotética, não um extrato de um título efetivamente contratado.

### Renda fixa: estimativa pela taxa atual

`CDI_diário_equivalente = (1 + CDI_anual)^(1/252) − 1`

`retorno = (1 + CDI_diário_equivalente × múltiplo_CDI)^dias_úteis − 1`

Aplica-se o percentual contratado à taxa diária, em vez de elevar diretamente a taxa anual pelo múltiplo. É uma estimativa com taxa constante, identificada como tal. Não substitui uma simulação que considere a trajetória futura do CDI.

A fórmula original `(1 + CDI_anual)^(múltiplo × dias/252) − 1` foi mantida apenas como função de referência em teste. Ela reproduz o exemplo do PDF (R$ 506,91 de ganho com R$ 30.000, CDI de 13,65%, 110% do CDI e 30 dias tratados como úteis). A tela usa o método diário e o intervalo útil efetivo, por isso o resultado não precisa coincidir com esse exemplo.

### Renda variável

`retorno = preço_final / preço_inicial − 1`

Usa `adjustedClose` se presente em todos os pontos do intervalo; caso contrário, utiliza `close` e identifica a limitação. A brapi informa que fechamentos diários podem já conter ajustes. Portanto, não se rotula indiscriminadamente a série como preço sem proventos. Não são acrescentados dividendos novamente, evitando dupla contagem. Confira a metodologia da fonte para usos acadêmicos que exijam precisão adicional.

### Comparação

`valor_final = capital × (1 + retorno)`

`ganho_bruto = valor_final − capital`

`diferença_em_p.p. = (retorno_ativo − retorno_referência) × 100`

São utilizadas as primeiras e últimas datas da interseção das sessões disponíveis nos ativos com ao menos duas observações. Sem duas datas comuns, os retornos do mercado são indisponíveis. Ativos com falha não entram no ranking. O Ibovespa fica fora do ranking e é mostrado separadamente como índice.

## Calendário

Contagem em UTC para evitar deslocamentos de fuso. Dia atual e limites de consulta usam America/Sao_Paulo. São excluídos sábados, domingos, feriados nacionais fixos, Carnaval (segunda/terça), Sexta-feira Santa e Corpus Christi. Dia da Consciência Negra considerado nacional a partir de 2024. Não se modelam fechamentos extraordinários, todas as regras históricas da B3 ou particularidades contratuais de cada produto. No histórico, o retorno efetivo usa as datas recebidas do Banco Central.

## Fontes verificadas

- SGS 4389: https://www3.bcb.gov.br/sgspub/consultarvalores/consultarValoresSeries.do?method=consultarSeries&series=4389
- SGS 12, endpoint de dados: https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json
- Histórico e preços ajustados: https://brapi.dev/docs/acoes/historico
- Acesso e autenticação: https://brapi.dev/docs
- Restrições de GOOGLEFINANCE fora do Sheets: https://support.google.com/docs/answer/3093281?hl=pt-BR

## Ampliação de renda fixa (outubro de 2026)
- LCI e LCA: cenários de percentual do CDI editável, sem inventar ofertas. Comparação BRUTA, sem IR, IOF, carência ou vencimento; portanto não mede vantagem tributária nem garante liquidez.
- Tesouro Selic: estimativa pelo fator acumulado da Selic diária (SGS 11), não cotação/retorno de um título específico. Não incorpora ágio/deságio, marcação a mercado, IR, IOF ou custódia. Não representa Tesouro IPCA+ ou Prefixado.
- Poupança: pessoa física, depósito único sem saques, regra nova. SGS 195 fornece data inicial, dataFim e rendimento mensal já com TR. Acumulam-se apenas ciclos completos; depósitos de 29 a 31 iniciam ciclo em 1º do mês seguinte. Série incompleta torna o resultado indisponível.
- Intervalo histórico de até dez anos; consultas BCB em blocos de cinco anos para CDI e um ano para Selic/poupança, com uma repetição em falhas transitórias. Mercado acima de dois anos não é consultado nesta versão.
- Na aba Renda fixa usa-se o período solicitado até o último CDI disponível. No Comparador as alternativas continuam alinhadas às mesmas datas do mercado.
- O método CDI atual só afeta produtos indexados ao CDI. Selic e poupança continuam históricas. Não é projeção futura.
Fontes: https://dadosabertos.bcb.gov.br/dataset/195-depositos-de-poupanca-a-partir-de-04052012---rentabilidade-no-periodo
https://www.bcb.gov.br/meubc/faqs/p/posso-abrir-caderneta-de-poupanca-nos-dias-29-30-e-31-qual-a-diferenca
https://www.tesourodireto.com.br/sobre-o-tesouro/regras-e-regulamento
