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
          <div class="offer-image-wrapper">
            <img src="${offer.thumbnail}" alt="${offer.name}" class="offer-image" />
            ${offer.storeName ? `<div class="offer-store-badge">${offer.storeName}</div>` : ''}
          </div>
          <div class="offer-content">
            <h3 class="offer-title">${offer.name}</h3>
            <div class="offer-price-action">
              <p class="offer-price">R$ ${offer.price.toFixed(2)}</p>
              <a href="${offer.link}" target="_blank" rel="noopener noreferrer" class="offer-link">
                Ver Oferta
              </a>
            </div>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <style>
          .offers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 2rem;
            padding: 1.5rem 0;
          }
          .offer-card {
            background: white;
            border-radius: 1rem;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;
          }
          .offer-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
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
            padding: 1.5rem;
          }
          .offer-title {
            font-size: 1rem;
            font-weight: 500;
            color: #111827;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            margin-bottom: 1rem;
            line-height: 1.5;
            height: 3em;
          }
          .offer-price-action {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
          }
          .offer-price {
            font-size: 1.5rem;
            font-weight: 700;
            color: #059669;
            margin: 0;
          }
          .offer-link {
            display: inline-block;
            background-color: #059669;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            text-decoration: none;
            font-weight: 500;
            transition: all 0.2s;
            white-space: nowrap;
          }
          .offer-link:hover {
            background-color: #047857;
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
