import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import '../../styles/print-labels.css';

interface ProducaoData {
  id: string;
  titulo: string;
  lote: string;
  fabricacao_date: string;
  validade_date: string;
}

interface ItemData {
  id: string;
  quantidade: number;
  nomeProduto: string;
  nomeVariacao: string;
  nomeCor: string | null;
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function ProductionLabelsPrint() {
  const { id } = useParams<{ id: string }>();
  const [producao, setProducao] = useState<ProducaoData | null>(null);
  const [itens, setItens] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('ID de produção não informado.');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const { data: prod, error: prodError } = await supabase
          .from('producoes')
          .select('id, titulo, lote, fabricacao_date, validade_date')
          .eq('id', id)
          .maybeSingle();

        if (prodError) throw prodError;
        if (!prod) throw new Error('Produção não encontrada.');

        const { data: rawItens, error: itensError } = await supabase
          .from('producao_itens')
          .select(`
            id,
            quantidade,
            estoque_produtos(nome),
            estoque_variacoes(nome_variacao),
            estoque_cores(nome_cor)
          `)
          .eq('producao_id', id);

        if (itensError) throw itensError;

        const mapped: ItemData[] = (rawItens || []).map((row: any) => ({
          id: row.id,
          quantidade: Number(row.quantidade),
          nomeProduto: row.estoque_produtos?.nome ?? '',
          nomeVariacao: row.estoque_variacoes?.nome_variacao ?? '',
          nomeCor: row.estoque_cores?.nome_cor ?? null,
        }));

        setProducao(prod);
        setItens(mapped);
      } catch (err: any) {
        setError(err?.message ?? 'Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  useEffect(() => {
    if (!loading && !error && producao) {
      const timer = setTimeout(() => window.print(), 350);
      window.onafterprint = () => window.close();
      return () => clearTimeout(timer);
    }
  }, [loading, error, producao]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Arial, sans-serif', color: '#374151' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Carregando etiquetas...</div>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>Aguarde um momento</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Arial, sans-serif', color: '#374151' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: '#ef4444' }}>Erro ao carregar etiquetas</div>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>{error}</div>
          <button
            onClick={() => window.close()}
            style={{ padding: '10px 24px', background: '#f97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  if (!producao) return null;

  const etiquetas: React.ReactNode[] = [];
  itens.forEach(item => {
    const descricao = [item.nomeVariacao, item.nomeCor].filter(Boolean).join(' · ');
    for (let i = 0; i < item.quantidade; i++) {
      etiquetas.push(
        <div key={`${item.id}-${i}`} className="label">
          <div className="label-header">
            <div className="logo-box">MT</div>
            <div className="marca">Montreal Tintas</div>
          </div>
          <div className="produto">{item.nomeProduto}</div>
          {descricao && <div className="descricao">{descricao}</div>}
          <div className="separator" />
          <div className="info-row">
            <span className="info-label">LOTE</span>
            <span className="info-value lote">{producao.lote}</span>
          </div>
          <div className="info-row">
            <span className="info-label">FAB.</span>
            <span className="info-value">{formatDateBR(producao.fabricacao_date)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">VAL.</span>
            <span className="info-value">{formatDateBR(producao.validade_date)}</span>
          </div>
        </div>
      );
    }
  });

  return (
    <>
      <div
        className="no-print-bar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: '#1e293b',
          color: '#fff',
          padding: '8px 16px',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 9999,
          fontFamily: 'Arial, sans-serif',
          fontSize: '13px',
          fontWeight: 600,
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span>
            Etiquetas: <strong>{producao.lote}</strong> — {etiquetas.length} etiqueta{etiquetas.length !== 1 ? 's' : ''}
          </span>
          <span
            className="no-print-warning"
            style={{
              fontSize: '11px',
              color: '#fbbf24',
              fontWeight: 500,
            }}
          >
            Para imprimir correto: Margens = Nenhuma, Escala = 100%, Paginas por folha = 1.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => window.print()}
            style={{
              padding: '6px 18px',
              background: '#f97316',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Imprimir
          </button>
          <button
            onClick={() => window.close()}
            style={{
              padding: '6px 18px',
              background: '#475569',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Fechar
          </button>
        </div>
      </div>

      <div className="labels-root">
        {etiquetas}
      </div>
    </>
  );
}
