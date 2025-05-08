export interface LomadeeCoupon {
  id: number;
  code: string;
  description: string;
  store: {
    id: number;
    name: string;
    image: string;
  };
  link: string;
  vigency: string;
  discount: string;
  status: string;
}

export interface LomadeeStore {
  id: number;
  name: string;
  image: string;
  link: string;
  hasOffer: boolean;
}

interface LomadeeStoreResponse {
  requestInfo: {
    status: string;
    message: string;
    generatedDate: string;
  };
  stores: LomadeeStore[];
}

interface LomadeeCouponResponse {
  requestInfo: {
    status: string;
    message: string;
    generatedDate: string;
  };
  coupons: LomadeeCoupon[];
}

export class LomadeeService {
  private appToken: string;
  private sourceId: string;

  constructor(appToken: string, sourceId: string) {
    this.appToken = appToken;
    this.sourceId = sourceId;

    console.log('LomadeeService inicializado:', {
      appToken: this.appToken,
      sourceId: this.sourceId
    });
  }

  private async fetchStores(): Promise<LomadeeStore[]> {
    // Usar exatamente a mesma URL e parâmetros que funcionaram no teste
    const url = `https://api.lomadee.com/v2/${this.appToken}/store/_all?sourceId=${this.sourceId}`;
    console.log('Buscando lojas em:', url);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na API da Lomadee:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          errorText
        });
        throw new Error(`Erro na API da Lomadee: ${response.statusText} - ${errorText}`);
      }

      const data: LomadeeStoreResponse = await response.json();
      console.log('Lojas recebidas:', {
        status: data.requestInfo?.status,
        message: data.requestInfo?.message,
        count: data.stores?.length || 0
      });
      
      return data.stores || [];
    } catch (error) {
      console.error('Erro ao buscar lojas da Lomadee:', error);
      throw error;
    }
  }

  private async fetchCoupons(): Promise<LomadeeCouponResponse> {
    // Usar exatamente a mesma URL e parâmetros que funcionaram no teste
    const url = `https://api.lomadee.com/v2/${this.appToken}/coupon/_all?sourceId=${this.sourceId}`;
    console.log('Buscando cupons em:', url);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na API da Lomadee:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          errorText
        });
        throw new Error(`Erro na API da Lomadee: ${response.statusText} - ${errorText}`);
      }

      const data: LomadeeCouponResponse = await response.json();
      console.log('Resposta da API de cupons:', data);
      console.log('Cupons recebidos:', {
        status: data.requestInfo?.status,
        message: data.requestInfo?.message,
        count: data.coupons?.length || 0
      });
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar cupons da Lomadee:', error);
      throw error;
    }
  }

  async getStores(): Promise<LomadeeStore[]> {
    console.log('Buscando lojas...');
    const stores = await this.fetchStores();
    return stores.map(store => ({
      ...store,
      link: this.generateAffiliateLink(store.link)
    }));
  }

  // Função para gerar link de afiliado com o sourceId correto
  private generateAffiliateLink(originalLink: string): string {
    try {
      const url = new URL(originalLink);
      
      // Se o link já é de validação, atualiza o sourceId
      if (url.hostname === 'developer.lomadee.com' && url.pathname === '/redir/validation/') {
        url.searchParams.set('sourceId', this.sourceId);
        return url.toString();
      }
      
      // Se não é um link de validação, retorna o link original
      return originalLink;
    } catch (error) {
      console.error('Erro ao gerar link de afiliado:', error);
      return originalLink;
    }
  }

  async getCoupons(): Promise<LomadeeCoupon[]> {
    const response = await this.fetchCoupons();
    return response.coupons.map(coupon => ({
      id: coupon.id,
      code: coupon.code || '',
      description: coupon.description,
      store: {
        id: coupon.store.id,
        name: coupon.store.name,
        image: coupon.store.image,
      },
      link: this.generateAffiliateLink(coupon.link),
      vigency: coupon.vigency,
      discount: coupon.discount,
      status: coupon.status
    }));
  }
}
