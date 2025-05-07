import * as ftp from 'basic-ftp';

const FTP_CONFIG = {
  host: '154.12.241.156',
  user: 'admin_imagens',
  password: '%26wz6IAl70e!rF^',
  secure: false
};

const BASE_URL = 'https://imagens.linkcompra.com';

export async function uploadFile(fileBuffer: Buffer | Uint8Array, fileName: string): Promise<string> {
  const client = new ftp.Client();
  client.ftp.verbose = false;
  
  try {
    await client.access(FTP_CONFIG);
    
    // Navega para o diretório correto
    await client.cd('/home/imagens.linkcompra.com');
    
    // Cria um arquivo temporário e faz upload
    const { writeFile } = require('fs/promises');
    const { join } = require('path');
    const { tmpdir } = require('os');
    
    const tempFile = join(tmpdir(), fileName);
    await writeFile(tempFile, fileBuffer);
    
    // Faz upload do arquivo
    await client.uploadFrom(tempFile, fileName);
    
    // Remove o arquivo temporário
    const { unlink } = require('fs/promises');
    await unlink(tempFile);
    
    // Retorna a URL pública do arquivo
    return `${BASE_URL}/${fileName}`;
  } catch (error) {
    console.error('Erro no upload FTP:', error);
    throw new Error('Erro ao fazer upload do arquivo');
  } finally {
    client.close();
  }
}
