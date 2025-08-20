import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImage ? getCheckImageUrl(currentImage) : null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return 'Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF, WebP).';
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return 'A imagem deve ter no máximo 10MB.';
    }

    // Validar extensões permitidas
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return 'Formato de arquivo não suportado. Use JPG, PNG, GIF ou WebP.';
    }

    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validar arquivo
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    if (!isSupabaseConfigured()) {
      setUploadError('Upload de imagens não está disponível. Configure o Supabase nas variáveis de ambiente para usar esta funcionalidade.');
      return;
    }

    setIsUploading(true);

    try {
      // Criar preview local imediatamente
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);

      // Fazer upload para Supabase
      const imageUrl = await uploadCheckImage(file, checkId, imageType);
      
      // Notificar componente pai sobre o sucesso
      onImageUploaded(imageUrl);
      
      // Limpar preview local e usar URL do Supabase
      URL.revokeObjectURL(localPreview);
      setPreviewUrl(imageUrl);
      
      console.log('Upload realizado com sucesso:', imageUrl);
      
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      setUploadError(
        error instanceof Error 
          ? `Erro no upload: ${error.message}` 
          : 'Erro desconhecido ao fazer upload da imagem. Tente novamente.'
      );
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Limpar input para permitir re-upload do mesmo arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async () => {
    if (!currentImage) return;

    if (!isSupabaseConfigured()) {
      setUploadError('Funcionalidade de imagens não está disponível. Configure o Supabase nas variáveis de ambiente.');
      return;
    }

    if (!confirm('Tem certeza que deseja remover esta imagem?')) return;

    setUploadError(null);

    try {
      await deleteCheckImage(currentImage);
      setPreviewUrl(null);
      onImageDeleted();
      console.log('Imagem removida com sucesso');
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
      setUploadError(
        error instanceof Error 
          ? `Erro ao remover: ${error.message}` 
          : 'Erro ao remover imagem. Tente novamente.'
      );
    }
  };

  const handleClick = () => {
    if (!isUploading && isSupabaseConfigured()) {
      fileInputRef.current?.click();
    }
  };

  const handleImageError = () => {
    console.warn('Erro ao carregar imagem:', previewUrl);
    setPreviewUrl(null);
    setUploadError('Erro ao carregar a imagem. A imagem pode ter sido removida ou corrompida.');
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      
      {!isSupabaseConfigured() && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-800 font-medium">
                Upload de imagens não disponível
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env para usar esta funcionalidade.
              </p>
            </div>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-800 font-medium">Erro no upload</p>
              <p className="text-xs text-red-700 mt-1">{uploadError}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="relative">
        {previewUrl ? (
          <div className="relative group">
            <img
              src={previewUrl}
              alt={label}
              className="w-full h-48 object-cover rounded-xl border-2 border-green-200 shadow-lg"
              onError={handleImageError}
              onLoad={() => console.log('Imagem carregada com sucesso:', previewUrl)}
            />
            
            {/* Overlay com ações */}
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleClick}
                disabled={isUploading || !isSupabaseConfigured()}
                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={isUploading}
                className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remover imagem"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Indicador de upload */}
            {isUploading && (
              <div className="absolute inset-0 bg-white bg-opacity-80 rounded-xl flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-sm font-semibold text-blue-700">Fazendo upload...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={handleClick}
            className={`
              border-2 border-dashed border-green-300 rounded-xl p-8 text-center cursor-pointer
              ${isSupabaseConfigured() && !isUploading ? 'hover:border-green-400 hover:bg-green-50' : 'opacity-50 cursor-not-allowed'}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
              transition-all duration-300
            `}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
                <p className="text-green-700 font-semibold">Fazendo upload...</p>
                <p className="text-sm text-green-600">Por favor, aguarde...</p>
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
                      Formatos aceitos: JPG, PNG, GIF, WebP (máx. 10MB)
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
          disabled={!isSupabaseConfigured() || isUploading}
        />
      </div>
      
      {previewUrl && !isUploading && (
        <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200">
          <p className="text-sm text-green-700 font-semibold flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Imagem carregada com sucesso
          </p>
        </div>
      )}
    </div>
  );
}