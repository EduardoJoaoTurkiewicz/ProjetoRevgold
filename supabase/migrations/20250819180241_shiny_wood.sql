/*
  # Criar buckets de armazenamento para o sistema RevGold

  1. Buckets
    - `check-images` - Imagens de cheques (frente e verso)
    - `employee-documents` - Documentos de funcionários (recibos, etc)

  2. Segurança
    - RLS habilitado nos buckets
    - Políticas para usuários autenticados
    - Controle de tamanho e tipo de arquivo

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
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Políticas para bucket de imagens de cheques
CREATE POLICY "Authenticated users can upload check images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'check-images');

CREATE POLICY "Authenticated users can view check images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'check-images');

CREATE POLICY "Authenticated users can update check images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'check-images');

CREATE POLICY "Authenticated users can delete check images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'check-images');

-- Políticas para bucket de documentos de funcionários
CREATE POLICY "Authenticated users can upload employee documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'employee-documents');

CREATE POLICY "Authenticated users can view employee documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'employee-documents');

CREATE POLICY "Authenticated users can update employee documents"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'employee-documents');

CREATE POLICY "Authenticated users can delete employee documents"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'employee-documents');