export interface EtsyListingPayload {
  listingId?: string;
  productId: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  tags: string[];
  materials: string[];
  shopSectionId?: string;
  state: 'draft' | 'active';
  type: 'download';
  who_made: 'i_did';
  when_made: 'made_to_order';
  is_supply: false;
}

export interface PublishResult {
  listingId: string;
  url: string;
  state: string;
  price: number;
  createdAt: string;
  isDryRun: boolean;
}

interface EtsyApiListing {
  listing_id: number;
  state: string;
  price?: { amount: number; divisor: number };
  creation_timestamp?: number;
}

export class EtsyListingAgent {
  private readonly BASE_URL = 'https://openapi.etsy.com/v3';
  private shopId: string;
  private accessToken: string;
  private clientId: string;
  private isDryRun: boolean;

  constructor() {
    this.shopId = process.env['ETSY_SHOP_ID'] ?? '';
    this.accessToken = process.env['ETSY_ACCESS_TOKEN'] ?? '';
    this.clientId = process.env['ETSY_CLIENT_ID'] ?? '';
    this.isDryRun = !this.shopId || !this.accessToken || !this.clientId;

    if (this.isDryRun) {
      console.log(
        '[EtsyListingAgent] Running in DRY RUN mode — set ETSY_SHOP_ID, ETSY_ACCESS_TOKEN, ETSY_CLIENT_ID to publish live.'
      );
    }
  }

  async createListing(payload: Omit<EtsyListingPayload, 'listingId'>): Promise<PublishResult> {
    if (this.isDryRun) {
      const mockId = `dry-run-${Date.now()}`;
      console.log('[EtsyListingAgent] DRY RUN — createListing payload:', JSON.stringify(payload, null, 2));
      return {
        listingId: mockId,
        url: `https://www.etsy.com/listing/${mockId}`,
        state: payload.state,
        price: payload.price,
        createdAt: new Date().toISOString(),
        isDryRun: true,
      };
    }

    const body = {
      quantity: payload.quantity,
      title: payload.title,
      description: payload.description,
      price: payload.price,
      who_made: payload.who_made,
      when_made: payload.when_made,
      taxonomy_id: 2078,
      tags: payload.tags,
      materials: payload.materials,
      state: payload.state,
      type: payload.type,
      is_supply: payload.is_supply,
      ...(payload.shopSectionId ? { shop_section_id: payload.shopSectionId } : {}),
    };

    const data = await this.apiRequest<EtsyApiListing>(
      'POST',
      `/application/shops/${this.shopId}/listings`,
      body
    );

    const priceValue =
      data.price != null ? data.price.amount / data.price.divisor : payload.price;

    return {
      listingId: String(data.listing_id),
      url: `https://www.etsy.com/listing/${data.listing_id}`,
      state: data.state,
      price: priceValue,
      createdAt: data.creation_timestamp
        ? new Date(data.creation_timestamp * 1000).toISOString()
        : new Date().toISOString(),
      isDryRun: false,
    };
  }

  async updateListing(listingId: string, updates: Partial<EtsyListingPayload>): Promise<void> {
    if (this.isDryRun) {
      console.log(`[EtsyListingAgent] DRY RUN — updateListing ${listingId}:`, updates);
      return;
    }

    const body: Record<string, unknown> = {};
    if (updates.title !== undefined) body['title'] = updates.title;
    if (updates.description !== undefined) body['description'] = updates.description;
    if (updates.price !== undefined) body['price'] = updates.price;
    if (updates.state !== undefined) body['state'] = updates.state;
    if (updates.tags !== undefined) body['tags'] = updates.tags;
    if (updates.materials !== undefined) body['materials'] = updates.materials;
    if (updates.quantity !== undefined) body['quantity'] = updates.quantity;

    await this.apiRequest<EtsyApiListing>('PUT', `/application/listings/${listingId}`, body);
  }

  async getListing(listingId: string): Promise<EtsyListingPayload | null> {
    if (this.isDryRun) {
      console.log(`[EtsyListingAgent] DRY RUN — getListing ${listingId}`);
      return null;
    }

    try {
      const data = await this.apiRequest<EtsyApiListing>(
        'GET',
        `/application/listings/${listingId}`
      );

      return {
        listingId: String(data.listing_id),
        productId: '',
        title: '',
        description: '',
        price: data.price != null ? data.price.amount / data.price.divisor : 0,
        quantity: 999,
        tags: [],
        materials: [],
        state: (data.state === 'active' ? 'active' : 'draft') as 'active' | 'draft',
        type: 'download',
        who_made: 'i_did',
        when_made: 'made_to_order',
        is_supply: false,
      };
    } catch (err) {
      if (err instanceof Error && err.message.includes('404')) return null;
      throw err;
    }
  }

  async deactivateListing(listingId: string): Promise<void> {
    if (this.isDryRun) {
      console.log(`[EtsyListingAgent] DRY RUN — deactivateListing ${listingId}`);
      return;
    }

    await this.apiRequest<EtsyApiListing>('PUT', `/application/listings/${listingId}`, {
      state: 'inactive',
    });
  }

  calculatePrice(
    base: number,
    opts?: { discountPct?: number; roundToNine?: boolean }
  ): number {
    let price = base;

    if (opts?.discountPct !== undefined && opts.discountPct > 0 && opts.discountPct <= 100) {
      price = price * (1 - opts.discountPct / 100);
    }

    if (opts?.roundToNine === true) {
      const floor = Math.floor(price);
      const decimal = price - floor;
      if (decimal >= 0.5) {
        price = floor + 0.99;
      } else {
        price = floor - 1 + 0.99;
      }
      if (price < 0.99) price = 0.99;
    }

    return Math.round(price * 100) / 100;
  }

  private async apiRequest<T>(method: string, urlPath: string, body?: unknown): Promise<T> {
    const url = `${this.BASE_URL}${urlPath}`;
    const headers: Record<string, string> = {
      'x-api-key': this.clientId,
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };

    const fetchOpts: RequestInit = {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };

    let response: Response;

    try {
      response = await fetch(url, fetchOpts);
    } catch (err) {
      console.error(`[EtsyListingAgent] Network error on ${method} ${urlPath}:`, err);
      throw err;
    }

    if (response.status === 429) {
      console.warn('[EtsyListingAgent] Rate limited (429) — retrying after 2s...');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        response = await fetch(url, fetchOpts);
      } catch (err) {
        console.error(`[EtsyListingAgent] Network error on retry ${method} ${urlPath}:`, err);
        throw err;
      }
    }

    if (response.status === 401 || response.status === 403) {
      console.error(
        `[EtsyListingAgent] Authentication failed (${response.status}). ` +
          'Check ETSY_ACCESS_TOKEN and ETSY_CLIENT_ID environment variables.'
      );
      throw new Error(`Etsy API auth error: ${response.status}`);
    }

    if (response.status === 404) {
      throw new Error(`Etsy API 404 not found: ${urlPath}`);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Etsy API error ${response.status}: ${text}`);
    }

    return response.json() as Promise<T>;
  }
}
