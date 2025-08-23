import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Image handling functions for check images
export const uploadCheckImage = async (file: File, fileName: string) => {
  const { data, error } = await supabase.storage
    .from('check-images')
    .upload(fileName, file)

  if (error) {
    throw error
  }

  return data
}

export const deleteCheckImage = async (fileName: string) => {
  const { error } = await supabase.storage
    .from('check-images')
    .remove([fileName])

  if (error) {
    throw error
  }
}

export const getCheckImageUrl = (fileName: string) => {
  const { data } = supabase.storage
    .from('check-images')
    .getPublicUrl(fileName)

  return data.publicUrl
}