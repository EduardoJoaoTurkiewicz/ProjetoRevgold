import React, { useState, useEffect } from 'react';
import { X, Plus, Tag, ChevronDown } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import type { ClienteFormData, Cliente } from '../../types';
import {
  aplicarMascaraCPF,
  aplicarMascaraCNPJ,
  validarCPF,
  validarCNPJ,
} from '../../lib/clienteService';

const UFS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const EMPTY_FORM: ClienteFormData = {
  tipo: 'PJ',
  razaoSocial: '',
  nomeFantasia: '',
  nomeCompleto: '',
  cnpj: '',
  cpf: '',
  telefone: '',
  email: '',
  enderecoRua: '',
  enderecoNumero: '',
  enderecoBairro: '',
  enderecoCidade: '',
  enderecoUf: '',
  enderecoCep: '',
  enderecoComplemento: '',
  vendedorResponsavelId: '',
  tags: [],
};

interface Props {
  onClose: () => void;
  clienteParaEditar?: Cliente | null;
}

export function ClienteFormModal({ onClose, clienteParaEditar }: Props) {
  const { employees, createCliente, updateCliente } = useAppContext();
  const [form, setForm] = useState<ClienteFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ClienteFormData, string>>>({});
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const vendedores = employees.filter((e: any) => e.isSeller);
  const isEditing = !!clienteParaEditar;

  useEffect(() => {
    if (clienteParaEditar) {
      setForm({
        tipo: clienteParaEditar.tipo,
        razaoSocial: clienteParaEditar.razaoSocial ?? '',
        nomeFantasia: clienteParaEditar.nomeFantasia ?? '',
        nomeCompleto: clienteParaEditar.nomeCompleto ?? '',
        cnpj: clienteParaEditar.cnpj
          ? clienteParaEditar.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
          : '',
        cpf: clienteParaEditar.cpf
          ? clienteParaEditar.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
          : '',
        telefone: clienteParaEditar.telefone ?? '',
        email: clienteParaEditar.email ?? '',
        enderecoRua: clienteParaEditar.enderecoRua ?? '',
        enderecoNumero: clienteParaEditar.enderecoNumero ?? '',
        enderecoBairro: clienteParaEditar.enderecoBairro ?? '',
        enderecoCidade: clienteParaEditar.enderecoCidade ?? '',
        enderecoUf: clienteParaEditar.enderecoUf ?? '',
        enderecoCep: clienteParaEditar.enderecoCep ?? '',
        enderecoComplemento: clienteParaEditar.enderecoComplemento ?? '',
        vendedorResponsavelId: clienteParaEditar.vendedorResponsavelId ?? '',
        tags: clienteParaEditar.tags ?? [],
      });
    }
  }, [clienteParaEditar]);

  const set = (field: keyof ClienteFormData, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof ClienteFormData, string>> = {};

    if (form.tipo === 'PJ') {
      if (!form.razaoSocial.trim()) errs.razaoSocial = 'Razão Social é obrigatória';
      if (!form.nomeFantasia.trim()) errs.nomeFantasia = 'Nome Fantasia é obrigatório';
      if (!form.cnpj.trim()) {
        errs.cnpj = 'CNPJ é obrigatório';
      } else if (!validarCNPJ(form.cnpj)) {
        errs.cnpj = 'CNPJ inválido';
      }
      if (!form.telefone.trim()) errs.telefone = 'Telefone é obrigatório';
      if (!form.enderecoRua.trim()) errs.enderecoRua = 'Rua é obrigatória';
      if (!form.enderecoNumero.trim()) errs.enderecoNumero = 'Número é obrigatório';
      if (!form.enderecoBairro.trim()) errs.enderecoBairro = 'Bairro é obrigatório';
    } else {
      if (!form.nomeCompleto.trim()) errs.nomeCompleto = 'Nome completo é obrigatório';
      if (!form.cpf.trim()) {
        errs.cpf = 'CPF é obrigatório';
      } else if (!validarCPF(form.cpf)) {
        errs.cpf = 'CPF inválido';
      }
    }

    if (!form.enderecoCidade.trim()) errs.enderecoCidade = 'Cidade é obrigatória';
    if (!form.enderecoUf) errs.enderecoUf = 'UF é obrigatória';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEditing && clienteParaEditar) {
        await updateCliente(clienteParaEditar.id, form);
      } else {
        await createCliente(form);
      }
      onClose();
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      set('tags', [...form.tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    set('tags', form.tags.filter(t => t !== tag));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-8 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-black text-slate-800">
              {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {isEditing ? 'Atualize os dados do cadastro' : 'Preencha os dados para cadastrar'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-8 space-y-6">
          <div className="flex gap-4">
            {(['PJ', 'PF'] as const).map(tipo => (
              <label key={tipo} className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  form.tipo === tipo
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-slate-300 group-hover:border-blue-400'
                }`}>
                  {form.tipo === tipo && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className={`font-semibold ${form.tipo === tipo ? 'text-blue-700' : 'text-slate-500'}`}>
                  {tipo === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                </span>
                <input
                  type="radio"
                  className="sr-only"
                  checked={form.tipo === tipo}
                  onChange={() => set('tipo', tipo)}
                />
              </label>
            ))}
          </div>

          {form.tipo === 'PJ' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Razão Social" required error={errors.razaoSocial}>
                  <input
                    type="text"
                    value={form.razaoSocial}
                    onChange={e => set('razaoSocial', e.target.value)}
                    className={inputCls(errors.razaoSocial)}
                    placeholder="Nome empresarial"
                  />
                </Field>
              </div>
              <Field label="Nome Fantasia" required error={errors.nomeFantasia}>
                <input
                  type="text"
                  value={form.nomeFantasia}
                  onChange={e => set('nomeFantasia', e.target.value)}
                  className={inputCls(errors.nomeFantasia)}
                  placeholder="Nome comercial"
                />
              </Field>
              <Field label="CNPJ" required error={errors.cnpj}>
                <input
                  type="text"
                  value={form.cnpj}
                  onChange={e => set('cnpj', aplicarMascaraCNPJ(e.target.value))}
                  className={inputCls(errors.cnpj)}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </Field>
              <Field label="Telefone / WhatsApp" required error={errors.telefone}>
                <input
                  type="text"
                  value={form.telefone}
                  onChange={e => set('telefone', e.target.value)}
                  className={inputCls(errors.telefone)}
                  placeholder="(00) 00000-0000"
                />
              </Field>
              <Field label="E-mail" error={errors.email}>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  className={inputCls(errors.email)}
                  placeholder="contato@empresa.com"
                />
              </Field>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Field label="Nome Completo" required error={errors.nomeCompleto}>
                  <input
                    type="text"
                    value={form.nomeCompleto}
                    onChange={e => set('nomeCompleto', e.target.value)}
                    className={inputCls(errors.nomeCompleto)}
                    placeholder="Nome completo do cliente"
                  />
                </Field>
              </div>
              <Field label="CPF" required error={errors.cpf}>
                <input
                  type="text"
                  value={form.cpf}
                  onChange={e => set('cpf', aplicarMascaraCPF(e.target.value))}
                  className={inputCls(errors.cpf)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </Field>
              <Field label="Telefone / WhatsApp" error={errors.telefone}>
                <input
                  type="text"
                  value={form.telefone}
                  onChange={e => set('telefone', e.target.value)}
                  className={inputCls(errors.telefone)}
                  placeholder="(00) 00000-0000"
                />
              </Field>
              <div className="col-span-2">
                <Field label="E-mail" error={errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    className={inputCls(errors.email)}
                    placeholder="cliente@email.com"
                  />
                </Field>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-4">Endereço</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <Field
                  label="Rua / Logradouro"
                  required={form.tipo === 'PJ'}
                  error={errors.enderecoRua}
                >
                  <input
                    type="text"
                    value={form.enderecoRua}
                    onChange={e => set('enderecoRua', e.target.value)}
                    className={inputCls(errors.enderecoRua)}
                    placeholder="Rua, Avenida, Travessa..."
                  />
                </Field>
              </div>
              <Field label="Número" required={form.tipo === 'PJ'} error={errors.enderecoNumero}>
                <input
                  type="text"
                  value={form.enderecoNumero}
                  onChange={e => set('enderecoNumero', e.target.value)}
                  className={inputCls(errors.enderecoNumero)}
                  placeholder="Nº"
                />
              </Field>
              <Field label="Bairro" required={form.tipo === 'PJ'} error={errors.enderecoBairro}>
                <input
                  type="text"
                  value={form.enderecoBairro}
                  onChange={e => set('enderecoBairro', e.target.value)}
                  className={inputCls(errors.enderecoBairro)}
                  placeholder="Bairro"
                />
              </Field>
              <div className="col-span-2">
                <Field label="Cidade" required error={errors.enderecoCidade}>
                  <input
                    type="text"
                    value={form.enderecoCidade}
                    onChange={e => set('enderecoCidade', e.target.value)}
                    className={inputCls(errors.enderecoCidade)}
                    placeholder="Cidade"
                  />
                </Field>
              </div>
              <Field label="UF" required error={errors.enderecoUf}>
                <div className="relative">
                  <select
                    value={form.enderecoUf}
                    onChange={e => set('enderecoUf', e.target.value)}
                    className={`${inputCls(errors.enderecoUf)} appearance-none pr-8`}
                  >
                    <option value="">UF</option>
                    {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </Field>
              <Field label="CEP" error={errors.enderecoCep}>
                <input
                  type="text"
                  value={form.enderecoCep}
                  onChange={e => set('enderecoCep', e.target.value)}
                  className={inputCls(errors.enderecoCep)}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </Field>
              <div className="col-span-3">
                <Field label="Complemento / Referência" error={errors.enderecoComplemento}>
                  <input
                    type="text"
                    value={form.enderecoComplemento}
                    onChange={e => set('enderecoComplemento', e.target.value)}
                    className={inputCls(errors.enderecoComplemento)}
                    placeholder="Apartamento, sala, referência..."
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Vendedor Responsável" error={errors.vendedorResponsavelId}>
              <div className="relative">
                <select
                  value={form.vendedorResponsavelId}
                  onChange={e => set('vendedorResponsavelId', e.target.value)}
                  className={`${inputCls(errors.vendedorResponsavelId)} appearance-none pr-8`}
                >
                  <option value="">Nenhum</option>
                  {vendedores.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </Field>

            <Field label="Tags">
              <div className={`${inputCls(undefined)} min-h-[42px] flex flex-wrap gap-1 items-center p-0 overflow-hidden`}>
                <div className="flex flex-wrap gap-1 px-3 py-1.5 flex-1 items-center">
                  {form.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addTag(); }
                      if (e.key === ',') { e.preventDefault(); addTag(); }
                    }}
                    placeholder={form.tags.length === 0 ? 'Digite e pressione Enter' : ''}
                    className="outline-none text-sm text-slate-700 min-w-[80px] flex-1 bg-transparent"
                  />
                </div>
                <button
                  type="button"
                  onClick={addTag}
                  className="px-2 self-stretch flex items-center border-l border-slate-200 text-slate-400 hover:text-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </Field>
          </div>
        </form>

        <div className="flex justify-end gap-3 px-8 py-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit as any}
            disabled={saving}
            className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 text-white hover:from-blue-700 hover:to-sky-700 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              isEditing ? 'Salvar Alterações' : 'Cadastrar Cliente'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function inputCls(error?: string) {
  return `w-full px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors outline-none focus:ring-2 focus:ring-blue-300 ${
    error
      ? 'border-red-400 bg-red-50 text-red-700'
      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 focus:border-blue-400'
  }`;
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
    </div>
  );
}
