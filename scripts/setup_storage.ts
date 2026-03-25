
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 주의: Bucket 생성은 보통 Service Role Key가 필요하거나, 
// Dashboard에서 해야 합니다. Anon Key로는 권한이 부족할 수 있습니다.
// 하지만 사용자가 Service Role Key를 .env.local에 안 넣었을 확률이 높으니,
// 일단 시도해보고 안 되면 Dashboard 안내를 출력하도록 합니다.

const supabase = createClient(supabaseUrl!, serviceRoleKey || supabaseAnonKey!)

const BUCKET_NAME = 'product-images'

async function setupStorage() {
    console.log(`Checking storage bucket: ${BUCKET_NAME}...`)

    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
        console.error('Error listing buckets:', error.message)
        console.log('Hint: If this is a permission error, you likely need to create the bucket manually in the Dashboard.')
        return
    }

    const existing = buckets.find(b => b.name === BUCKET_NAME)
    if (existing) {
        console.log(`✅ Bucket '${BUCKET_NAME}' already exists.`)
    } else {
        console.log(`Bucket '${BUCKET_NAME}' not found. Attempting to create...`)
        const { data, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true
        })

        if (createError) {
            console.error('❌ Failed to create bucket:', createError.message)
            console.log('\n--- [Manual Action Required] ---')
            console.log('Your current API Key does not have permission to create buckets.')
            console.log('Please go to Supabase Dashboard -> Storage -> New Bucket')
            console.log(`Name: ${BUCKET_NAME}`)
            console.log('Public bucket: ON')
            console.log('--------------------------------')
        } else {
            console.log(`✅ Bucket '${BUCKET_NAME}' created successfully!`)
        }
    }
}

setupStorage()
