import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
let envContent = '';
try {
    envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
    console.error(".env.local 파일을 찾을 수 없습니다.");
}

const envVars: Record<string, string> = {};
envContent.split('\n').forEach(line => {
    const [key, ...val] = line.split('=')
    if (key && val.length > 0) envVars[key.trim()] = val.join('=').trim()
})

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'] || process.env.NEXT_PUBLIC_SUPABASE_URL;
// RLS 정책 우회를 위해 Service Role Key 필수
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'] || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseKey === "YOUR_SERVICE_ROLE_KEY_HERE") {
    console.error("❌ 에러: 유효한 SUPABASE_SERVICE_ROLE_KEY가 없습니다!");
    console.error("👉 Supabase 관리자 페이지 -> Project Settings -> API 탭에서 'service_role' (secret) 키를 복사한 뒤, .env.local 파일의 SUPABASE_SERVICE_ROLE_KEY 항목에 붙여넣기해주세요.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 변경할 버킷 이름 (본인의 버킷 이름으로 변경하세요, 기본값: 'product-images')
const BUCKET_NAME = 'product-images';
const TEMP_DIR = path.join(process.cwd(), 'temp_images');

async function processImages() {
    console.log(`🚀 [${BUCKET_NAME}] 버킷 이미지 압축 작업을 시작합니다...`);

    // 임시 폴더 생성
    if (!fs.existsSync(TEMP_DIR)) {
        fs.mkdirSync(TEMP_DIR);
    }

    // 1. 버킷의 파일 목록 가져오기 (단순화를 위해 루트 경로 우선)
    const { data: files, error: listError } = await supabase.storage.from(BUCKET_NAME).list('');

    if (listError) {
        console.error("목록을 가져오는 중 오류 발생:", listError.message);
        return;
    }

    if (!files || files.length === 0) {
        console.log("압축할 파일이 없습니다.");
        return;
    }

    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    console.log(`총 ${files.length}개의 파일을 발견했습니다. 압축을 진행합니다...`);

    for (const file of files) {
        // 폴더인 경우 건너뛰기
        if (!file.id) continue;

        // 이미지 파일인지 확인 (jpg, jpeg, png, webp 등)
        const ext = path.extname(file.name).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
            console.log(`건너뜀: ${file.name} (이미지 확장자 아님)`);
            continue;
        }

        console.log(`\n⬇️ 다운로드 중: ${file.name} (크기: ${(file.metadata?.size / 1024 / 1024).toFixed(2)}MB)`);

        // 2. 파일 다운로드
        const { data: blob, error: downloadError } = await supabase.storage.from(BUCKET_NAME).download(file.name);

        if (downloadError || !blob) {
            console.error(`❌ 다운로드 실패: ${file.name}`, downloadError);
            continue;
        }

        const buffer = Buffer.from(await blob.arrayBuffer());
        totalOriginalSize += buffer.length;

        // 3. Sharp로 이미지 압축
        const localFilePath = path.join(TEMP_DIR, file.name);
        let compressedBuffer;

        console.log(`🛠️ 압축 중: ${file.name}`);
        try {
            if (ext === '.png') {
                compressedBuffer = await sharp(buffer)
                    .resize(1200, undefined, { withoutEnlargement: true, fit: 'inside' })
                    .png({ quality: 70, compressionLevel: 8 })
                    .toBuffer();
            } else if (ext === '.webp') {
                compressedBuffer = await sharp(buffer)
                    .resize(1200, undefined, { withoutEnlargement: true, fit: 'inside' })
                    .webp({ quality: 70 })
                    .toBuffer();
            } else {
                compressedBuffer = await sharp(buffer)
                    .resize(1200, undefined, { withoutEnlargement: true, fit: 'inside' })
                    .jpeg({ quality: 70, progressive: true })
                    .toBuffer();
            }
        } catch (err) {
            console.error(`❌ 압축 실패: ${file.name}`, err);
            continue;
        }

        totalCompressedSize += compressedBuffer.length;
        console.log(`✅ 압축 완료! 크기: ${(compressedBuffer.length / 1024).toFixed(2)}KB`);

        // 4. 기존 파일과 똑같은 이름으로 덮어쓰기 (Update)
        console.log(`⬆️ 덮어쓰기 업로드 중: ${file.name}...`);
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .update(file.name, compressedBuffer, {
                cacheControl: '3600',
                upsert: true,
                contentType: blob.type
            });

        if (uploadError) {
            console.error(`❌ 업로드 실패: ${file.name}`, uploadError);
        } else {
            console.log(`🎉 덮어쓰기 완료: ${file.name}`);
        }
    }

    console.log(`\n========================================`);
    console.log(`모든 작업이 완료되었습니다!`);
    console.log(`원본 총 용량: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`압축 후 용량: ${(totalCompressedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`절약한 공간: ${((totalOriginalSize - totalCompressedSize) / 1024 / 1024).toFixed(2)} MB`);
    console.log(`========================================`);
}

processImages().catch(console.error);
