import { ExternalLink } from "lucide-react";
import { SettingsForm } from "../components/SettingsForm";
import { PanelTitle } from "../components/Ui";
import type { PageProps } from "./types";

export default function Settings({ settings, setSettings, data }: PageProps) {
  return (
    <>
      <section className="panel">
        <PanelTitle
          title="Parâmetros da análise"
          subtitle="Estas configurações são compartilhadas entre todas as abas"
        />
        <SettingsForm value={settings} onChange={setSettings} />
      </section>
      <div className="two-columns">
        <section className="panel prose">
          <PanelTitle
            title="Fontes e atualização"
            subtitle="Transparência sobre a origem dos números"
          />
          <h3>
            Banco Central do Brasil{" "}
            <span className="small-tag">Automático</span>
          </h3>
          <p>
            CDI anual: série SGS 4389, percentual ao ano, base 252. CDI
            histórico: série SGS 12, taxa diária. Selic diária: SGS 11.
            Poupança: SGS 195, com início e fim de cada ciclo mensal. A consulta
            é automática ao abrir a aplicação e mudar o período.
          </p>
          <h3>Mercado B3 via brapi</h3>
          <p>
            Históricos diários de ações, ETFs, FIIs e Ibovespa, conforme a
            cobertura e o plano de acesso. Cache de 15 minutos para reduzir
            consultas.
          </p>
          <p>
            <a
              href="https://brapi.dev/dashboard"
              target="_blank"
              rel="noreferrer"
            >
              Obter uma chave brapi <ExternalLink size={13} />
            </a>
          </p>
          <p>
            Configure <code>BRAPI_API_KEY</code> em <code>.env.local</code> e
            reinicie o servidor. Na Cloudflare, use um segredo de ambiente. A
            chave nunca é enviada para o navegador.
          </p>
          <span className="subtle-badge">
            {data?.tokenConfigured
              ? "Chave configurada no servidor"
              : "Chave ainda não configurada"}
          </span>
        </section>
        <section className="panel prose">
          <PanelTitle
            title="Como interpretar"
            subtitle="Uma comparação informativa, com limites claros"
          />
          <p>
            <b>CDI histórico:</b> acumula as taxas diárias observadas,
            multiplicadas pelo percentual contratado. Não representa uma oferta
            real de banco.
          </p>
          <p>
            <b>CDI atual:</b> converte a taxa anual para diária, aplica o
            percentual do produto e acumula pelos dias úteis estimados. A taxa
            pode mudar no futuro.
          </p>
          <p>
            <b>Renda variável:</b> usa preços ajustados quando disponíveis em
            toda a série. Esses ajustes podem incorporar proventos e eventos
            corporativos. Sem série ajustada completa, a tela informa a
            limitação; não se presume retorno total.
          </p>
          <p>
            <b>Datas:</b> os ativos disponíveis usam datas de negociação comuns.
            O calendário estimado exclui fins de semana e feriados nacionais e
            móveis, mas não cobre todas as exceções da B3.
          </p>
        </section>
      </div>
    </>
  );
}
