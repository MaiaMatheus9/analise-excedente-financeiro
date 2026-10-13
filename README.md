# Ferramenta 10 — Análise de Excedente Financeiro

Aplicação educacional do Hub de Inteligência Financeira para Empreendedores. Primeira versão local em React + TypeScript + Vite, com Recharts, React Hook Form e Zod. Interface em Arial, com entradas verdes, resultados azuis e informações complementares em cinza. CSS responsivo próprio, sem necessidade de Tailwind nesta versão.

## Executar no VS Code

Requer Node.js 20.19+ ou 22.12+ e npm.

```powershell
cd "C:\Users\Windows\OneDrive\Documentos\Projetos\ferramenta-10-web"
npm install
npm run dev
```

Acesse http://127.0.0.1:5173. O servidor do Vite inclui a API local; não é necessário iniciar outro processo. Para encerrar, pressione Ctrl+C no terminal. A porta 5173 é fixa: encerre uma instância anterior antes de iniciar outra.

```powershell
npm test
npm run build
```

`npm run preview` serve somente o frontend compilado, sem a API. Para testar o fluxo completo, use `npm run dev` ou o emulador do Cloudflare Pages.

## Configurar dados de mercado

1. Obtenha uma chave em https://brapi.dev/dashboard, verificando cobertura e limites do seu plano.
2. Copie `.env.example` para `.env.local`.
3. Preencha `BRAPI_API_KEY` e reinicie `npm run dev`.

Nunca use `VITE_BRAPI_API_KEY`: variáveis com prefixo VITE podem ir para o navegador. Não envie sua chave para o Git. Sem chave, a aplicação consulta os ativos de teste PETR4, ITUB4 e VALE3; os demais aparecem indisponíveis. Uma chave não garante cobertura de todos os intervalos: isso depende do plano. Nenhum serviço pago é contratado automaticamente.

## O que está implementado

- Seis abas: Visão geral, Comparador, Renda fixa, Renda variável, Histórico e Configurações.
- Capital, referência e período compartilhados; 7/15 dias, 1/3/6/12 meses e datas personalizadas (até dois anos).
- Percentuais de três CDBs e um RDB editáveis com validação e recálculo imediato.
- Dois métodos: acumulação do CDI diário histórico ou estimativa com CDI anual atual constante.
- Rankings com até quatro maiores e três menores retornos, excluindo o Ibovespa e ativos indisponíveis.
- Gráficos de retorno, valor final e evolução de até quatro séries; filtros por categoria e ordenação.
- Dados reais consultados no backend, cache em memória de 15 minutos e mensagens de falha/limites de acesso.
- Consulta automática ao abrir e alterar o período; botão para atualizar. Capital e taxas recalculam localmente sem novas consultas.
- Fonte, intervalo efetivo, referência do CDI e identificação de séries ajustadas.
- Ibovespa como benchmark separado, condicionado à disponibilidade no provedor.

## Estrutura

```text
src/
  App.tsx                    # Navegação e cenário global
  pages/                     # Seis páginas, uma para cada aba
  main.tsx                   # Inicialização React
  styles.css                 # Identidade visual e responsividade
  components/                # Gráficos, tabela e formulário validado
  hooks/useData.ts            # Carregamento, cancelamento e erros de API
  lib/finance.ts             # Cálculos, calendário, alinhamento e rankings
  types.ts                   # Contratos compartilhados
server/api.ts                # Adaptadores BCB/brapi, validação e cache
functions/api/data.ts        # Endpoint Cloudflare Pages Functions
vite.config.ts              # API local e build
docs/METODOLOGIA.md          # Análise da planilha, fórmulas e limitações
```

Os testes ficam junto dos módulos: `finance.test.ts`, `api.test.ts` e `SettingsForm.test.tsx`.

## Fontes

- Banco Central, SGS 4389: CDI anualizado, base 252, em % a.a. https://www3.bcb.gov.br/sgspub/consultarvalores/consultarValoresSeries.do?method=consultarSeries&series=4389
- Banco Central, SGS 12: CDI diário, em % ao dia. https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados?formato=json
- brapi v2, histórico diário: https://brapi.dev/docs/acoes/historico
- Autenticação e ativos de teste: https://brapi.dev/docs
- Limitações de GOOGLEFINANCE: https://support.google.com/docs/answer/3093281?hl=pt-BR

## Cloudflare Pages — quando for publicar

Nenhuma publicação foi realizada. O código já contém `functions/api/data.ts`.

1. Crie um repositório com o código (sem `.env.local`, `node_modules` ou arquivos privados) e conecte-o ao Cloudflare Pages.
2. Configure o comando de build `npm run build`, diretório de saída `dist` e Node.js 22.
3. Cadastre `BRAPI_API_KEY` como segredo/variável no ambiente de produção e de preview do Pages.
4. Confirme a inclusão do diretório `functions` na raiz e faça o deploy por integração Git ou pelo Wrangler. Upload estático apenas de `dist` não inclui a API.
5. Valide `/api/data?start=2026-09-13&end=2026-10-09` (ajuste as datas), os gráficos, limites do provedor e as mensagens de erro.

Documentação oficial: https://developers.cloudflare.com/pages/functions/ e https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/

## Limitações e próximos incrementos

- Dados de ETFs, FIIs, WEG e Ibovespa dependem de chave/cobertura; longos históricos podem depender do plano.
- Cache em memória por processo/isolate, não distribuído. Antes de aumentar o público, considerar cache compartilhado e controle de abuso da API pública.
- Calendário com fins de semana e feriados nacionais/móveis; não é um calendário oficial completo da B3. Ausências no CDI histórico bloqueiam a renda fixa quando o calendário espera observação.
- Retornos brutos; sem IR, IOF, taxas, spreads, custos de negociação ou modelagem individual de garantias e liquidez.
- Ajustes de preços seguem o provedor; não presumir equivalência exata com fluxo de dividendos recebido/reinvestido por um investidor.
- O capital hipotético usa frações ideais, sem restrição de lotes. Ofertas bancárias são parâmetros do usuário, não cotações de produtos bancários.
- Sem autenticação, banco de dados ou persistência das configurações. Recarregar a página restaura o cenário inicial.
- Cada consulta fica restrita a dois anos. Não há atualização em tempo real nem execução de investimentos.

Próximos passos: habilitar a chave, validar cobertura completa, revisar a metodologia com o responsável acadêmico e, quando autorizado, publicar.
