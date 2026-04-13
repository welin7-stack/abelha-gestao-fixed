import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const termo = searchParams.get('termo')?.trim() || ''

    if (!termo || termo.length < 1) {
      return NextResponse.json({
        success: false,
        message: 'Digite um número de NF ou pedido para buscar',
        resultados: []
      })
    }

    const isNfSearch = isNaN(Number(termo)) || termo.length > 6

    if (isNfSearch && termo.length < 6) {
      return NextResponse.json({
        success: false,
        message: 'Digite o número completo da NF para buscar',
        resultados: []
      })
    }

    // Montar condições de busca dinamicamente
    const conditions: Record<string, unknown>[] = []

    // Busca por NF (string - exata)
    if (isNfSearch) {
      conditions.push({ nf: { equals: termo } })
    } else {
      // Busca por pedido numérico
      const num = parseInt(termo, 10)
      if (!isNaN(num) && num > 0) {
        conditions.push({ pedido: { equals: num } })
        conditions.push({ cliente: { equals: num } })
      }
    }

    if (conditions.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Termo de busca inválido',
        resultados: []
      })
    }

    const resultados = await db.entrega.findMany({
      where: { OR: conditions },
      select: {
        nf: true,
        pedido: true,
        cliente: true,
        nome: true,
        dataEmissaoNf: true,
        previsaoEntrega: true,
        entregaRealizada: true,
        situacao: true,
        cidade: true,
        uf: true,
        transportadora: true
      },
      take: 20,
      orderBy: { dataEmissaoNf: 'desc' }
    })

    if (resultados.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum resultado encontrado para: ' + termo,
        resultados: []
      })
    }

    return NextResponse.json({
      success: true,
      message: `${resultados.length} resultado(s) encontrado(s)`,
      resultados
    })

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao realizar busca'
    return NextResponse.json({
      success: false,
      message: `Erro: ${msg}`,
      resultados: []
    }, { status: 500 })
  }
}
