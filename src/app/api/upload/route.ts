import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 100 * 1024 * 1024;

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const DOCUMENT_FOLDERS = new Set(['documents', 'documents-final']);

function sanitizeFolder(folder: string): string {
  const safe = folder.replace(/[^a-zA-Z0-9_-]/g, '');
  return safe || 'misc';
}

function getExtension(filename: string): string {
  const ext = filename.lastIndexOf('.') !== -1 ? filename.slice(filename.lastIndexOf('.')).toLowerCase() : '';
  return ext && /^\.[a-z0-9]+$/.test(ext) ? ext : '';
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Configuration stockage manquante' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const formData = await request.formData();
    const file = formData.get('file');
    const folderRaw = (formData.get('folder') as string) || 'misc';
    const folder = sanitizeFolder(folderRaw);

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const isDocumentFolder = DOCUMENT_FOLDERS.has(folder);
    const maxSize = isDocumentFolder ? MAX_DOCUMENT_SIZE : MAX_IMAGE_SIZE;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${Math.round(maxSize / (1024 * 1024))} Mo)` },
        { status: 400 }
      );
    }

    if (!isDocumentFolder && !IMAGE_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Seules les images sont autorisées (JPEG, PNG, WEBP, GIF, SVG)' },
        { status: 400 }
      );
    }

    const ext = getExtension(file.name) || (file.type ? `.${file.type.split('/')[1]}` : '');
    const uniqueName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(uniqueName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Supabase storage error:', uploadError);
      return NextResponse.json({ error: `Erreur stockage: ${uploadError.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(uniqueName);

    return NextResponse.json({
      url: publicUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Erreur serveur: ${message}` }, { status: 500 });
  }
}
