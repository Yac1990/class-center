import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 Mo
const MAX_DOCUMENT_SIZE = 100 * 1024 * 1024; // 100 Mo

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
  const ext = path.extname(filename).toLowerCase();
  return ext && /^\.[a-z0-9]+$/.test(ext) ? ext : '';
}

export async function POST(request: NextRequest) {
  try {
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

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    await mkdir(uploadDir, { recursive: true });

    const ext = getExtension(file.name) || (file.type ? `.${file.type.split('/')[1]}` : '');
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const url = `/uploads/${folder}/${uniqueName}`;

    return NextResponse.json({
      url,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Erreur serveur lors du téléversement' }, { status: 500 });
  }
}
