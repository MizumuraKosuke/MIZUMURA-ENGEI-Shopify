'use client'

import type {
  BaseCartLine,
  Cart,
  CurrencyCode,
  Product,
  ProductVariant
} from 'graphql/generated/graphql'
import React, {
  createContext,
  use,
  useContext,
  useMemo,
  useOptimistic
} from 'react'

type UpdateType = 'plus' | 'minus' | 'delete'

type CartAction =
  | {
      type: 'UPDATE_ITEM';
      payload: { merchandiseId: string; updateType: UpdateType }
    }
  | {
      type: 'ADD_ITEM';
      payload: { variant: ProductVariant; product: Product }
    }

type CartContextType = {
  cartPromise: Promise<Cart | undefined>;
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function calculateItemCost(quantity: number, price: string): string {
  return (Number(price) * quantity).toString()
}

function updateCartItem(
  item: BaseCartLine,
  updateType: UpdateType
): BaseCartLine | null {
  if (updateType === 'delete') return null

  const newQuantity =
    updateType === 'plus' ? item.quantity + 1 : item.quantity - 1
  if (newQuantity === 0) return null

  const singleItemAmount = Number(item.cost.totalAmount.amount) / item.quantity
  const newTotalAmount = calculateItemCost(
    newQuantity,
    singleItemAmount.toString()
  )

  return {
    ...item,
    quantity: newQuantity,
    cost: {
      ...item.cost,
      totalAmount: {
        ...item.cost.totalAmount,
        amount: newTotalAmount
      }
    }
  }
}

function createOrUpdateCartItem(
  existingItem: BaseCartLine | undefined,
  variant: ProductVariant,
  product: Product
): BaseCartLine {
  const quantity = existingItem ? existingItem.quantity + 1 : 1
  const totalAmount = calculateItemCost(quantity, variant.price.amount)

  return {
    ...existingItem,
    id: existingItem?.id || `temp-${Date.now()}`,
    quantity,
    merchandise: variant,
    cost: {
      ...existingItem?.cost,
      totalAmount: {
        amount: totalAmount,
        currencyCode: variant.price.currencyCode
      }
    }
  } as BaseCartLine
}

function updateCartTotals(
  lines: BaseCartLine[]
): Pick<Cart, 'totalQuantity' | 'cost'> {
  const totalQuantity = lines.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = lines.reduce(
    (sum, item) => sum + Number(item.cost.totalAmount.amount),
    0
  )
  const currencyCode = (lines[0]?.cost.totalAmount.currencyCode ?? 'USD') as CurrencyCode

  return {
    totalQuantity,
    cost: {
      checkoutChargeAmount: { amount: totalAmount.toString(), currencyCode },
      subtotalAmount: { amount: totalAmount.toString(), currencyCode },
      subtotalAmountEstimated: false,
      totalAmount: { amount: totalAmount.toString(), currencyCode },
      totalAmountEstimated: false,
      totalDutyAmount: null,
      totalDutyAmountEstimated: false,
      totalTaxAmount: { amount: '0', currencyCode },
      totalTaxAmountEstimated: false
    }
  }
}

function createEmptyCart(): Cart {
  const currencyCode = 'USD' as CurrencyCode
  return {
    id: `temp-cart-${Date.now()}`,
    checkoutUrl: '',
    totalQuantity: 0,
    lines: {
      edges: [],
      nodes: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null
      }
    },
    cost: {
      checkoutChargeAmount: { amount: '0', currencyCode },
      subtotalAmount: { amount: '0', currencyCode },
      subtotalAmountEstimated: false,
      totalAmount: { amount: '0', currencyCode },
      totalAmountEstimated: false,
      totalDutyAmount: null,
      totalDutyAmountEstimated: false,
      totalTaxAmount: { amount: '0', currencyCode },
      totalTaxAmountEstimated: false
    },
    appliedGiftCards: [],
    attributes: [],
    buyerIdentity: {
      countryCode: null,
      customer: null,
      deliveryAddressPreferences: [],
      email: null,
      phone: null,
      preferences: null,
      purchasingCompany: null
    },
    createdAt: new Date().toISOString(),
    deliveryGroups: {
      edges: [],
      nodes: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null
      }
    },
    discountAllocations: [],
    discountCodes: [],
    estimatedCost: {
      checkoutChargeAmount: { amount: '0', currencyCode },
      subtotalAmount: { amount: '0', currencyCode },
      totalAmount: { amount: '0', currencyCode },
      totalDutyAmount: null,
      totalTaxAmount: { amount: '0', currencyCode }
    },
    metafields: [],
    note: null,
    updatedAt: new Date().toISOString()
  } as Cart
}

function cartReducer(state: Cart | undefined, action: CartAction): Cart {
  const currentCart = state || createEmptyCart()

  switch (action.type) {
    case 'UPDATE_ITEM': {
      const { merchandiseId, updateType } = action.payload
      const currentLines = currentCart.lines.edges?.map(edge => edge.node) || []
      const updatedLines = currentLines
        .map((item) =>
          item.merchandise.id === merchandiseId
            ? updateCartItem(item, updateType)
            : item
        )
        .filter(Boolean) as BaseCartLine[]

      if (updatedLines.length === 0) {
        return {
          ...currentCart,
          lines: {
            ...currentCart.lines,
            edges: [],
            nodes: []
          },
          totalQuantity: 0,
          cost: {
            ...currentCart.cost,
            totalAmount: { ...currentCart.cost.totalAmount, amount: '0' }
          }
        }
      }

      const totals = updateCartTotals(updatedLines)
      return {
        ...currentCart,
        ...totals,
        lines: {
          ...currentCart.lines,
          edges: updatedLines.map((node, index) => ({
            cursor: `cursor-${index}`,
            node
          })),
          nodes: updatedLines
        }
      }
    }
    case 'ADD_ITEM': {
      const { variant, product } = action.payload
      const currentLines = currentCart.lines.edges?.map(edge => edge.node) || []
      const existingItem = currentLines.find(
        (item) => item.merchandise.id === variant.id
      )
      const updatedItem = createOrUpdateCartItem(
        existingItem,
        variant,
        product
      )

      const updatedLines = existingItem
        ? currentLines.map((item) =>
            item.merchandise.id === variant.id ? updatedItem : item
          )
        : [...currentLines, updatedItem]

      const totals = updateCartTotals(updatedLines)
      return {
        ...currentCart,
        ...totals,
        lines: {
          ...currentCart.lines,
          edges: updatedLines.map((node, index) => ({
            cursor: `cursor-${index}`,
            node
          })),
          nodes: updatedLines
        }
      }
    }
    default:
      return currentCart
  }
}

export function CartProvider({
  children,
  cartPromise
}: {
  children: React.ReactNode;
  cartPromise: Promise<Cart | undefined>;
}) {
  return (
    <CartContext.Provider value={{ cartPromise }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }

  const initialCart = use(context.cartPromise)
  const [optimisticCart, updateOptimisticCart] = useOptimistic(
    initialCart,
    cartReducer
  )

  const updateCartItem = (merchandiseId: string, updateType: UpdateType) => {
    updateOptimisticCart({
      type: 'UPDATE_ITEM',
      payload: { merchandiseId, updateType }
    })
  }

  const addCartItem = (variant: ProductVariant, product: Product) => {
    updateOptimisticCart({ type: 'ADD_ITEM', payload: { variant, product } })
  }

  return useMemo(
    () => ({
      cart: optimisticCart,
      updateCartItem,
      addCartItem
    }),
    [optimisticCart]
  )
}
