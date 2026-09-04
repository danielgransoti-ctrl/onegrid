/**
 * One Grid — recebe os leads do site e grava na planilha.
 *
 * Este arquivo NÃO faz parte do site. Ele roda dentro da própria planilha do
 * Google. Como instalar está no README, na seção "Leads na planilha".
 *
 * Planilha:
 * https://docs.google.com/spreadsheets/d/18-PZ0bZWSv5VNABz62LSsKtlk7Sxv996E_T3A8z0rA0/edit
 */

/** Colunas da planilha, na ordem. O texto à esquerda vira o cabeçalho; o da
 *  direita é o nome do campo que o site envia. */
var COLUNAS = [
  ['Data/hora',            '_quando'],
  ['Nome completo',        'nome_completo'],
  ['E-mail',               'email'],
  ['Telefone',             'telefone'],
  ['Cidade',               'cidade'],
  ['País',                 'pais'],
  ['Profissão',            'profissao'],
  ['Perfil',               'perfil'],
  ['Local de instalação',  'local_instalacao'],
  ['Já tem simulador',     'simulador_atual'],
  ['Investimento',         'investimento'],
  ['Prazo',                'prazo'],
  ['Como conheceu',        'origem'],
  ['Mensagem',             'mensagem'],
  ['Autorizou contato',    '_consentimento'],
  ['Idioma',               'idioma'],
  ['Página',               'pagina'],
  ['utm_source',           'utm_source'],
  ['utm_medium',           'utm_medium'],
  ['utm_campaign',         'utm_campaign'],
  ['utm_content',          'utm_content'],
  ['utm_term',             'utm_term'],
  ['gclid',                'gclid'],
  ['fbclid',               'fbclid']
];

function doPost(e) {
  try {
    var dados = JSON.parse(e.postData.contents);
    var aba = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Na primeira vez, escreve o cabeçalho e congela a linha.
    if (aba.getLastRow() === 0) {
      var titulos = COLUNAS.map(function (c) { return c[0]; });
      aba.appendRow(titulos);
      aba.getRange(1, 1, 1, titulos.length)
         .setFontWeight('bold')
         .setBackground('#DB0143')
         .setFontColor('#FFFFFF');
      aba.setFrozenRows(1);
    }

    // O site manda a hora em UTC; aqui vira horário de Brasília.
    dados._quando = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm');
    dados._consentimento = dados.consentimento ? 'Sim' : 'Não';

    aba.appendRow(COLUNAS.map(function (c) {
      var v = dados[c[1]];
      return (v === undefined || v === null) ? '' : String(v);
    }));

    return responder({ ok: true });
  } catch (erro) {
    return responder({ ok: false, erro: String(erro) });
  }
}

/** O site chama em modo no-cors e não lê a resposta; ela serve para você
 *  testar a URL direto no navegador. */
function doGet() {
  return responder({ ok: true, aviso: 'Endpoint ativo. Os leads chegam por POST.' });
}

function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
