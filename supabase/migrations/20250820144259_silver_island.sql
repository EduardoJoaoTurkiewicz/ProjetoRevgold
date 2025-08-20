/*
  # Criar usuário padrão para autenticação automática

  1. Objetivo
    - Criar um usuário padrão no sistema de autenticação do Supabase
    - Permitir que o sistema funcione automaticamente sem necessidade de cadastro manual
    - Garantir que todos os dados sejam salvos no banco de dados

  2. Detalhes
    - Email: admin@revgold.com
    - Senha: revgold123
    - Confirmação de email desabilitada
    - Usuário criado automaticamente se não existir

  3. Segurança
    - Este usuário é apenas para demonstração e desenvolvimento
    - Em produção, deve ser substituído por um sistema de autenticação adequado
*/

-- Inserir usuário padrão na tabela auth.users se não existir
DO $$
DECLARE
    user_id uuid;
BEGIN
    -- Verificar se o usuário já existe
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = 'admin@revgold.com';
    
    -- Se não existir, criar o usuário
    IF user_id IS NULL THEN
        -- Gerar um UUID para o usuário
        user_id := gen_random_uuid();
        
        -- Inserir na tabela auth.users
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token,
            aud,
            role
        ) VALUES (
            user_id,
            '00000000-0000-0000-0000-000000000000',
            'admin@revgold.com',
            crypt('revgold123', gen_salt('bf')),
            now(),
            now(),
            now(),
            '',
            '',
            '',
            '',
            'authenticated',
            'authenticated'
        );
        
        -- Inserir na tabela auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            user_id,
            jsonb_build_object('sub', user_id::text, 'email', 'admin@revgold.com'),
            'email',
            now(),
            now()
        );
        
        -- Inserir na tabela users (nossa tabela personalizada)
        INSERT INTO users (
            id,
            username,
            role,
            created_at,
            updated_at
        ) VALUES (
            user_id,
            'Administrador RevGold',
            'user',
            now(),
            now()
        ) ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Usuário padrão criado com sucesso: admin@revgold.com';
    ELSE
        RAISE NOTICE 'Usuário padrão já existe: admin@revgold.com';
    END IF;
END $$;