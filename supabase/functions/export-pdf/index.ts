import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const searchParams = url.searchParams
    
    // Get parameters
    const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || []
    const methods = searchParams.get('methods')?.split(',').filter(Boolean) || []
    const status = searchParams.get('status') || 'all'
    const user = searchParams.get('user') || 'Sistema'

    // Get the base URL for the print page
    const baseUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173'
    const printUrl = `${baseUrl}/print/reports?${searchParams.toString()}&auto=0`

    console.log('🔄 Generating PDF for URL:', printUrl)

    // For now, return a simple response indicating the feature is ready
    // In production, you would use Puppeteer or Playwright here
    const pdfContent = `
      PDF Export Feature Ready
      
      Report Parameters:
      - Period: ${startDate} to ${endDate}
      - Categories: ${categories.join(', ') || 'All'}
      - Methods: ${methods.join(', ') || 'All'}
      - Status: ${status}
      - User: ${user}
      - Print URL: ${printUrl}
      
      To complete the server-side PDF generation:
      1. Install Puppeteer or Playwright in the edge function
      2. Navigate to the print URL
      3. Generate PDF with proper settings
      4. Return the PDF blob
      
      For now, use the client-side export option.
    `

    return new Response(pdfContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain',
      },
    })

  } catch (error) {
    console.error('Error in export-pdf function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error occurred',
        details: 'PDF export function encountered an error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})