import {
  initConnection,
  endConnection,
  getProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Product,
  type Purchase,
  type PurchaseError,
} from 'react-native-iap'

export type SupportProduct = {
  id: string
  sku: string
  titleKey: string
  descKey: string
  approxPrice: string
  icon: string
}

export const SUPPORT_PRODUCTS: SupportProduct[] = [
  {
    id: 'kafe',
    sku: 'support_kafe',
    titleKey: 'support.products.kafe.title',
    descKey: 'support.products.kafe.desc',
    approxPrice: '50 Kč',
    icon: 'coffee',
  },
  {
    id: 'aglio_olio',
    sku: 'support_aglio_olio',
    titleKey: 'support.products.aglio_olio.title',
    descKey: 'support.products.aglio_olio.desc',
    approxPrice: '120 Kč',
    icon: 'pasta',
  },
  {
    id: 'burger',
    sku: 'support_burger',
    titleKey: 'support.products.burger.title',
    descKey: 'support.products.burger.desc',
    approxPrice: '180 Kč',
    icon: 'burger',
  },
  {
    id: 'vegeburger',
    sku: 'support_vegeburger',
    titleKey: 'support.products.vegeburger.title',
    descKey: 'support.products.vegeburger.desc',
    approxPrice: '180 Kč',
    icon: 'vegeburger',
  },
  {
    id: 'pizza_vegetariana',
    sku: 'support_pizza_vegetariana',
    titleKey: 'support.products.pizza_vegetariana.title',
    descKey: 'support.products.pizza_vegetariana.desc',
    approxPrice: '220 Kč',
    icon: 'pizza_vegetariana',
  },
  {
    id: 'pizza_prosciutto_crudo',
    sku: 'support_pizza_prosciutto_crudo',
    titleKey: 'support.products.pizza_prosciutto_crudo.title',
    descKey: 'support.products.pizza_prosciutto_crudo.desc',
    approxPrice: '260 Kč',
    icon: 'pizza_prosciutto_crudo',
  },
  {
    id: 'sushi',
    sku: 'support_sushi',
    titleKey: 'support.products.sushi.title',
    descKey: 'support.products.sushi.desc',
    approxPrice: '350 Kč',
    icon: 'sushi',
  },
]

export const SUPPORT_SKUS = SUPPORT_PRODUCTS.map(p => p.sku)

export class IapService {
  private static isConnected = false
  private static updateSub: any = null
  private static errorSub: any = null

  static async init(
    onPurchaseSuccess?: (purchase: Purchase) => void,
    onPurchaseError?: (error: PurchaseError) => void,
  ): Promise<boolean> {
    try {
      this.isConnected = await initConnection()
      if (this.isConnected) {
        this.updateSub = purchaseUpdatedListener(async (purchase: Purchase) => {
          try {
            await finishTransaction({ purchase, isConsumable: true })
            onPurchaseSuccess?.(purchase)
          } catch (e) {
            console.warn('[IAP] finishTransaction error:', e)
          }
        })
        this.errorSub = purchaseErrorListener((error: PurchaseError) => {
          onPurchaseError?.(error)
        })
      }
      return this.isConnected
    } catch (e) {
      console.warn('[IAP] initConnection error:', e)
      this.isConnected = false
      return false
    }
  }

  static async fetchProducts(): Promise<Product[]> {
    if (!this.isConnected) {
      return []
    }
    try {
      return await getProducts({ skus: SUPPORT_SKUS })
    } catch (e) {
      console.warn('[IAP] getProducts error:', e)
      return []
    }
  }

  static async buy(sku: string): Promise<void> {
    try {
      await requestPurchase({ sku, skus: [sku] })
    } catch (e) {
      console.warn('[IAP] requestPurchase error:', e)
      throw e
    }
  }

  static async close(): Promise<void> {
    this.updateSub?.remove()
    this.errorSub?.remove()
    this.updateSub = null
    this.errorSub = null
    if (this.isConnected) {
      try {
        await endConnection()
      } catch (e) {
        console.warn('[IAP] endConnection error:', e)
      }
      this.isConnected = false
    }
  }
}
