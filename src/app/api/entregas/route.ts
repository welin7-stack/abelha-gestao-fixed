import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// ==================== UF → REGIÃO ====================
const UF_REGIAO: Record<string, string> = {
  'AC': 'Norte', 'AM': 'Norte', 'AP': 'Norte', 'PA': 'Norte', 'RO': 'Norte',
  'RR': 'Norte', 'TO': 'Norte',
  'AL': 'Nordeste', 'BA': 'Nordeste', 'CE': 'Nordeste', 'MA': 'Nordeste',
  'PB': 'Nordeste', 'PE': 'Nordeste', 'PI': 'Nordeste', 'RN': 'Nordeste',
  'SE': 'Nordeste',
  'DF': 'Centro-Oeste', 'GO': 'Centro-Oeste', 'MS': 'Centro-Oeste', 'MT': 'Centro-Oeste',
  'ES': 'Sudeste', 'MG': 'Sudeste', 'RJ': 'Sudeste', 'SP': 'Sudeste',
  'PR': 'Sul', 'RS': 'Sul', 'SC': 'Sul',
};

const REGIAO_UFS: Record<string, string[]> = {
  'Norte': ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'],
  'Nordeste': ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
  'Centro-Oeste': ['DF', 'GO', 'MS', 'MT'],
  'Sudeste': ['ES', 'MG', 'RJ', 'SP'],
  'Sul': ['PR', 'RS', 'SC'],
};

const REGIOES_NOMES = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'] as const;

const TRIMESTRE_NOMES: Record<string, string> = {
  'T1': '1º Trimestre (Jan-Mar)',
  'T2': '2º Trimestre (Abr-Jun)',
  'T3': '3º Trimestre (Jul-Set)',
  'T4': '4º Trimestre (Out-Dez)',
};

// ==================== INTERFACES ====================
interface DashboardStats {
  totalEntregas: number;
  entreguesNoPrazo: number;
  entreguesAntecipada: number;
  entreguesComAtraso: number;
  emTransito: number;
  emAtraso: number;
  devolucoes: number;
  freteTotal: number;
  volumeTotal: number;
  pesoTotal: number;
}

interface PorUF {
  uf: string;
  total: number;
  entregues: number;
}

interface PorTransportadora {
  nome: string;
  total: number;
  entregues: number;
  percentual: number;
  volume: number;
  peso: number;
}

interface SituacaoCount {
  situacao: string;
  total: number;
}

interface PorMes {
  mes: string;
  mesNome: string;
  total: number;
  antecipada: number;
  noPrazo: number;
  comAtraso: number;
  emTransito: number;
  emAtraso: number;
  devolucao: number;
}

interface PorRegiao {
  regiao: string;
  total: number;
  entregues: number;
  ufs: string[];
}

interface PorTrimestre {
  trimestre: string;
  trimestreNome: string;
  total: number;
  antecipada: number;
  noPrazo: number;
  comAtraso: number;
  emTransito: number;
  emAtraso: number;
  devolucao: number;
}

const MESES_NOMES: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março',
  '04': 'Abril', '05': 'Maio', '06': 'Junho',
  '07': 'Julho', '08': 'Agosto', '09': 'Setembro',
  '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
};

function mesParaTrimestre(mes: string): string {
  if (['01', '02', '03'].includes(mes)) return 'T1';
  if (['04', '05', '06'].includes(mes)) return 'T2';
  if (['07', '08', '09'].includes(mes)) return 'T3';
  return 'T4';
}

