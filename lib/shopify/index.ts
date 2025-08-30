import {
  TAGS
} from 'lib/constants'
import { revalidateTag } from 'next/cache'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { parseCookies } from 'nookies'
import type {
  AddToCartMutation,
  AddToCartMutationVariables,
  Cart,
  Collection,
  CreateCartMutation,
  CreateCartMutationVariables,
  EditCartItemsMutation,
  EditCartItemsMutationVariables,
  GetCartQuery,
  GetCartQueryVariables,
  GetCollectionProductsQuery,
  GetCollectionProductsQueryVariables,
  GetCollectionQuery,
  GetCollectionQueryVariables,
  GetCollectionsQuery,
  GetMenuQuery,
  GetMenuQueryVariables,
  GetPageQuery,
  GetPageQueryVariables,
  GetPagesQuery,
  GetPolicyQuery,
  GetPolicyQueryVariables,
  GetProductQuery,
  GetProductQueryVariables,
  GetProductRecommendationsQuery,
  GetProductRecommendationsQueryVariables,
  GetProductsQuery,
  GetProductsQueryVariables,
  MenuItem,
  Page,
  Product,
  RemoveFromCartMutation,
  RemoveFromCartMutationVariables,
  Shop,
  UpdateCartBuyerIdentityMutation,
  UpdateCartBuyerIdentityMutationVariables
} from '../../graphql/generated/graphql'
import {
  AddToCart,
  CreateCart,
  EditCartItems,
  GetCart,
  GetCollection,
  GetCollectionProducts,
  GetCollections,
  GetMenu,
  GetPage,
  GetPages,
  GetPolicy,
  GetProduct,
  GetProductRecommendations,
  GetProducts,
  ProductCollectionSortKeys,
  ProductSortKeys,
  RemoveFromCart,
  UpdateCartBuyerIdentity
} from '../../graphql/generated/graphql'
import { apolloClient } from '../apollo/client'

export type Policy = {
  body: string
  handle: string
  id: string
  title: string
  url: string
};

import type { DocumentNode } from 'graphql'

export async function shopifyFetch<T, V = Record<string, unknown>>({
  headers,
  query,
  variables,
  isQuery = true
}: {
  headers?: HeadersInit;
  query: DocumentNode;
  variables?: V;
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
  } catch (e: unknown) {
    const error = e as { graphQLErrors?: Array<{ message: string }>; networkError?: { message?: string; statusCode?: number } }
    
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      throw {
        cause: error.graphQLErrors[0]?.message || 'GraphQL error',
        status: 500,
        message: error.graphQLErrors[0]?.message,
        query
      }
    }

    if (error.networkError) {
      throw {
        cause: error.networkError.message || 'Network error',
        status: error.networkError.statusCode || 500,
        message: error.networkError.message,
        query
      }
    }

    throw {
      error: e,
      query
    }
  }
}

const removeEdgesAndNodes = <T>(array: { edges: Array<{ node: T }> }): T[] => {
  return array.edges.map((edge) => edge?.node)
}

export async function createCart(customerEmail?: string): Promise<Cart> {
  const buyerIdentity = customerEmail ? { email: customerEmail } : undefined
  
  const res = await shopifyFetch<{ data: CreateCartMutation }, CreateCartMutationVariables>({
    query: CreateCart,
    variables: {
      buyerIdentity
    },
    isQuery: false
  })

  return res.body.data.cartCreate!.cart! as Cart
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cartId = parseCookies().cartId!
  const res = await shopifyFetch<{ data: AddToCartMutation }, AddToCartMutationVariables>({
    query: AddToCart,
    variables: {
      cartId,
      lines
    },
    isQuery: false
  })
  return res.body.data.cartLinesAdd!.cart! as Cart
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const cartId = parseCookies().cartId!
  const res = await shopifyFetch<{ data: RemoveFromCartMutation }, RemoveFromCartMutationVariables>({
    query: RemoveFromCart,
    variables: {
      cartId,
      lineIds
    },
    isQuery: false
  })

  return res.body.data.cartLinesRemove!.cart! as Cart
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cartId = parseCookies().cartId!
  const res = await shopifyFetch<{ data: EditCartItemsMutation }, EditCartItemsMutationVariables>({
    query: EditCartItems,
    variables: {
      cartId,
      lines
    },
    isQuery: false
  })

  return res.body.data.cartLinesUpdate!.cart! as Cart
}

export async function updateCartBuyerIdentity(cartId: string, email: string): Promise<Cart> {
  const res = await shopifyFetch<{ data: UpdateCartBuyerIdentityMutation }, UpdateCartBuyerIdentityMutationVariables>(
    {
      query: UpdateCartBuyerIdentity,
      variables: {
        cartId,
        buyerIdentity: {
          email
        }
      },
      isQuery: false
    }
  )

  return res.body.data.cartBuyerIdentityUpdate!.cart! as Cart
}

