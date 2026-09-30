# ✦ Aurum — Finanças pessoais

App local para controlar:

- **Pagamentos do mês**: checklist de todo mundo que você paga (Pix, boleto, etc.), com chave Pix pra copiar num clique, dia de pagamento e progresso do mês. Tem um botão que copia a lista de pendentes com as chaves.
- **Cartões de crédito**: cada cartão com fechamento, vencimento e limite. Todo mês você digita o valor da fatura e marca como paga.
- **Recebimentos**: quanto você espera receber, de quem e quando. Clique em "Recebi" quando o dinheiro cair. Pode repetir um recebimento por vários meses.
- **Painel**: saldo do mês, quanto entrou, quanto saiu, o que falta pagar, agenda com os vencimentos e gráfico dos últimos 6 meses.

## Como rodar

Você precisa do [Node.js](https://nodejs.org) (qualquer versão recente). Não tem nada para instalar com `npm`.

**Windows:** dê dois cliques em `iniciar.bat`.

**Mac/Linux:** rode `./iniciar.sh`.

**Ou pelo terminal:**

```bash
cd financas
node server.js
```

Depois abra **http://localhost:3000**.

Os dados ficam salvos em `financas/data/dados.json`, com um backup automático por dia em `data/backups/` (a pasta `data/` fica fora do git).

> Sem Node? Dá pra abrir o `index.html` direto no navegador. Nesse caso os dados ficam salvos só naquele navegador. Use **Ajustes → Exportar backup** de vez em quando.

## Atalhos

| Tecla | Ação |
|---|---|
| `←` / `→` | mês anterior / próximo |
| `N` | novo lançamento |
| `1`–`5` | trocar de tela |

## Dicas

- Clique no **valor** de um pagamento para ajustá-lo só naquele mês (ex.: hora extra), sem mudar o valor padrão.
- Clique na **chave Pix** para copiar.
- Quer ver o app funcionando antes de cadastrar tudo? Em **Ajustes → Dados de exemplo**. Depois é só **Apagar tudo**.
