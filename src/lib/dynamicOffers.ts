interface Offer {
  name: string;
  thumbnail: string;
  price: number;
  link: string;
  storeName: string;
}

class DynamicOffers {
  private readonly appToken = '1746388081270978c0396';
  private readonly sourceId = '38359488';
  private readonly apiUrl = 'https://api.lomadee.com/v3';

  async fetchOffers(keyword: string, size: number = 5): Promise<Offer[]> {
    try {
      const url = `${this.apiUrl}/${this.appToken}/offer/_search?sourceId=${this.sourceId}&keyword=${encodeURIComponent(keyword)}&size=${size}`;
      const response = await fetch(url);
      const data = await response.json();

      console.log('API Response:', data);
      
      if (data.requestInfo?.status === 'PERMISSION_DENIED') {
        console.error('Erro de permissão:', data.requestInfo.message);
        throw new Error(`Erro de permissão: ${data.requestInfo.message}`);
      }

      if (!data.offers || !Array.isArray(data.offers)) {
        console.log('Nenhuma oferta encontrada nos dados:', data);
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
      const offers = await this.fetchOffers(categoria);
      
      if (offers.length === 0) {
        container.innerHTML = '<p class="no-offers">Nenhuma oferta encontrada.</p>';
        return;
      }

      const offersHtml = offers.map(offer => `
        <div class="offer-card">
          <img src="${offer.thumbnail}" alt="${offer.name}" class="offer-image" />
          <div class="offer-content">
            <h3 class="offer-title">${offer.name}</h3>
            <p class="offer-store">Loja: ${offer.storeName}</p>
            <p class="offer-price">R$ ${offer.price.toFixed(2)}</p>
            <a href="${offer.link}" target="_blank" rel="noopener noreferrer" class="offer-link">
              Ver Oferta
            </a>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <style>
          .offers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1.5rem;
            padding: 1rem 0;
          }
          .offer-card {
            border: 1px solid #e5e7eb;
            border-radius: 0.5rem;
            overflow: hidden;
            transition: transform 0.2s;
          }
          .offer-card:hover {
            transform: translateY(-2px);
          }
          .offer-image {
            width: 100%;
            height: 200px;
            object-fit: contain;
            background: #f9fafb;
            padding: 1rem;
          }
          .offer-content {
            padding: 1rem;
          }
          .offer-title {
            font-size: 1rem;
            font-weight: 500;
            margin-bottom: 0.5rem;
            color: #111827;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .offer-store {
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 0.5rem;
          }
          .offer-price {
            font-size: 1.25rem;
            font-weight: 600;
            color: #059669;
            margin-bottom: 1rem;
          }
          .offer-link {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.375rem;
            text-decoration: none;
            transition: background-color 0.2s;
          }
          .offer-link:hover {
            background-color: #1d4ed8;
          }
          .no-offers {
            text-align: center;
            color: #6b7280;
            padding: 2rem;
            font-size: 1.125rem;
          }
        </style>
        <div class="offers-grid">
          ${offersHtml}
        </div>
      `;
    } catch (error) {
      console.error('Error rendering offers:', error);
      container.innerHTML = '<p class="no-offers">Erro ao carregar as ofertas.</p>';
    }
  }
}

export const dynamicOffers = new DynamicOffers();
