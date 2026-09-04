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

var FUSO = 'America/Sao_Paulo';

function doPost(e) {
  try {
    var dados = JSON.parse(e.postData.contents);
    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var aba = planilha.getSheets()[0];

    // A hora gravada é a do fuso da planilha; garante que seja Brasília.
    if (planilha.getSpreadsheetTimeZone() !== FUSO) {
      planilha.setSpreadsheetTimeZone(FUSO);
    }

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

    dados._consentimento = dados.consentimento ? 'Sim' : 'Não';

    var linha = COLUNAS.map(function (c) {
      var v = dados[c[1]];
      return (v === undefined || v === null) ? '' : String(v);
    });
    linha[0] = new Date();

    // Tudo entra como texto. Sem isso, um telefone digitado "+55 43 ..." é
    // lido como fórmula pela planilha e a célula vira #ERROR!. O mesmo vale
    // para qualquer resposta que a pessoa comece com +, -, = ou @.
    var n = aba.getLastRow() + 1;
    var faixa = aba.getRange(n, 1, 1, linha.length);
    faixa.setNumberFormat('@');
    aba.getRange(n, 1).setNumberFormat('dd/MM/yyyy HH:mm');  // menos a data
    faixa.setValues([linha]);

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
