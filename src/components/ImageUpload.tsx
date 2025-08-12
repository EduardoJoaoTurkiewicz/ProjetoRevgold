import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadCheckImage, deleteCheckImage, getCheckImageUrl, isSupabaseConfigured } from '../lib/supabase';

interface ImageUploadProps {
  checkId: string;
  imageType: 'front' | 'back';
  currentImage?: string;
  onImageUploaded: (imageUrl: string) => void;
  onImageDeleted: () => void;
  label: string;
}

export function ImageUpload({ 
  checkId, 
  imageType, 
  currentImage, 
  onImageUploaded, 
  onImageDeleted, 
  label 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImage ? getCheckImageUrl(currentImage) : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSupabaseConfigured()) {
      alert('Upload de imagens não está disponível. Configure o Supabase para usar esta funcionalidade.');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setIsUploading(true);

    try {
      // Criar preview local
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // Fazer upload para Supabase
      const imageUrl = await uploadCheckImage(file, checkId, imageType);
      
      // Notificar componente pai
      onImageUploaded(imageUrl);
      
      // Limpar preview local e usar URL do Supabase
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(imageUrl);
      
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload da imagem. Tente novamente.');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!currentImage) return;

    if (!isSupabaseConfigured()) {
      alert('Funcionalidade de imagens não está disponível. Configure o Supabase para usar esta funcionalidade.');
      return;
    }

    if (!confirm('Tem certeza que deseja remover esta imagem?')) return;

    try {
      await deleteCheckImage(currentImage);
      setPreviewUrl(null);
      onImageDeleted();
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      alert('Erro ao remover imagem. Tente novamente.');
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      
      {!isSupabaseConfigured() && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ Upload de imagens não disponível. Configure o Supabase para usar esta funcionalidade.
          </p>
        </div>
      )}
      
      <div className="relative">
        {previewUrl ? (
          <div className="relative group">
            <img
              src={previewUrl}
              alt={label}
              className="w-full h-48 object-cover rounded-xl border-2 border-green-200 shadow-lg"
            />
            
            {/* Overlay com ações */}
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleClick}
                disabled={isUploading}
                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                title="Alterar imagem"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </button>
              
              <button
                type="button"
                onClick={handleDeleteImage}
                className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Remover imagem"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={handleClick}
            className={`
              border-2 border-dashed border-green-300 rounded-xl p-8 text-center cursor-pointer
              ${isSupabaseConfigured() ? 'hover:border-green-400 hover:bg-green-50' : 'opacity-50 cursor-not-allowed'}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
              transition-all duration-300
            `}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
                <p className="text-green-700 font-semibold">Fazendo upload...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <ImageIcon className="w-12 h-12 text-green-500" />
                <div>
                  <p className="text-green-700 font-semibold mb-2">
                    {isSupabaseConfigured() 
                      ? `Clique para adicionar ${label.toLowerCase()}`
                      : 'Upload não disponível'
                    }
                  </p>
                  {isSupabaseConfigured() && (
                    <p className="text-sm text-green-600">
                      Formatos aceitos: JPG, PNG, GIF (máx. 5MB)
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
          disabled={!isSupabaseConfigured() || isUploading}
        />
      </div>
      
      {previewUrl && (
        <p className="text-sm text-green-600 mt-2 font-semibold">
          ✓ Imagem carregada com sucesso
        </p>
      )}
    </div>
  );
}