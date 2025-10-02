import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response('No file provided', { status: 400 });
    }

    // Kiểm tra loại file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return new Response('File type not allowed', { status: 400 });
    }

    // Kiểm tra kích thước file (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return new Response('File too large', { status: 400 });
    }

    console.log('Uploading file:', file.name, file.type, file.size);
    
    // Upload trực tiếp đến Directus API
    const directusUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
    const publicToken = process.env.DIRECTUS_PUBLIC_TOKEN;
    
    if (!directusUrl || !publicToken) {
      return new Response('Directus not configured', { status: 500 });
    }

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const response = await fetch(`${directusUrl}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicToken}`,
      },
      body: uploadFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Directus upload error:', response.status, errorText);
      return new Response(`Upload failed: ${response.status} ${errorText}`, { status: 500 });
    }

    const uploadedFile = await response.json();
    console.log('Upload successful:', uploadedFile);
    
    return new Response(JSON.stringify({ 
      id: uploadedFile.data.id,
      filename_download: uploadedFile.data.filename_download,
      type: uploadedFile.data.type
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return new Response(JSON.stringify({ 
      error: 'Failed to upload file', 
      details: err.message 
    }), { 
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
