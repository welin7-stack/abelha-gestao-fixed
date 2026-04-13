import { NextRequest, NextResponse } from 'next/server'
import { assembleFile, cleanupSession } from './upload-store'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'
import { gunzipSync } from 'zlib'
import { appendFile } from 'fs/promises'
import { join } from 'path'

const LOG_FILE = '/tmp/abelha-upload.log'

async function log(msg: string) {
  const ts = new Date().toISOString()
  await appendFile(LOG_FILE, `[${ts}] ${msg}\n`).catch(() => {})
}

export async function POST(request: NextRequest) {
  let sessionId = ''

  try {
    await log('=== NOVO UPLOAD INICIADO ===')
    const body = await request.json()
    sessionId = body?.sessionId || ''
    const fileName = body?.fileName || 'arquivo.xlsx'
    await log(`sessionId=${sessionId} fileName=${fileName}`)

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID obrigatório' }, { status: 400 })
    }

    const result = await assembleFile(sessionId)
    await log(`assembleFile resultado: ${result ? 'OK buffer=' + result.buffer.length + 'B' : 'NULL (incompleto)'}`)
    if (!result) {
      return NextResponse.json({
        error: 'Arquivo incompleto. Os pedaços não foram todos recebidos. Tente enviar novamente.',
        details: `Sessão: ${sessionId}`
      }, { status: 400 })
    }

    // Descomprimir gzip → buffer do arquivo original
    let fileBuffer: Buffer
    try {
      fileBuffer = gunzipSync(result.buffer)
      await log(`gunzip OK: ${result.buffer.length}B → ${fileBuffer.length}B`)
    } catch (gunzipErr) {
      await log(`gunzip falhou: ${gunzipErr instanceof Error ? gunzipErr.message : 'desconhecido'}, usando buffer direto`)
      fileBuffer = result.buffer
    }

    try {
      await log(`Tentando XLSX.read com buffer de ${fileBuffer.length}B...`)
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      await log(`Abas encontradas: ${workbook.SheetNames.join(', ')}`)
      if (!sheetName) {
        return NextResponse.json({ error: 'Planilha vazia - nenhuma aba encontrada' }, { status: 400 })
      }
      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
      await log(`Linhas parseadas: ${jsonData.length}`)

      if (jsonData.length === 0) {
        return NextResponse.json({ error: 'Planilha sem dados - a aba está vazia' }, { status: 400 })
      }

      const COLUMN_MAP: Record<string, string> = {
        'NF': 'nf',
        'Nº NF': 'nf', 'N° NF': 'nf', 'NRO NF': 'nf', 'NRO. NF': 'nf', 'NUM NF': 'nf',
        'CT-E': 'cte', 'CTE': 'cte', 'CT-e': 'cte', 'NRO CTE': 'cte', 'NRO. CTE': 'cte', 'CTE/CNUM': 'cte',
        'Código Pedido': 'pedido', 'Cod. Pedido': 'pedido', 'Pedido': 'pedido', 'Código': 'pedido',
        'Cod Pedido': 'pedido', 'Nº Pedido': 'pedido', 'NRO PEDIDO': 'pedido', 'NRO. PEDIDO': 'pedido',
        'Nr Pedido': 'pedido', 'N Pedido': 'pedido', 'Cod.Pedido': 'pedido',
        'Cliente': 'cliente', 'Nome Cliente': 'cliente', 'Cod Cliente': 'cliente', 'Cód Cliente': 'cliente',
        'Código Cliente': 'cliente', 'Cod. Cliente': 'cliente', 'Cód. Cliente': 'cliente',
        'Loja': 'loja', 'Cod Loja': 'loja', 'Código Loja': 'loja',
        'Nome': 'nome', 'Nome Completo': 'nome', 'Razão Social': 'nome', 'Razao Social': 'nome',
        'Nome Cliente/Destinatário': 'nome',
        'Valor Bruto': 'valorBru', 'Valor Bru': 'valorBru', 'Vl.Bru': 'valorBru',
        'Vlr. Bruto': 'valorBru', 'Vlr Bruto': 'valorBru', 'Valor NF': 'valorBru',
        'Classe': 'classe',
        'Volumes': 'volume', 'Volume': 'volume', 'QtdVolumes': 'volume', 'Qtd Volume': 'volume',
        'Qtd. Volume': 'volume', 'QTD VOL': 'volume', 'QTD VOLUMES': 'volume',
        'Peso Bruto': 'pesoBruto', 'Peso Bruto (Kg)': 'pesoBruto', 'Peso Bruto Kg': 'pesoBruto',
        'Peso Bruto(Kg)': 'pesoBruto', 'Peso Brt': 'pesoBruto',
        'Peso Liq': 'pesoLiq', 'Peso Líquido': 'pesoLiq', 'Peso Liq (Kg)': 'pesoLiq',
        'Peso Liq Kg': 'pesoLiq', 'Peso Liq(Kg)': 'pesoLiq', 'Peso Liq.': 'pesoLiq',
        'Cidade': 'cidade', 'Cidade Destino': 'cidade', 'Municipio': 'cidade', 'Município': 'cidade',
        'UF': 'uf', 'Estado': 'uf', 'UF Destino': 'uf', 'UF Dest.': 'uf', 'Sigla UF': 'uf',
        'Cod Transp': 'codTransp', 'Cod. Transp': 'codTransp', 'Código Transp': 'codTransp',
        'Transportadora': 'transportadora', 'Transp': 'transportadora', 'Nome Transp': 'transportadora',
        'Nome Transportadora': 'transportadora', 'Transportadora/Nome': 'transportadora',
        'Data Envio': 'dataEnvio', 'Dt Envio': 'dataEnvio', 'Dt. Envio': 'dataEnvio',
        'Data Expedição': 'dataEnvio', 'Dt Expedição': 'dataEnvio',
        'Picking': 'picking', 'PICKING': 'picking',
        'Data Emissão NF': 'dataEmissaoNf', 'Dt Emissão NF': 'dataEmissaoNf',
        'Dt. Emissão NF': 'dataEmissaoNf', 'Emissão NF': 'dataEmissaoNf',
        'Data Liberação': 'dataLiberacao', 'Dt Liberação': 'dataLiberacao', 'Dt. Liberação': 'dataLiberacao',
        'Liberação': 'dataLiberacao', 'Data Lib': 'dataLiberacao',
        'Emissão Pedido': 'emissPed', 'Emissao Pedido': 'emissPed', 'Dt Emissão Pedido': 'emissPed',
        'EMISS_PED': 'emissPed',
        'Valor Frete': 'valFret', 'Vl Frete': 'valFret', 'Vl. Frete': 'valFret',
        'Vlr. Frete': 'valFret', 'Vlr Frete': 'valFret', 'Frete': 'valFret',
        'VAL_FRET': 'valFret', 'VALFRET': 'valFret', 'VL_FRET': 'valFret',
        'Tipo Frete': 'tpFrete', 'Tp Frete': 'tpFrete', 'Tp. Frete': 'tpFrete',
        'Previsão Entrega': 'previsaoEntrega', 'Previsao': 'previsaoEntrega', 'Previsão': 'previsaoEntrega',
        'Dt. Prev. Entrega': 'previsaoEntrega', 'Dt Prev Entrega': 'previsaoEntrega',
        'Entrega Realizada': 'entregaRealizada', 'Dt Entrega': 'entregaRealizada',
        'Dt. Entrega': 'entregaRealizada', 'Data Entrega': 'entregaRealizada',
        'Situação': 'situacao', 'Situacao': 'situacao', 'Status': 'situacao',
        'SITUAÇÃO': 'situacao', 'SITUACAO': 'situacao', 'STATUS': 'situacao',
        'Deadline': 'deadline', 'DL': 'deadline', 'PRAZO': 'deadline',
        'Ocorrência': 'ocorrencia', 'Ocorrencia': 'ocorrencia', 'Ocorr': 'ocorrencia',
        'Motivo Ocorrência': 'ocorrencia',
        'Realizado': 'realizado', 'Valor Realizado': 'realizado',
        'Fulfillment': 'fulfillment', 'FULLFILLMENT': 'fulfillment', 'FULFILLMENT': 'fulfillment',
        'FULFllLMENT': 'fulfillment', 'FULFILMENT': 'fulfillment',
      }

      function parseDate(val: unknown): string | null {
        if (!val) return null
        if (val instanceof Date) return val.toISOString()
        if (typeof val === 'number') {
          if (val > 40000 && val < 60000) {
            const d = new Date((val - 25569) * 86400000)
            return d.toISOString()
          }
          return null
        }
        const str = String(val).trim()
        if (!str) return null
        const d = new Date(str)
        return isNaN(d.getTime()) ? str : d.toISOString()
      }

      function parseNumber(val: unknown): number | null {
        if (val === '' || val === null || val === undefined) return null
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^\d.,-]/g, '').replace(',', '.'))
        return isNaN(num) ? null : num
      }

      const headers = Object.keys(jsonData[0])
      await log(`CABECALHOS REAIS DA PLANILHA: [${headers.join(' | ')}]`)
      await log(`PRIMEIRA LINHA: ${JSON.stringify(jsonData[0])}`)
      
      // Mapear colunas com fuzzy matching
      const mappedHeaders: Record<string, string> = {}

      function normalizeStr(s: string): string {
        return s.trim()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/[^a-zA-Z0-9]/g, '')
          .toLowerCase()
      }

      // Tabela reversa: normalized key -> field name
      const reverseMap = new Map<string, string>()
      for (const [colName, field] of Object.entries(COLUMN_MAP)) {
        reverseMap.set(normalizeStr(colName), field)
      }

      for (const h of headers) {
        const clean = h.trim()
        // 1. Match exato
        let mapped = COLUMN_MAP[clean] || COLUMN_MAP[clean.toUpperCase()] || COLUMN_MAP[clean.toLowerCase()]
        // 2. Fuzzy match (normalizado)
        if (!mapped) {
          mapped = reverseMap.get(normalizeStr(clean))
        }
        // 3. Match parcial (se o header contem a palavra-chave)
        if (!mapped) {
          const norm = normalizeStr(clean)
          for (const [colName, field] of Object.entries(COLUMN_MAP)) {
            const normCol = normalizeStr(colName)
            if (norm.includes(normCol) || normCol.includes(norm)) {
              mapped = field
              break
            }
          }
        }
        if (mapped && !mappedHeaders[mapped]) {
          mappedHeaders[mapped] = h
          await log(`Mapeado: "${h}" -> ${mapped}`)
        }
      }
      await log(`COLUNAS MAPEADAS: [${Object.keys(mappedHeaders).join(', ')}]`)
      await log(`COLUNAS NAO MAPEADAS: [${headers.filter(h => !Object.values(mappedHeaders).includes(h)).join(' | ')}]`)

      const inserts = jsonData
        .map((row, idx) => {
          const get = (field: string) => row[mappedHeaders[field]] ?? ''
          return {
            nf: String(get('nf') || ''),
            cte: String(get('cte') || ''),
            pedido: parseInt(String(get('pedido') || '0'), 10) || 0,
            cliente: parseInt(String(get('cliente') || '0'), 10) || 0,
            loja: parseInt(String(get('loja') || '1'), 10) || 1,
            nome: String(get('nome') || ''),
            valorBru: parseNumber(get('valorBru')) || 0,
            classe: String(get('classe') || ''),
            volume: parseNumber(get('volume')) || 0,
            pesoBruto: parseNumber(get('pesoBruto')) || 0,
            pesoLiq: parseNumber(get('pesoLiq')) || 0,
            cidade: String(get('cidade') || ''),
            uf: String(get('uf') || '').toUpperCase().slice(0, 2),
            codTransp: parseInt(String(get('codTransp') || '0'), 10) || 0,
            transportadora: String(get('transportadora') || ''),
            dataEnvio: parseDate(get('dataEnvio')),
            picking: parseNumber(get('picking')),
            dataEmissaoNf: parseDate(get('dataEmissaoNf')),
            dataLiberacao: parseDate(get('dataLiberacao')),
            emissPed: parseDate(get('emissPed')),
            valFret: parseNumber(get('valFret')) || 0,
            tpFrete: String(get('tpFrete') || ''),
            previsaoEntrega: parseDate(get('previsaoEntrega')),
            entregaRealizada: parseDate(get('entregaRealizada')),
            situacao: String(get('situacao') || ''),
            deadline: parseNumber(get('deadline')),
            ocorrencia: String(get('ocorrencia') || ''),
            realizado: parseNumber(get('realizado')),
            fulfillment: parseNumber(get('fulfillment')),
          }
        })
        .filter((r) => r.cliente || r.nf || r.pedido || r.transportadora)

      if (inserts.length === 0) {
        await log(`INSERTS VAZIO! mappedColumns=[${Object.keys(mappedHeaders).join(',')}] headers=[${headers.join(',')}]`)
        return NextResponse.json({
          error: 'Nenhum dado válido encontrado na planilha. Verifique se as colunas estão com os nomes corretos.',
          mappedColumns: Object.keys(mappedHeaders),
        }, { status: 400 })
      }

      await log(`Inserindo ${inserts.length} registros (transacao atomica: deleteMany + createMany)...`)
      await db.$transaction(async (tx) => {
        await tx.entrega.deleteMany({})
        // Criar em lotes de 100 para nao estourar o limite do SQLite
        const BATCH_SIZE = 100
        for (let i = 0; i < inserts.length; i += BATCH_SIZE) {
          const batch = inserts.slice(i, i + BATCH_SIZE)
          await tx.entrega.createMany({ data: batch })
          await log(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} registros inseridos`)
        }
      }, { timeout: 120000 })
      await log(`SUCESSO: ${inserts.length} entregas importadas`)

      return NextResponse.json({
        success: true,
        imported: inserts.length,
        message: `${inserts.length} entregas importadas com sucesso!`,
      })
    } catch (parseError) {
      await log(`ERRO PARSE: ${parseError instanceof Error ? parseError.stack || parseError.message : String(parseError)}`)
      await cleanupSession(sessionId)
      const msg = parseError instanceof Error ? parseError.message : 'Erro ao processar planilha'
      return NextResponse.json({ error: `Erro ao processar planilha: ${msg}` }, { status: 500 })
    }
  } catch (error) {
    await log(`ERRO GERAL: ${error instanceof Error ? error.stack || error.message : String(error)}`)
    if (sessionId) await cleanupSession(sessionId).catch(() => {})
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: `Erro no upload: ${msg}` }, { status: 500 })
  }
}
