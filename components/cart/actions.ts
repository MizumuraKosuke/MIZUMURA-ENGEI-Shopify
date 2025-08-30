'use server'

import { TAGS } from 'lib/constants'
import { CustomerAccount } from 'lib/customer-account'
import {
  addToCart,
  createCart,
  getCart,
  removeFromCart,
  updateCart
} from 'lib/shopify'
import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function addItem(
  prevState: any,
  selectedVariantId: string | undefined
) {
  if (!selectedVariantId) {
    return 'Error adding item to cart'
  }

  try {
    await addToCart([{ merchandiseId: selectedVariantId, quantity: 1 }])
    revalidateTag(TAGS.cart)
  } catch (e) {
    return 'Error adding item to cart'
  }
}

export async function removeItem(prevState: any, merchandiseId: string) {
  try {
    const cart = await getCart()

    if (!cart) {
      return 'Error fetching cart'
    }

    const lineItem = cart?.lines?.edges?.find(
      ({ node: line }) => line.merchandise.id === merchandiseId
    )?.node

    if (lineItem && lineItem.id) {
      await removeFromCart([lineItem.id])
      revalidateTag(TAGS.cart)
    } else {
      return 'Item not found in cart'
    }
  } catch (e) {
    return 'Error removing item from cart'
  }
}

export async function updateItemQuantity(
  prevState: any,
  payload: {
    merchandiseId: string;
    quantity: number;
  }
) {
  const { merchandiseId, quantity } = payload

  try {
    const cart = await getCart()

    if (!cart) {
      return 'Error fetching cart'
    }

    const lineItem = cart?.lines?.edges?.find(
      ({ node: line }) => line.merchandise.id === merchandiseId
    )?.node

    if (lineItem && lineItem.id) {
      if (quantity === 0) {
        await removeFromCart([lineItem.id])
      } else {
        await updateCart([
          {
            id: lineItem.id,
            merchandiseId,
            quantity
          }
        ])
      }
    } else if (quantity > 0) {
      // If the item doesn't exist in the cart and quantity > 0, add it
      await addToCart([{ merchandiseId, quantity }])
    }

    revalidateTag(TAGS.cart)
  } catch (e) {
    console.error(e)
    return 'Error updating item quantity'
  }
}

export async function redirectToCheckout() {
  const cart = await getCart()
  
  // ShopifyのカートURLを適切なチェックアウトURLに変換
  let checkoutUrl = cart!.checkoutUrl
  
  // カートURL (/cart/c/...) をチェックアウトURL形式に変換
  if (checkoutUrl.includes('/cart/c/')) {
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN
    if (shopDomain) {
      // URLを解析してパスとパラメータを取得
      const url = new URL(checkoutUrl, `https://${shopDomain}`)
      // /cart/c/... を /checkouts/cn/... に変換
      const newPath = url.pathname.replace('/cart/c/', '/checkouts/cn/')
      checkoutUrl = `https://${shopDomain}${newPath}${url.search}`
    }
  }
  
  redirect(checkoutUrl)
}

export async function createCartAndSetCookie() {
  // Get customer email from Customer Account API if logged in
  let customerEmail: string | undefined
  try {
    const customerAccount = new CustomerAccount()
    const customer = await customerAccount.getCustomer()
    customerEmail = customer?.email
  } catch (error) {
    // Customer not logged in or error fetching customer data
    customerEmail = undefined
  }

  const cart = await createCart(customerEmail);
  (await cookies()).set('cartId', cart.id!)
}
