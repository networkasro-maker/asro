
import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

// PENTING: Untuk lingkungan pengembangan dalam browser Anda, kita akan meletakkan
// kunci API langsung di sini. Ini adalah cara termudah untuk memulai.
// Untuk aplikasi sungguhan yang di-deploy ke Vercel/Netlify, Anda HARUS
// menggunakan Environment Variables seperti pada versi kode sebelumnya.
const supabaseUrl = 'https://lwrhzqqawwwkoktmpjsa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3cmh6cXFhd3d3a29rdG1wanNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTM2MjQsImV4cCI6MjA3MDQ4OTYyNH0.MQC08U9TOu5KeScKri611N_P8GZbt5vdnNtu-2f_mRw';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided.");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)