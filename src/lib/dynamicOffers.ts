interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface Offer {
  name: string;
  thumbnail: string;
  price: number;
  link: string;
  storeName: string;
}

class DynamicOffers {
  private readonly appToken = '16632982759641319bf7c241087e7a43';
  private readonly sourceId = '38359488';
  private readonly apiUrl = 'https://api.lomadee.com/v3';
  private readonly pageSize = 12;
  private currentPage = 1;
  private paginationInfo: PaginationInfo = {
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  };

  private async fetchLomadeeOffers(keyword: string, page: number = 1): Promise<Offer[]> {
    console.log('Buscando ofertas Lomadee para:', keyword);
    if (!keyword) {
      console.log('Keyword vazia, retornando array vazio');
      return [];
    }
    const size = this.pageSize;
    const offset = (page - 1) * size;
    try {
      const url = `${this.apiUrl}/${this.appToken}/offer/_search?sourceId=${this.sourceId}&keyword=${encodeURIComponent(keyword)}&size=${size}&offset=${offset}`;
      console.log('URL Lomadee:', url);
      const response = await fetch(url);
      const data = await response.json();

      console.log('API Response:', data);
      
      if (data.requestInfo?.status === 'PERMISSION_DENIED') {
        console.error('Erro de permissão:', data.requestInfo.message);
        throw new Error(`Erro de permissão: ${data.requestInfo.message}`);
      }

      if (!data.offers || !Array.isArray(data.offers)) {
        console.log('Nenhuma oferta encontrada na Lomadee');
        return [];
      }

      return data.offers.map((offer: any) => ({
        name: offer.name,
        thumbnail: offer.thumbnail,
        price: offer.price,
        link: offer.link,
        storeName: offer.store?.name || ''
      }));
    } catch (error) {
      console.error('Error fetching offers:', error);
      return [];
    }
  }

