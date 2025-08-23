import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Image handling functions for check images
export async function uploadCheckImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `check-images/${fileName}`

  const { error } = await supabase.storage
    .from('check-images')
    .upload(filePath, file)

  if (error) {
    throw error
  }

  return filePath
}

export async function deleteCheckImage(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('check-images')
    .remove([filePath])

  if (error) {
    throw error
  }
}

export function getCheckImageUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('check-images')
    .getPublicUrl(filePath)

  return data.publicUrl
}

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