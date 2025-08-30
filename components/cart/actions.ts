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
  
  // Update buyer identity if customer is logged in (Hydrogen pattern)
  try {
    const customerAccount = new CustomerAccount()
    const customer = await customerAccount.getCustomer()
    
    if (customer && cart?.id) {
      // Update cart with customer information before checkout
      await updateCartBuyerIdentity(cart.id, customer.emailAddress.emailAddress)
    }
  } catch {
    // Customer not logged in, continue with checkout
  }
  
  // Use the checkout URL directly (trust Shopify's API)
  redirect(cart!.checkoutUrl)
}

async function updateCartBuyerIdentity(cartId: string, email: string) {  
  const { updateCartBuyerIdentity: updateBuyerIdentity } = await import('lib/shopify')
  
  try {
    await updateBuyerIdentity(cartId, email)
  } catch {
    // Ignore errors, checkout will still work
  }
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
