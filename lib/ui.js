/**
 * SV Multimarcas — Biblioteca compartilhada da interface
 * Usada pelo site público e pelo painel admin.
 */
(function (global) {
  'use strict';

  /* ---------------------------------------------------------
     FORMATAÇÃO
     --------------------------------------------------------- */
  const fmt = {
    preco(valor) {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL'
      }).format(valor || 0);
    },

    numero(valor) {
      return new Intl.NumberFormat('pt-BR').format(valor || 0);
    },

    km(valor) {
      return new Intl.NumberFormat('pt-BR').format(valor || 0) + ' km';
    },

    data(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      if (isNaN(d)) return '—';
      return d.toLocaleDateString('pt-BR');
    },

    dataHora(iso) {
      if (!iso) return '—';
      const d = new Date(iso);
      if (isNaN(d)) return '—';
      return d.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    },

    telefone(valor) {
      const d = String(valor || '').replace(/\D/g, '');
      if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
      if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
      return valor || '';
    }
  };

  /* ---------------------------------------------------------
     MÁSCARAS DE ENTRADA
     --------------------------------------------------------- */
  const mask = {
    /** (11) 99999-9999 */
    telefone(input) {
      const aplicar = () => {
        let v = input.value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 6) v = v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        else if (v.length > 0) v = v.replace(/(\d{0,2})/, '($1');
        input.value = v;
      };
      input.addEventListener('input', aplicar);
      if (input.value) aplicar();
    },

    /** 99975-4932 (sem DDD) */
    telefoneSemDDD(input) {
      const aplicar = () => {
        let v = input.value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 5) v = v.replace(/(\d{5})(\d{0,4})/, '$1-$2');
        input.value = v;
      };
      input.addEventListener('input', aplicar);
      if (input.value) aplicar();
    },

    /** 12.345,67 */
    numero(input) {
      const aplicar = () => {
        let v = input.value.replace(/[^\d,.-]/g, '');
        v = v.replace(/\./g, '').replace(',', '.');
        let [inteiro = '0', decimal] = v.split('.');
        inteiro = inteiro.replace(/^0+(?=\d)/, '');
        decimal = (decimal || '').slice(0, 2);
        input.value = decimal !== undefined
          ? Number(inteiro).toLocaleString('pt-BR') + ',' + decimal
          : Number(inteiro || 0).toLocaleString('pt-BR');
      };
      input.addEventListener('input', aplicar);
    },

    /** R$ 12.345,67 */
    moeda(input) {
      const aplicar = () => {
        let v = input.value.replace(/[^\d,.-]/g, '');
        v = v.replace(/\./g, '').replace(',', '.');
        let [inteiro = '0', decimal] = v.split('.');
        inteiro = inteiro.replace(/^0+(?=\d)/, '');
        decimal = (decimal || '').slice(0, 2);
        input.value = 'R$ ' + Number(inteiro || 0).toLocaleString('pt-BR') +
          (decimal !== undefined ? ',' + decimal : '');
      };
      input.addEventListener('input', aplicar);
      if (input.value) aplicar();
    },

    /** Placa ABC1234 / ABC1D23 */
    placa(input) {
      const aplicar = () => {
        let v = input.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
        if (v.length === 7 && !v.includes('-')) {
          v = v.slice(0, 3) + '-' + v.slice(3);
        }
        input.value = v;
      };
      input.addEventListener('input', aplicar);
    }
  };

  /* ---------------------------------------------------------
     VALIDAÇÃO
     --------------------------------------------------------- */
  const validar = {
    nome(v) {
      if (!v) return 'Informe seu nome.';
      if (v.length < 3) return 'Nome muito curto.';
      if (!/\s/.test(v.trim())) return 'Informe nome e sobrenome.';
      return '';
    },

    telefone(v) {
      const d = String(v || '').replace(/\D/g, '');
      if (!d) return 'Informe seu telefone.';
      if (d.length < 10) return 'Telefone incompleto.';
      if (d.length > 11) return 'Telefone inválido.';
      return '';
    },

    email(v) {
      if (!v) return ''; // opcional
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'E-mail inválido.';
      return '';
    },

    veiculo(v) {
      if (!v) return 'Informe o veículo.';
      if (v.length < 3) return 'Descreva o veículo.';
      return '';
    },

    moeda(v) {
      const n = Number(String(v || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.'));
      if (!v) return 'Informe o valor.';
      if (isNaN(n) || n <= 0) return 'Valor inválido.';
      return '';
    }
  };

  /* ---------------------------------------------------------
     FEEDBACK DE ERRO EM CAMPOS
     --------------------------------------------------------- */
  function marcarCampo(input, mensagem) {
    if (!input) return;
    const campo = input.closest('.form-group') || input.parentElement;
    if (!campo) return;

    let erro = campo.querySelector('.campo-erro');
    if (mensagem) {
      if (!erro) {
        erro = document.createElement('p');
        erro.className = 'campo-erro';
        campo.appendChild(erro);
      }
      erro.textContent = mensagem;
      campo.classList.add('campo-invalido');
      input.setAttribute('aria-invalid', 'true');
    } else {
      if (erro) erro.remove();
      campo.classList.remove('campo-invalido');
      input.removeAttribute('aria-invalid');
    }
  }

  /**
   * Aplica máscaras e validação a um formulário.
   * @param {HTMLFormElement} form
   * @param {Object} regras  { campoId: 'nome' | 'telefone' | ... }
   */
  function validarFormulario(form, regras) {
    let ok = true;
    let primeiro = null;

    Object.keys(regras).forEach((id) => {
      const input = form.querySelector('#' + id);
      if (!input) return;
      const msg = validar[regras[id]](input.value.trim());
      marcarCampo(input, msg);
      if (msg) {
        ok = false;
        if (!primeiro) primeiro = input;
      }
    });

    if (primeiro) {
      primeiro.focus();
      primeiro.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return ok;
  }

  /* ---------------------------------------------------------
     WHATSAPP
     --------------------------------------------------------- */
  function linkWhatsApp(mensagem, numero) {
    const cfg = global.SV_CONFIG || {};
    const num = numero || cfg.whatsapp || '';
    const base = `https://wa.me/${num}?text=`;
    return base + encodeURIComponent(mensagem || 'Olá SV Multimarcas!');
  }

  function abrirWhatsApp(mensagem) {
    const url = linkWhatsApp(mensagem);
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) window.location.href = url;
  }

  /* ---------------------------------------------------------
     ENVIO DE LEADS
     Salva no Supabase (via endpoint /api/leads) e SEMPRE
     oferece o WhatsApp como canal principal.
     --------------------------------------------------------- */
  async function enviarLead(dados) {
    const cfg = global.SV_CONFIG || {};
    const endpoint = cfg.endpointLeads || '/api/leads';

    // Validação mínima no cliente
    if (!dados.nome || !dados.telefone) {
      throw new Error('Nome e telefone são obrigatórios.');
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      if (res.ok) {
        return { salvo: true, canal: 'server' };
      }
      // Endpoint respondeu com erro — ainda abrimos o WhatsApp
      console.warn('[SV] Falha ao salvar lead:', res.status);
      return { salvo: false, canal: 'whatsapp' };
    } catch (err) {
      // Sem backend (ex.: abrindo via file://) — modo WhatsApp
      console.warn('[SV] Endpoint indisponível, usando WhatsApp:', err.message);
      return { salvo: false, canal: 'whatsapp' };
    }
  }

  /* ---------------------------------------------------------
     FOTOS DO VEÍCULO
     Estrutura: fotos.frente | fotos.interior | fotos.traseira | fotos.extras[]
     Cada uma pode apontar para images/placeholder-veiculo.svg
     enquanto a foto real não for enviada.
     --------------------------------------------------------- */
  const PLACEHOLDER = 'placeholder-veiculo';

  const ANGULOS = [
    { chave: 'frente', label: 'Frente' },
    { chave: 'interior', label: 'Interior' },
    { chave: 'traseira', label: 'Traseira' }
  ];

  function temFotoReal(src) {
    return !!src && String(src).indexOf(PLACEHOLDER) === -1;
  }

  /** Galeria ordenada: frente, interior, traseira, extras. */
  function galeria(veiculo) {
    const f = (veiculo && veiculo.fotos) || {};
    const itens = [];
    ANGULOS.forEach(a => {
      itens.push({
        src: f[a.chave] || 'images/placeholder-veiculo.svg',
        angulo: a.chave,
        label: a.label,
        real: temFotoReal(f[a.chave])
      });
    });
    (f.extras || []).forEach((src, i) => {
      itens.push({
        src: src,
        angulo: 'extra' + (i + 1),
        label: 'Detalhe ' + (i + 1),
        real: temFotoReal(src)
      });
    });
    return itens;
  }

  /** Foto de capa (frente) — usada no card do estoque. */
  function fotoCapa(veiculo) {
    const f = (veiculo && veiculo.fotos) || {};
    return f.frente || (veiculo && veiculo.imagens && veiculo.imagens[0]) || 'images/placeholder-veiculo.svg';
  }

  /**
   * Monta um srcset responsivo a partir do nome do arquivo.
   * Ex.: 'images/hero.webp' -> 'images/hero-400.webp 400w, ...'
   * Se as variantes nao existirem, devolve string vazia.
   */
  function srcset(src) {
    if (!src || !/\.(webp|jpg|jpeg|png)$/i.test(src)) return '';
    const base = src.replace(/\.(webp|jpg|jpeg|png)$/i, '');
    const ext = src.match(/\.(webp|jpg|jpeg|png)$/i)[1];
    const variantes = [400, 800, 1200, 1600]
      .map(w => base + '-' + w + '.' + ext)
      .filter(v => v !== src);
    if (!variantes.length) return '';
    return variantes.map((v, i) => v + ' ' + [400, 800, 1200, 1600][i] + 'w').join(', ');
  }

  /** Ângulos obrigatórios que ainda estão sem foto real. */
  function fotosPendentes(veiculo) {
    return ANGULOS
      .filter(a => !temFotoReal((veiculo.fotos || {})[a.chave]))
      .map(a => a.label);
  }

  function temFotosCompletas(veiculo) {
    return fotosPendentes(veiculo).length === 0;
  }

  /* ---------------------------------------------------------
     COMPRESSAO DE IMAGEM (no navegador)
     Fotos de celular chegam com 3-10 MB e em HEIC/AVIF.
     Redimensionar e converter para JPEG antes de enviar:
       - resolve o limite de payload da Vercel (4,5 MB)
       - resolve o formato HEIC que o servidor nao aceita
       - a foto ja fica otimizada para o site
     --------------------------------------------------------- */
  function comprimirImagem(file, opcoes = {}) {
    const maxDimensao = opcoes.maxDimensao || 1600;
    const qualidade = opcoes.qualidade || 0.85;
    const formato = opcoes.formato || 'image/jpeg';

    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('Arquivo invalido.'));

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          const largura = img.naturalWidth || img.width;
          const altura = img.naturalHeight || img.height;
          if (!largura || !altura) throw new Error('Nao foi possivel ler a imagem.');

          const escala = Math.min(1, maxDimensao / Math.max(largura, altura));
          const w = Math.round(largura * escala);
          const h = Math.round(altura * escala);

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);

          const dataUrl = canvas.toDataURL(formato, qualidade);
          URL.revokeObjectURL(objectUrl);

          resolve({
            dataUrl,
            tipo: formato,
            largura: w,
            altura: h,
            bytes: Math.round((dataUrl.length * 3) / 4),
            redimiu: escala < 1
          });
        } catch (e) {
          URL.revokeObjectURL(objectUrl);
          reject(e);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(
          'O navegador nao conseguiu ler este arquivo. ' +
          'Se for HEIC (iPhone), converta para JPEG antes de enviar.'
        ));
      };

      img.src = objectUrl;
    });
  }

  /* ---------------------------------------------------------
     UTILITÁRIOS DOM
     --------------------------------------------------------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function debounce(fn, wait) {
    let t;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(ctx, args), wait || 250);
    };
  }

  /* ---------------------------------------------------------
     CONTROLE DE SCROLL (evita scroll jump ao abrir menu)
     --------------------------------------------------------- */
  function lockScroll(lock) {
    const body = document.body;
    if (lock) {
      const largura = window.innerWidth - document.documentElement.clientWidth;
      body.style.overflow = 'hidden';
      if (largura > 0) body.style.paddingRight = largura + 'px';
    } else {
      body.style.overflow = '';
      body.style.paddingRight = '';
    }
  }

  /* ---------------------------------------------------------
     ESTIMATIVA DE PARCELA (simulação simples, só ilustrativa)
     --------------------------------------------------------- */
  function estimarParcela({ preco, entrada, renda, prazo }) {
    const p = Number(preco) || 0;
    const e = Number(entrada) || 0;
    const r = Number(renda) || 0;
    const n = Number(prazo) || 0;
    if (!p || !n) return null;

    const financed = Math.max(p - e, 0);
    if (financed <= 0) return { parcela: 0, total: 0, taxa: 0.0199, valorFinanciado: 0 };

    // Taxa nominal anual + encargos aproximados (CET ~19,9% a.a.)
    const taxaMensal = 0.0199 / 12;
    const parcela = financed * taxaMensal / (1 - Math.pow(1 + taxaMensal, -n));
    const total = parcela * n;

    return {
      parcela: Math.round(parcela),
      total: Math.round(total),
      taxa: 0.0199,
      valorFinanciado: financed,
      comprometimento: r ? Math.round((parcela / r) * 100) : null
    };
  }

  /* ---------------------------------------------------------
     EXPORT
     --------------------------------------------------------- */
  global.SV = {
    fmt, mask, validar, validarFormulario, marcarCampo,
    linkWhatsApp, abrirWhatsApp, enviarLead,
    $, $$, escapeHtml, debounce, lockScroll, estimarParcela,
    galeria, fotoCapa, fotosPendentes, temFotosCompletas, temFotoReal, ANGULOS, srcset,
    comprimirImagem
  };
})(window);
