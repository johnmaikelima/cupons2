import { NextResponse } from 'next/server';
import { uploadFile } from '@/lib/ftp';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Gera um nome único para o arquivo
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = originalName.split('.').pop();
    const fileName = `${timestamp}-${originalName}`;
    
    // Converte o arquivo para buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Faz upload via FTP
    const url = await uploadFile(buffer, fileName);

    // Retorna a URL pública do arquivo
    return NextResponse.json({ 
      url
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    );
  }
}
