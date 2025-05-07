import Client from 'ssh2-sftp-client';

const SFTP_CONFIG = {
  host: '154.12.241.156',
  username: 'admin_imagens',
  password: '%26wz6IAl70e!rF^',
  port: 22
};

const BASE_URL = 'https://imagens.linkcompra.com';

export async function uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
  const client = new Client();
  
  try {
    await client.connect(SFTP_CONFIG);
    
    await client.put(fileBuffer, `/home/imagens.linkcompra.com/${fileName}`);
    
    return `${BASE_URL}/${fileName}`;
  } catch (error) {
    console.error('Erro no upload SFTP:', error);
    throw new Error('Erro ao fazer upload do arquivo');
  } finally {
    await client.end();
  }
}
