import {
  HIDDEN_PRODUCT_TAG,
  TAGS
} from 'lib/constants'
import { revalidateTag } from 'next/cache'
import { cookies, headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { apolloClient } from '../apollo/client'
import {
  addToCartMutation,
  createCartMutation,
  editCartItemsMutation,
  removeFromCartMutation
} from './mutations/cart'
import { getCartQuery } from './queries/cart'
import {
  getCollectionProductsQuery,
  getCollectionQuery,
  getCollectionsQuery
} from './queries/collection'
import { getMenuQuery } from './queries/menu'
import { getPageQuery, getPagesQuery } from './queries/page'
import { getPolicyQuery } from './queries/policy'
import {
  getProductQuery,
  getProductRecommendationsQuery,
  getProductsQuery
} from './queries/product'
import {
  Cart,
  Collection,
  Connection,
  Image,
  Menu,
  Page,
  Policy,
  Product,
  Shop,
  ShopifyAddToCartOperation,
  ShopifyCart,
  ShopifyCartOperation,
  ShopifyCollection,
  ShopifyCollectionOperation,
  ShopifyCollectionProductsOperation,
  ShopifyCollectionsOperation,
  ShopifyCreateCartOperation,
  ShopifyMenuOperation,
  ShopifyPageOperation,
  ShopifyPagesOperation,
  ShopifyPolicyOperation,
  ShopifyProduct,
  ShopifyProductOperation,
  ShopifyProductRecommendationsOperation,
  ShopifyProductsOperation,
  ShopifyRemoveFromCartOperation,
  ShopifyUpdateCartOperation
} from './types'

type ExtractVariables<T> = T extends { variables: object }
  ? T['variables']
  : never;

import type { DocumentNode } from 'graphql'

export async function shopifyFetch<T>({
  headers,
  query,
  variables,
  isQuery = true
}: {
  headers?: HeadersInit;
  query: DocumentNode;
  variables?: ExtractVariables<T>;
  isQuery?: boolean;
}): Promise<{ status: number; body: T } | never> {
  try {
    let result
    if (isQuery) {
      result = await apolloClient.query({
        query,
        variables: variables || {},
        context: {
          headers: headers || {}
        }
      })
    } else {
      result = await apolloClient.mutate({
        mutation: query,
        variables: variables || {},
        context: {
          headers: headers || {}
        }
      })
    }

    return {
      status: 200,
      body: { data: result.data } as T
    }
  } catch (e: any) {
    if (e.graphQLErrors && e.graphQLErrors.length > 0) {
      throw {
        cause: e.graphQLErrors[0].message || 'GraphQL error',
        status: 500,
        message: e.graphQLErrors[0].message,
        query
      }
    }

    if (e.networkError) {
      throw {
        cause: e.networkError.message || 'Network error',
        status: e.networkError.statusCode || 500,
        message: e.networkError.message,
        query
      }
    }

    throw {
      error: e,
      query
    }
  }
}

const removeEdgesAndNodes = <T>(array: Connection<T>): T[] => {
  return array.edges.map((edge) => edge?.node)
}

const reshapeCart = (cart: ShopifyCart): Cart => {
  if (!cart.cost?.totalTaxAmount) {
    cart.cost.totalTaxAmount = {
      amount: '0.0',
      currencyCode: cart.cost.totalAmount.currencyCode
    }
  }

  return {
    ...cart,
    lines: removeEdgesAndNodes(cart.lines)
  }
}

const reshapeCollection = (
  collection: ShopifyCollection
): Collection | undefined => {
  if (!collection) {
    return undefined
  }

  return {
    ...collection,
    path: `/search/${collection.handle}`
  }
}

const reshapeCollections = (collections: ShopifyCollection[]) => {
  const reshapedCollections = []

  for (const collection of collections) {
    if (collection) {
      const reshapedCollection = reshapeCollection(collection)

      if (reshapedCollection) {
        reshapedCollections.push(reshapedCollection)
      }
    }
  }

  return reshapedCollections
}

const reshapeImages = (images: Connection<Image>, productTitle: string) => {
  const flattened = removeEdgesAndNodes(images)

  return flattened.map((image) => {
    const filename = image.url.match(/.*\/(.*)\..*/)?.[1]
    return {
      ...image,
      altText: image.altText || `${productTitle} - ${filename}`
    }
  })
}

const reshapeProduct = (
  product: ShopifyProduct,
  filterHiddenProducts: boolean = true
) => {
  if (
    !product ||
    (filterHiddenProducts && product.tags.includes(HIDDEN_PRODUCT_TAG))
  ) {
    return undefined
  }

  const { images, variants, ...rest } = product

  return {
    ...rest,
    images: reshapeImages(images, product.title),
    variants: removeEdgesAndNodes(variants)
  }
}

const reshapeProducts = (products: ShopifyProduct[]) => {
  const reshapedProducts = []

  for (const product of products) {
    if (product) {
      const reshapedProduct = reshapeProduct(product)

      if (reshapedProduct) {
        reshapedProducts.push(reshapedProduct)
      }
    }
  }

  return reshapedProducts
}

export async function createCart(): Promise<Cart> {
  const res = await shopifyFetch<ShopifyCreateCartOperation>({
    query: createCartMutation,
    isQuery: false
  })

  return reshapeCart(res.body.data.cartCreate.cart)
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cartId = (await cookies()).get('cartId')?.value!
  const res = await shopifyFetch<ShopifyAddToCartOperation>({
    query: addToCartMutation,
    variables: {
      cartId,
      lines
    },
    isQuery: false
  })
  return reshapeCart(res.body.data.cartLinesAdd.cart)
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const cartId = (await cookies()).get('cartId')?.value!
  const res = await shopifyFetch<ShopifyRemoveFromCartOperation>({
    query: removeFromCartMutation,
    variables: {
      cartId,
      lineIds
    },
    isQuery: false
  })

  return reshapeCart(res.body.data.cartLinesRemove.cart)
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cartId = (await cookies()).get('cartId')?.value!
  const res = await shopifyFetch<ShopifyUpdateCartOperation>({
    query: editCartItemsMutation,
    variables: {
      cartId,
      lines
    },
    isQuery: false
  })

  return reshapeCart(res.body.data.cartLinesUpdate.cart)
}

export async function getCart(): Promise<Cart | undefined> {
  const cartId = (await cookies()).get('cartId')?.value

  if (!cartId) {
    return undefined
  }

  const res = await shopifyFetch<ShopifyCartOperation>({
    query: getCartQuery,
    variables: { cartId }
  })

  // Old carts becomes `null` when you checkout.
  if (!res.body.data.cart) {
    return undefined
  }

  return reshapeCart(res.body.data.cart)
}

export async function getCollection(
  handle: string
): Promise<Collection | undefined> {

  const res = await shopifyFetch<ShopifyCollectionOperation>({
    query: getCollectionQuery,
    variables: {
      handle: decodeURIComponent(handle)
    }
  })

  return reshapeCollection(res.body.data.collection)
}

export async function getCollectionProducts({
  collection,
  reverse,
  sortKey
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {

  const res = await shopifyFetch<ShopifyCollectionProductsOperation>({
    query: getCollectionProductsQuery,
    variables: {
      handle: decodeURIComponent(collection),
      reverse,
      sortKey: sortKey === 'CREATED_AT' ? 'CREATED' : sortKey
    }
  })

  if (!res.body.data.collection) {
    console.log(`No collection found for \`${collection}\``)
    return []
  }

  return reshapeProducts(
    removeEdgesAndNodes(res.body.data.collection.products)
  )
}

export async function getCollections(): Promise<Collection[]> {

  const res = await shopifyFetch<ShopifyCollectionsOperation>({
    query: getCollectionsQuery
  })
  const shopifyCollections = removeEdgesAndNodes(res.body?.data?.collections)
  const collections = [
    {
      handle: '',
      title: 'All',
      description: 'All products',
      seo: {
        title: 'All',
        description: 'All products'
      },
      path: '/search',
      updatedAt: new Date().toISOString()
    },
    // Filter out the `hidden` collections.
    // Collections that start with `hidden-*` need to be hidden on the search page.
    ...reshapeCollections(shopifyCollections).filter(
      (collection) => !collection.handle.startsWith('hidden')
    )
  ]

  return collections
}

export async function getMenu(handle: string): Promise<Menu[]> {

  const res = await shopifyFetch<ShopifyMenuOperation>({
    query: getMenuQuery,
    variables: {
      handle: decodeURIComponent(handle)
    }
  })

  return (
    res.body?.data?.menu?.items.map((item: { title: string; url: string }) => ({
      title: item.title,
      path: item.url
        .replace(process.env.SHOPIFY_STORE_DOMAIN || '', '')
        .replace('/collections', '/search')
        .replace('/pages', '')
    })) || []
  )
}

export async function getPage(handle: string): Promise<Page> {
  const res = await shopifyFetch<ShopifyPageOperation>({
    query: getPageQuery,
    variables: {
      handle: decodeURIComponent(handle)
    }
  })

  return res.body.data.pageByHandle
}

export async function getPages(): Promise<Page[]> {
  const res = await shopifyFetch<ShopifyPagesOperation>({
    query: getPagesQuery
  })

  return removeEdgesAndNodes(res.body.data.pages)
}

export async function getProduct(handle: string): Promise<Product | undefined> {

  const res = await shopifyFetch<ShopifyProductOperation>({
    query: getProductQuery,
    variables: {
      handle: decodeURIComponent(handle)
    }
  })

  return reshapeProduct(res.body.data.product, false)
}

export async function getProductRecommendations(
  productId: string
): Promise<Product[]> {

  const res = await shopifyFetch<ShopifyProductRecommendationsOperation>({
    query: getProductRecommendationsQuery,
    variables: {
      productId
    }
  })

  return reshapeProducts(res.body.data.productRecommendations)
}

export async function getProducts({
  query,
  reverse,
  sortKey
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {

  const res = await shopifyFetch<ShopifyProductsOperation>({
    query: getProductsQuery,
    variables: {
      query,
      reverse,
      sortKey
    }
  })

  return reshapeProducts(removeEdgesAndNodes(res.body.data.products))
}

export async function getPolicy(handle: string): Promise<Policy | undefined> {
  const decodedHandle = decodeURIComponent(handle)
  
  const policyName = decodedHandle.replace(
    /-([a-z])/g,
    (_: unknown, m1: string) => m1.toUpperCase(),
  ) as keyof Pick<Shop, 'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy'>

  const res = await shopifyFetch<ShopifyPolicyOperation>({
    query: getPolicyQuery,
    variables: {
      privacyPolicy: policyName === 'privacyPolicy',
      refundPolicy: policyName === 'refundPolicy',
      shippingPolicy: policyName === 'shippingPolicy',
      termsOfService: policyName === 'termsOfService'
    }
  })

  const shop = res.body.data.shop
  return shop[policyName] || undefined
}

// This is called from `app/api/revalidate.ts` so providers can control revalidation logic.
export async function revalidate(req: NextRequest): Promise<NextResponse> {
  // We always need to respond with a 200 status code to Shopify,
  // otherwise it will continue to retry the request.
  const collectionWebhooks = [
    'collections/create',
    'collections/delete',
    'collections/update'
  ]
  const productWebhooks = [
    'products/create',
    'products/delete',
    'products/update'
  ]
  const topic = (await headers()).get('x-shopify-topic') || 'unknown'
  const secret = req.nextUrl.searchParams.get('secret')
  const isCollectionUpdate = collectionWebhooks.includes(topic)
  const isProductUpdate = productWebhooks.includes(topic)

  if (!secret || secret !== process.env.SHOPIFY_REVALIDATION_SECRET) {
    console.error('Invalid revalidation secret.')
    return NextResponse.json({ status: 401 })
  }

  if (!isCollectionUpdate && !isProductUpdate) {
    // We don't need to revalidate anything for any other topics.
    return NextResponse.json({ status: 200 })
  }

  if (isCollectionUpdate) {
    revalidateTag(TAGS.collections)
  }

  if (isProductUpdate) {
    revalidateTag(TAGS.products)
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() })
}
