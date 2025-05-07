import Client from 'ftp';

const FTP_CONFIG = {
  host: '154.12.241.156',
  user: 'admin_imagens',
  password: '%26wz6IAl70e!rF^',
  secure: false
};

const BASE_URL = 'https://imagens.linkcompra.com';

export function uploadFile(fileBuffer: Buffer, fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = new Client();

    client.on('ready', () => {
      client.put(fileBuffer, `/home/imagens.linkcompra.com/${fileName}`, (err) => {
        client.end();
        
        if (err) {
          console.error('Erro no upload FTP:', err);
          reject(new Error('Erro ao fazer upload do arquivo'));
        } else {
          resolve(`${BASE_URL}/${fileName}`);
        }
      });
    });

    client.on('error', (err) => {
      client.end();
      console.error('Erro na conexão FTP:', err);
      reject(new Error('Erro na conexão FTP'));
    });

    client.connect(FTP_CONFIG);
  });
}