  private async fetchAmazonOffers(keyword: string, page: number = 1): Promise<Offer[]> {
    console.log('Buscando ofertas Amazon para:', keyword);
    try {
      const { credentials } = await import('../config/credentials');
      const timestamp = new Date().toISOString();
      const host = 'webservices.amazon.com.br';
      const region = 'us-east-1';
      const uri = '/paapi5/searchitems';
      
      const params = {
        'Keywords': keyword,
        'SearchIndex': 'All',
        'ItemCount': this.pageSize,
        'ItemPage': page,
        'Resources': [
          'ItemInfo.Title',
          'Offers.Listings.Price',
          'Images.Primary.Large'
        ],
        'PartnerTag': credentials.amazon.partnerId,
        'PartnerType': 'Associates',
        'Marketplace': 'www.amazon.com.br'
      };

      console.log('Parâmetros Amazon:', params);
      const authHeader = await this.getAmazonAuthHeader(params, timestamp, credentials);
      const response = await fetch(`https://${host}${uri}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Amz-Target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
          'X-Amz-Date': timestamp,
          'Authorization': authHeader
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Amazon API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Resposta Amazon:', data);
      const items = data?.SearchResult?.Items || [];

      // Atualiza informações de paginação
      const totalResults = data?.SearchResult?.TotalResultCount || 0;
      this.paginationInfo.totalPages = Math.ceil(totalResults / this.pageSize);
      this.paginationInfo.hasNextPage = page < this.paginationInfo.totalPages;
      this.paginationInfo.hasPreviousPage = page > 1;

      return items.map(item => ({
        name: item.ItemInfo.Title.DisplayValue,
        thumbnail: item.Images.Primary.Large.URL,
        price: item.Offers?.Listings[0]?.Price?.Amount || 0,
        link: item.DetailPageURL,
        storeName: 'Amazon'
      }));
    } catch (error) {
      console.error('Erro ao buscar ofertas da Amazon:', error);
      return [];
    }
  }

  private async getAmazonAuthHeader(params: any, timestamp: string, credentials: any): Promise<string> {
    const algorithm = 'AWS4-HMAC-SHA256';
    const service = 'ProductAdvertisingAPI';
    const region = 'us-east-1';
    const httpMethod = 'POST';
    const canonicalUri = '/paapi5/searchitems';
    const host = 'webservices.amazon.com.br';

    const dateStamp = timestamp.split('T')[0];
    const scope = `${dateStamp}/${region}/${service}/aws4_request`;

    const canonicalHeaders = [
      `content-type:application/json`,
      `host:${host}`,
      `x-amz-date:${timestamp}`,
      `x-amz-target:com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems`
    ].join('\n') + '\n';

    const signedHeaders = 'content-type;host;x-amz-date;x-amz-target';
    const payloadHash = await this.sha256(JSON.stringify(params));

    const canonicalRequest = [
      httpMethod,
      canonicalUri,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');

    const stringToSign = [
      algorithm,
      timestamp,
      scope,
      await this.sha256(canonicalRequest)
    ].join('\n');

    const kDate = await this.hmacSHA256('AWS4' + credentials.amazon.secretKey, dateStamp);
    const kRegion = await this.hmacSHA256(kDate, region);
    const kService = await this.hmacSHA256(kRegion, service);
    const kSigning = await this.hmacSHA256(kService, 'aws4_request');
    const signature = await this.hmacSHA256(kSigning, stringToSign);

    return `${algorithm} Credential=${credentials.amazon.accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  private async sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    return crypto.subtle.digest('SHA-256', data)
      .then(hash => Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''));
  }

  private async hmacSHA256(key: string, message: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(key);
    const messageData = encoder.encode(message);
    
    return crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    .then(cryptoKey => crypto.subtle.sign('HMAC', cryptoKey, messageData))
    .then(signature => Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''));
  }

  private async fetchPartnerOffers(keyword: string): Promise<Offer[]> {
    try {
      // Substitua pela URL da sua API parceira
      const response = await fetch(`https://api.parceiro.com/products?q=${encodeURIComponent(keyword)}`);
      const data = await response.json();

      // Adapte o formato dos dados para o formato Offer[]
      return data.products.map((product: any) => ({
        name: product.title,
        thumbnail: product.image,
        price: product.price,
        link: product.url,
        storeName: product.store
      }));
    } catch (error) {
      console.error('Erro ao buscar ofertas do parceiro:', error);
      return [];
    }
  }

  private async fetchAllOffers(keyword: string, page: number = 1): Promise<Offer[]> {
    console.log('fetchAllOffers - keyword:', keyword, 'page:', page);
    try {
      // Busca ofertas de todas as APIs em paralelo
      this.currentPage = page;
      console.log('Iniciando busca em todas as APIs. Página:', page);
      // Busca primeiro da Lomadee que é mais confiável
      const lomadeeOffers = await this.fetchLomadeeOffers(keyword, page);
      console.log('Ofertas Lomadee:', lomadeeOffers.length);

      // Tenta buscar da Amazon, mas não bloqueia se falhar
      let amazonOffers: Offer[] = [];
      try {
        amazonOffers = await this.fetchAmazonOffers(keyword, page);
        console.log('Ofertas Amazon:', amazonOffers.length);
      } catch (error) {
        console.error('Erro ao buscar ofertas da Amazon:', error);
      }

      // Combina os resultados
      const allOffers = [...lomadeeOffers];
      if (amazonOffers.length > 0) {
        allOffers.push(...amazonOffers);
      }


      console.log('Total de ofertas encontradas:', allOffers.length);
      return allOffers;
    } catch (error) {
      console.error('Erro ao buscar todas as ofertas:', error);
      return [];
    }
  }

  private sortOffers(offers: Offer[], ascending: boolean = true): Offer[] {
    return [...offers].sort((a, b) => {
      return ascending ? a.price - b.price : b.price - a.price;
    });
  }

  private renderOffersHtml(offers: Offer[]): string {
    return offers.map(offer => `
      <div class="offer-card" data-price="${offer.price}">
        <a href="${offer.link}" target="_blank" rel="noopener noreferrer" class="offer-card-link">
          <div class="offer-image-wrapper">
            <img src="${offer.thumbnail}" alt="${offer.name}" class="offer-image" />
            ${offer.storeName ? `<div class="offer-store-badge">${offer.storeName}</div>` : ''}
          </div>
          <div class="offer-content">
            <h3 class="offer-title">${offer.name}</h3>
            <div class="offer-price-action">
              <p class="offer-price">R$ ${offer.price.toFixed(2)}</p>
              <button class="offer-link">Ver Oferta</button>
            </div>
          </div>
        </a>
      </div>
    `).join('');
  }

  private getSearchKeyword(): string {
    if (typeof window === 'undefined') {
      console.log('window não definido (servidor)');
      return '';
    }
    const url = new URL(window.location.href);
    const path = url.pathname;
    const categoria = path.split('/').pop() || '';
    
    // Remove hífens e converte para espaço
    const keyword = decodeURIComponent(categoria.replace(/-/g, ' '));
    console.log('Palavra-chave de busca:', keyword);
    return keyword;
  }

  async renderOffers(containerId: string = 'ofertas-dinamicas'): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const categoria = urlParams.get('categoria');
    
    if (!categoria) {
      container.style.display = 'none';
      return;
    }

    try {
      const keyword = this.getSearchKeyword();
      const page = Number(new URLSearchParams(window.location.search).get('page')) || 1;
      const offers = await this.fetchAllOffers(keyword, page);
      console.log('Ofertas encontradas:', offers.length);
      
      if (offers.length === 0) {
        container.innerHTML = '<p class="no-offers">Nenhuma oferta encontrada.</p>';
        return;
      }

      let currentOffers = [...offers];
      
      const sortHtml = `
        <div class="offers-sort">
          <label>
            <input 
              type="checkbox" 
              id="sort-price"
            />
            Ordenar por menor preço
          </label>
        </div>
        <div class="offers-pagination">
          ${this.paginationInfo.hasPreviousPage ? `
            <a href="?page=${this.currentPage - 1}" class="pagination-link">← Anterior</a>
          ` : ''}
          <span class="pagination-info">Página ${this.currentPage} de ${this.paginationInfo.totalPages}</span>
          ${this.paginationInfo.hasNextPage ? `
            <a href="?page=${this.currentPage + 1}" class="pagination-link">Próxima →</a>
          ` : ''}
        </div>
      `;

      const offersHtml = this.renderOffersHtml(offers);

      container.innerHTML = `
        <style>
          .offers-sort {
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          .offers-sort label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
            color: #374151;
            cursor: pointer;
          }
          .offers-sort input[type="checkbox"] {
            width: 1rem;
            height: 1rem;
          }
          .offers-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
            padding: 1rem 0;
          }
          .offer-card {
            background: white;
            border-radius: 0.75rem;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }
          .offer-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          }
          .offer-card-link {
            text-decoration: none;
            color: inherit;
            display: block;
          }
          .offer-image-wrapper {
            position: relative;
            padding-top: 75%;
            background: #f9fafb;
          }
          .offer-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            padding: 1rem;
          }
          .offer-store-badge {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: rgba(0, 0, 0, 0.75);
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 500;
          }
          .offer-content {
            padding: 1rem;
          }
          .offer-title {
            font-size: 0.875rem;
            font-weight: 500;
            color: #111827;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            margin-bottom: 0.75rem;
            line-height: 1.2;
            height: 2.4em;
          }
          .offer-price-action {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.75rem;
          }
          .offer-price {
            font-size: 1.25rem;
            font-weight: 700;
            color: #059669;
            margin: 0;
          }
          .offer-link {
            display: inline-block;
            background-color: #1D4FD9;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s;
            white-space: nowrap;
            border: none;
            cursor: pointer;
          }
          .offers-pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            margin-top: 2rem;
            padding: 1rem;
          }

          .pagination-link {
            color: #1D4FD9;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border: 1px solid #1D4FD9;
            border-radius: 0.25rem;
            transition: all 0.2s;
          }

          .pagination-link:hover {
            background: #1D4FD9;
            color: white;
          }

          .pagination-info {
            color: #374151;
          }

          .offer-link:hover {
            background-color: #1644B8;
            transform: scale(1.05);
          }
          .no-offers {
            text-align: center;
            color: #6b7280;
            padding: 3rem;
            font-size: 1.25rem;
            background: white;
            border-radius: 1rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            grid-column: 1 / -1;
          }
          @media (max-width: 1200px) {
            .offers-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          @media (max-width: 900px) {
            .offers-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (max-width: 600px) {
            .offers-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
        ${sortHtml}
        <div class="offers-grid">
          ${offersHtml}
        </div>
        <script>
          (function() {
            const checkbox = document.getElementById('sort-price');
            const grid = document.querySelector('.offers-grid');
            const offers = ${JSON.stringify(offers)};

            if (checkbox && grid) {
              checkbox.addEventListener('change', () => {
                const sortedOffers = [...offers].sort((a, b) => {
                  return checkbox.checked ? a.price - b.price : 0;
                });
                grid.innerHTML = this.renderOffersHtml(sortedOffers);
              });
            }
          })();
        </script>
      `;
    } catch (error) {
      console.error('Error rendering offers:', error);
      container.innerHTML = '<p class="no-offers">Erro ao carregar as ofertas.</p>';
    }
  }
}

export const dynamicOffers = new DynamicOffers();