function trimestreKey(trimestre: string): string {
  const mapa: Record<string, string[]> = {
    'T1': ['01', '02', '03'],
    'T2': ['04', '05', '06'],
    'T3': ['07', '08', '09'],
    'T4': ['10', '11', '12'],
  };
  return mapa[trimestre]?.join(',') || '';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uf = searchParams.get('uf');
    const transportadora = searchParams.get('transportadora');
    const situacao = searchParams.get('situacao');
    const busca = searchParams.get('busca');
    const buscaTabela = searchParams.get('buscaTabela');
    const mes = searchParams.get('mes');
    const trimestre = searchParams.get('trimestre');
    const regiao = searchParams.get('regiao');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.max(1, Math.min(9999, parseInt(searchParams.get('limit') || '20', 10) || 20));

    let allEntregas;
    try {
      allEntregas = await db.entrega.findMany();
    } catch (dbError) {
      const msg = dbError instanceof Error ? dbError.message : 'Erro ao conectar ao banco de dados';
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    let entregasFiltradas = [...allEntregas];

    // Filtro por região
    if (regiao && regiao !== 'todos') {
      const ufsRegiao = REGIAO_UFS[regiao] || [];
      entregasFiltradas = entregasFiltradas.filter((e) => ufsRegiao.includes(e.uf));
    }

    if (uf && uf !== 'todos') {
      entregasFiltradas = entregasFiltradas.filter((e) => e.uf === uf);
    }

    if (transportadora && transportadora !== 'todos') {
      entregasFiltradas = entregasFiltradas.filter((e) => e.transportadora === transportadora);
    }

    if (situacao && situacao !== 'todos') {
      entregasFiltradas = entregasFiltradas.filter((e) => e.situacao === situacao);
    }

    // Filtro por mês
    if (mes && mes !== 'todos') {
      entregasFiltradas = entregasFiltradas.filter((e) => !!e.dataEnvio && e.dataEnvio.includes(`-${mes}-`));
    }

    // Filtro por trimestre
    if (trimestre && trimestre !== 'todos') {
      const mesesTrimestre = trimestreKey(trimestre);
      const mesesArr = mesesTrimestre.split(',');
      entregasFiltradas = entregasFiltradas.filter((e) => {
        if (!e.dataEnvio) return false;
        const monthPart = e.dataEnvio.split('-')[1];
        return mesesArr.includes(monthPart);
      });
    }

    if (busca || buscaTabela) {
      const termoBusca = (busca || buscaTabela || '').trim().toLowerCase();
      if (termoBusca) {
        const pedidoNumero = parseInt(termoBusca, 10);

        entregasFiltradas = entregasFiltradas.filter((e) => {
          const safeNome = (e.nome || '').toLowerCase();
          const safeCidade = (e.cidade || '').toLowerCase();
          const safeNf = (e.nf || '').toLowerCase();
          const safeTransp = (e.transportadora || '').toLowerCase();

          const matchTexto =
            safeNome.includes(termoBusca) ||
            safeCidade.includes(termoBusca) ||
            safeNf.includes(termoBusca) ||
            safeTransp.includes(termoBusca);

          const matchPedido = !Number.isNaN(pedidoNumero) && e.pedido === pedidoNumero;
          return matchTexto || matchPedido;
        });
      }
    }

    const totalFiltrado = entregasFiltradas.length;
    const entregasPaginadas = buscaTabela
      ? entregasFiltradas
      : entregasFiltradas.slice((page - 1) * limit, page * limit);

    const stats: DashboardStats = {
      totalEntregas: totalFiltrado,
      entreguesNoPrazo: entregasFiltradas.filter((e) => e.situacao === 'ENTREGUE NO PRAZO').length,
      entreguesAntecipada: entregasFiltradas.filter((e) => e.situacao === 'ENTREGUE ANTECIPADA').length,
      entreguesComAtraso: entregasFiltradas.filter((e) => e.situacao === 'ENTREGUE COM ATRASO').length,
      emTransito: entregasFiltradas.filter((e) => e.situacao === 'EM TRÂNSITO').length,
      emAtraso: entregasFiltradas.filter((e) => e.situacao === 'EM ATRASO').length,
      devolucoes: entregasFiltradas.filter((e) => e.situacao === 'DEVOLUÇÃO').length,
      freteTotal: entregasFiltradas.reduce((sum, e) => sum + (e.valFret || 0), 0),
      volumeTotal: entregasFiltradas.reduce((sum, e) => sum + (e.volume || 0), 0),
      pesoTotal: entregasFiltradas.reduce((sum, e) => sum + (e.pesoBruto || 0), 0),
    };

    // ========== POR UF ==========
    const porUFMap = new Map<string, { total: number; entregues: number }>();
    entregasFiltradas.forEach((e) => {
      const ufKey = e.uf || 'SEM UF';
      if (!porUFMap.has(ufKey)) porUFMap.set(ufKey, { total: 0, entregues: 0 });
      const data = porUFMap.get(ufKey)!;
      data.total++;
      if (e.entregaRealizada) data.entregues++;
    });

    const porUF: PorUF[] = Array.from(porUFMap.entries())
      .map(([uf, data]) => ({ uf, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    // ========== POR TRANSPORTADORA ==========
    const porTranspMap = new Map<string, { total: number; entregues: number; volume: number; peso: number }>();
    entregasFiltradas.forEach((e) => {
      const nomeTransportadora = e.transportadora || 'SEM TRANSPORTADORA';
      if (!porTranspMap.has(nomeTransportadora)) {
        porTranspMap.set(nomeTransportadora, { total: 0, entregues: 0, volume: 0, peso: 0 });
      }
      const data = porTranspMap.get(nomeTransportadora)!;
      data.total++;
      if (e.entregaRealizada) data.entregues++;
      data.volume += e.volume || 0;
      data.peso += e.pesoBruto || 0;
    });

    const porTransportadora: PorTransportadora[] = Array.from(porTranspMap.entries())
      .map(([nome, data]) => ({
        nome,
        ...data,
        percentual: data.total > 0 ? Math.round((data.entregues / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.volume - a.volume);

    // ========== POR SITUAÇÃO ==========
    const porSituacaoMap = new Map<string, number>();
    entregasFiltradas.forEach((e) => {
      const sit = e.situacao || 'OUTROS';
      porSituacaoMap.set(sit, (porSituacaoMap.get(sit) || 0) + 1);
    });

    const porSituacao: SituacaoCount[] = Array.from(porSituacaoMap.entries()).map(([situacao, total]) => ({
      situacao,
      total,
    }));

    // ========== POR MÊS ==========
    const porMesMap = new Map<string, PorMes>();
    entregasFiltradas.forEach((e) => {
      if (!e.dataEnvio) return;
      const parts = e.dataEnvio.split('-');
      if (parts.length < 2) return;
      const year = parts[0];
      const month = parts[1];
      const key = `${year}-${month}`;
      if (!porMesMap.has(key)) {
        porMesMap.set(key, {
          mes: key,
          mesNome: `${MESES_NOMES[month] || month}/${year}`,
          total: 0,
          antecipada: 0,
          noPrazo: 0,
          comAtraso: 0,
          emTransito: 0,
          emAtraso: 0,
          devolucao: 0,
        });
      }
      const data = porMesMap.get(key)!;
      data.total++;
      if (e.situacao === 'ENTREGUE ANTECIPADA') data.antecipada++;
      else if (e.situacao === 'ENTREGUE NO PRAZO') data.noPrazo++;
      else if (e.situacao === 'ENTREGUE COM ATRASO') data.comAtraso++;
      else if (e.situacao === 'EM TRÂNSITO') data.emTransito++;
      else if (e.situacao === 'EM ATRASO') data.emAtraso++;
      else if (e.situacao === 'DEVOLUÇÃO') data.devolucao++;
    });

    const porMes = Array.from(porMesMap.values()).sort((a, b) => a.mes.localeCompare(b.mes));

    // ========== POR TRIMESTRE ==========
    const porTrimestreMap = new Map<string, PorTrimestre>();
    entregasFiltradas.forEach((e) => {
      if (!e.dataEnvio) return;
      const parts = e.dataEnvio.split('-');
      if (parts.length < 2) return;
      const year = parts[0];
      const month = parts[1];
      const tri = mesParaTrimestre(month);
      const key = `${year}-${tri}`;
      if (!porTrimestreMap.has(key)) {
        porTrimestreMap.set(key, {
          trimestre: key,
          trimestreNome: `${TRIMESTRE_NOMES[tri] || tri} ${year}`,
          total: 0,
          antecipada: 0,
          noPrazo: 0,
          comAtraso: 0,
          emTransito: 0,
          emAtraso: 0,
          devolucao: 0,
        });
      }
      const data = porTrimestreMap.get(key)!;
      data.total++;
      if (e.situacao === 'ENTREGUE ANTECIPADA') data.antecipada++;
      else if (e.situacao === 'ENTREGUE NO PRAZO') data.noPrazo++;
      else if (e.situacao === 'ENTREGUE COM ATRASO') data.comAtraso++;
      else if (e.situacao === 'EM TRÂNSITO') data.emTransito++;
      else if (e.situacao === 'EM ATRASO') data.emAtraso++;
      else if (e.situacao === 'DEVOLUÇÃO') data.devolucao++;
    });

    const porTrimestre = Array.from(porTrimestreMap.values()).sort((a, b) => a.trimestre.localeCompare(b.trimestre));

    // ========== POR REGIÃO ==========
    const porRegiaoMap = new Map<string, { total: number; entregues: number; ufs: Set<string> }>();
    entregasFiltradas.forEach((e) => {
      const regiaoNome = UF_REGIAO[e.uf] || 'Outros';
      if (!porRegiaoMap.has(regiaoNome)) {
        porRegiaoMap.set(regiaoNome, { total: 0, entregues: 0, ufs: new Set() });
      }
      const data = porRegiaoMap.get(regiaoNome)!;
      data.total++;
      if (e.entregaRealizada) data.entregues++;
      if (e.uf) data.ufs.add(e.uf);
    });

    const porRegiao: PorRegiao[] = REGIOES_NOMES
      .filter(r => porRegiaoMap.has(r))
      .map(r => {
        const d = porRegiaoMap.get(r)!;
        return {
          regiao: r,
          total: d.total,
          entregues: d.entregues,
          ufs: Array.from(d.ufs).sort(),
        };
      });

    // ========== FILTROS DISPONÍVEIS ==========
    const ufsUnicas = Array.from(new Set(allEntregas.map((e) => e.uf?.trim()))).filter((v): v is string => !!v && v !== '').sort();
    const transpsUnicas = Array.from(new Set(allEntregas.map((e) => e.transportadora?.trim()))).filter((v): v is string => !!v && v !== '').sort();
    const sitsUnicas = Array.from(new Set(allEntregas.map((e) => e.situacao?.trim()))).filter((v): v is string => !!v && v !== '').sort();
    const mesesUnicos = Array.from(
      new Set(
        allEntregas
          .map((e) => (e.dataEnvio ? e.dataEnvio.split('-')[1] : null))
          .filter((v): v is string => v !== null && v !== '')
      )
    );
    mesesUnicos.sort();

    const trimestresUnicos = Array.from(
      new Set(mesesUnicos.map((m) => mesParaTrimestre(m)))
    ).sort();

    const regioesUnicas = Array.from(
      new Set(
        ufsUnicas.map(uf => UF_REGIAO[uf as keyof typeof UF_REGIAO]).filter(Boolean)
      )
    ).sort();

    return NextResponse.json({
      entregas: entregasPaginadas,
      stats,
      porUF,
      porTransportadora,
      porSituacao,
      porMes,
      porTrimestre,
      porRegiao,
      filtros: {
        ufs: ufsUnicas,
        transportadoras: transpsUnicas,
        situacoes: sitsUnicas,
        meses: mesesUnicos,
        trimestres: trimestresUnicos,
        regioes: regioesUnicas,
      },
      paginacao: {
        page,
        limit,
        total: totalFiltrado,
        totalPages: Math.ceil(totalFiltrado / limit),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro interno ao buscar entregas';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await db.entrega.deleteMany({});
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro ao limpar dados';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
