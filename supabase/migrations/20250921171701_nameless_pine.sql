/*
  # Configuração de Storage para Imagens e Documentos

  1. Buckets
    - `check-images` - Imagens de cheques (frente e verso)
    - `employee-documents` - Documentos de funcionários

  2. Políticas de Acesso
    - Acesso total para usuários autenticados e anônimos
    - Upload, visualização, atualização e exclusão permitidos

  3. Configurações
    - Tamanho máximo: 10MB por arquivo
    - Tipos permitidos: imagens e documentos
*/

-- Criar bucket para imagens de cheques
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'check-images',
  'check-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Criar bucket para documentos de funcionários
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'employee-documents',
  'employee-documents',
  true,
  10485760, -- 10MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
) ON CONFLICT (id) DO NOTHING;

-- ========================================
-- POLÍTICAS PARA BUCKET DE IMAGENS DE CHEQUES
-- ========================================
CREATE POLICY "Allow all operations on check images"
  ON storage.objects
  FOR ALL
  TO anon, authenticated
  USING (bucket_id = 'check-images')
  WITH CHECK (bucket_id = 'check-images');

-- ========================================
-- POLÍTICAS PARA BUCKET DE DOCUMENTOS DE FUNCIONÁRIOS
-- ========================================
CREATE POLICY "Allow all operations on employee documents"
  ON storage.objects
  FOR ALL
  TO anon, authenticated
  USING (bucket_id = 'employee-documents')
  WITH CHECK (bucket_id = 'employee-documents');