export async function getCart(): Promise<Cart | undefined> {
  const cartId = parseCookies().cartId

  if (!cartId) {
    return undefined
  }

  const res = await shopifyFetch<{ data: GetCartQuery }, GetCartQueryVariables>({
    query: GetCart,
    variables: { cartId }
  })

  // Old carts becomes `null` when you checkout.
  if (!res.body.data.cart) {
    return undefined
  }

  return res.body.data.cart as Cart
}

export async function getCollection(
  handle: string
): Promise<Collection | undefined> {

  const res = await shopifyFetch<{ data: GetCollectionQuery }, GetCollectionQueryVariables>({
    query: GetCollection,
    variables: {
      handle: decodeURIComponent(handle)
    }
  })

  return res.body.data.collection as Collection || undefined
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

  const res = await shopifyFetch<{ data: GetCollectionProductsQuery }, GetCollectionProductsQueryVariables>({
    query: GetCollectionProducts,
    variables: {
      handle: decodeURIComponent(collection),
      reverse,
      sortKey: sortKey === 'CREATED_AT' ? ProductCollectionSortKeys.Created : sortKey as ProductCollectionSortKeys
    }
  })

  if (!res.body.data.collection) {
    console.log(`No collection found for \`${collection}\``)
    return []
  }

  return removeEdgesAndNodes(res.body.data.collection.products) as Product[]
}

export async function getCollections(): Promise<Collection[]> {

  const res = await shopifyFetch<{ data: GetCollectionsQuery }>({
    query: GetCollections
  })
  const shopifyCollections = removeEdgesAndNodes(res.body?.data?.collections) as Collection[]
  const collections = [
    {
      handle: '',
      title: 'All',
      description: 'All products',
      seo: {
        title: 'All',
        description: 'All products'
      },
      updatedAt: new Date().toISOString()
    } as Collection,
    // Filter out the `hidden` collections.
    // Collections that start with `hidden-*` need to be hidden on the search page.
    ...shopifyCollections.filter(
      (collection) => !collection.handle.startsWith('hidden')
    )
  ]

  return collections
}

export async function getMenu(handle: string): Promise<MenuItem[]> {

  const res = await shopifyFetch<{ data: GetMenuQuery }, GetMenuQueryVariables>({
    query: GetMenu,
    variables: {
      handle: decodeURIComponent(handle)
    }
  })

  return res.body?.data?.menu?.items as MenuItem[] || []
}

export async function getPage(handle: string): Promise<Page> {
  const res = await shopifyFetch<{ data: GetPageQuery }, GetPageQueryVariables>({
    query: GetPage,
    variables: {
      handle: decodeURIComponent(handle)
    }
  })

  return res.body.data.pageByHandle as Page
}

export async function getPages(): Promise<Page[]> {
  const res = await shopifyFetch<{ data: GetPagesQuery }>({
    query: GetPages
  })

  return removeEdgesAndNodes(res.body.data.pages) as Page[]
}

export async function getProduct(handle: string): Promise<Product | undefined> {

  const res = await shopifyFetch<{ data: GetProductQuery }, GetProductQueryVariables>({
    query: GetProduct,
    variables: {
      handle: decodeURIComponent(handle)
    }
  })

  return res.body.data.product as Product || undefined
}

export async function getProductRecommendations(
  productId: string
): Promise<Product[]> {

  const res = await shopifyFetch<{ data: GetProductRecommendationsQuery }, GetProductRecommendationsQueryVariables>({
    query: GetProductRecommendations,
    variables: {
      productId
    }
  })

  return res.body.data.productRecommendations as Product[] || []
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
  const res = await shopifyFetch<{ data: GetProductsQuery }, GetProductsQueryVariables>({
    query: GetProducts,
    variables: {
      query,
      reverse,
      sortKey: sortKey as ProductSortKeys
    }
  })

  return removeEdgesAndNodes(res.body.data.products) as Product[]
}

export async function getPolicy(handle: string): Promise<Policy | undefined> {
  const decodedHandle = decodeURIComponent(handle)
  
  const policyName = decodedHandle.replace(
    /-([a-z])/g,
    (_: unknown, m1: string) => m1.toUpperCase(),
  ) as keyof Pick<Shop, 'privacyPolicy' | 'shippingPolicy' | 'termsOfService' | 'refundPolicy'>

  const res = await shopifyFetch<{ data: GetPolicyQuery }, GetPolicyQueryVariables>({
    query: GetPolicy,
    variables: {
      privacyPolicy: policyName === 'privacyPolicy',
      refundPolicy: policyName === 'refundPolicy',
      shippingPolicy: policyName === 'shippingPolicy',
      termsOfService: policyName === 'termsOfService'
    }
  })

  const shop = res.body.data.shop
  return shop![policyName] || undefined
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

// Re-export types from generated GraphQL
export type { Cart, Collection, Image, Menu, Page, Product, ProductVariant } from '../../graphql/generated/graphql'
