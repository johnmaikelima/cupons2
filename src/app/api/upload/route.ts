import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

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
    
    // Usa o diretório public/uploads existente
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await writeFile(join(uploadDir, fileName), Buffer.from(await file.arrayBuffer()));

    // Retorna o caminho relativo do arquivo
    return NextResponse.json({ 
      url: `/uploads/${fileName}`
    });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return NextResponse.json(
      { error: 'Erro ao fazer upload do arquivo' },
      { status: 500 }
    );
  }
}
