import { NextRequest, NextResponse } from 'next/server'
import { saveChunk } from '../upload-store'
import { appendFile } from 'fs/promises'

const LOG_FILE = '/tmp/abelha-upload.log'

async function log(msg: string) {
  const ts = new Date().toISOString()
  await appendFile(LOG_FILE, `[${ts}] [CHUNK] ${msg}\n`).catch(() => {})
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, chunkIndex, totalChunks, chunk, fileName } = body

    await log(`sessionId=${sessionId} chunk=${chunkIndex}/${totalChunks} chunkLen=${(chunk || '').length} fileName=${fileName}`)

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID obrigatório' }, { status: 400 })
    }

    const buffer = Buffer.from(chunk || '', 'base64')
    await log(`Base64 decoded: buffer de ${buffer.length}B`)

    const result = await saveChunk(
      sessionId,
      parseInt(String(chunkIndex), 10),
      buffer,
      fileName || 'arquivo.xlsx',
      parseInt(String(totalChunks), 10),
      'application/octet-stream'
    )

    await log(`saveChunk OK: received=${result.received} total=${result.total}`)

    return NextResponse.json({
      success: true,
      chunk: chunkIndex,
      received: result.received,
      total: result.total,
    })
  } catch (error) {
    await log(`ERRO: ${error instanceof Error ? error.stack || error.message : String(error)}`)
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
