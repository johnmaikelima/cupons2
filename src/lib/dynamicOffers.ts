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

  async fetchOffers(keyword: string, size: number = 12): Promise<Offer[]> {
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
      `;

      const offersHtml = offers.map(offer => `
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
            const cards = Array.from(document.querySelectorAll('.offer-card'));

            if (checkbox && grid) {
              checkbox.addEventListener('change', () => {
                const sortedCards = cards.sort((a, b) => {
                  const priceA = parseFloat(a.dataset.price);
                  const priceB = parseFloat(b.dataset.price);
                  return checkbox.checked ? priceA - priceB : 0;
                });

                grid.innerHTML = '';
                sortedCards.forEach(card => grid.appendChild(card));
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
