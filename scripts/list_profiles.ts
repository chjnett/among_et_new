import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function listAllProfiles() {
    console.log('Listing all profiles from:', supabaseUrl)

    const { data, error } = await supabase
        .from('profiles')
        .select('*')

    if (error) {
        console.error('Error fetching profiles:', error)
        return
    }

    console.log('--- Profiles List ---')
    console.table(data)
    console.log('Total profiles:', data?.length)
}

listAllProfiles()
