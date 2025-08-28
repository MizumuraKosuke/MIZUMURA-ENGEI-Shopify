import { ReadonlyURLSearchParams } from 'next/navigation'

export const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000'

export const createUrl = (
  pathname: string,
  params: URLSearchParams | ReadonlyURLSearchParams
) => {
  const paramsString = params.toString()
  const queryString = `${paramsString.length ? '?' : ''}${paramsString}`

  return `${pathname}${queryString}`
}

export const ensureStartsWith = (stringToCheck: string, startsWith: string) =>
  stringToCheck.startsWith(startsWith)
    ? stringToCheck
    : `${startsWith}${stringToCheck}`

/**
 * Shopifyのcheckout URLをmyshopifyドメインに変換する
 * Primary domainが設定されている場合でも、checkoutだけは.myshopify.comドメインを使用する
 */
export const convertToMyshopifyCheckoutUrl = (checkoutUrl: string): string => {
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN
  
  console.log('Original checkout URL:', checkoutUrl)
  
  if (!shopDomain) {
    console.warn('SHOPIFY_STORE_DOMAIN not set, using original checkout URL')
    return checkoutUrl
  }

  try {
    const url = new URL(checkoutUrl)
    
    // 既にmyshopifyドメインの場合はそのまま返す
    if (url.hostname.endsWith('.myshopify.com')) {
      console.log('Already myshopify domain, returning as-is')
      return checkoutUrl
    }

    // Primary domainからmyshopifyドメインに変換
    const originalHostname = url.hostname
    url.hostname = shopDomain
    
    // カートURL (/cart/c/...) をチェックアウトURL (/checkouts/cn/...) に変換
    if (url.pathname.startsWith('/cart/c/')) {
      url.pathname = url.pathname.replace('/cart/c/', '/checkouts/cn/')
    }
    
    const convertedUrl = url.toString()
    console.log(`Converted checkout URL: ${originalHostname} -> ${shopDomain}`)
    console.log('Final checkout URL:', convertedUrl)
    
    return convertedUrl
  } catch (error) {
    console.error('Failed to convert checkout URL:', error)
    return checkoutUrl
  }
}

export const validateEnvironmentVariables = () => {
  const requiredEnvironmentVariables = [
    'SHOPIFY_STORE_DOMAIN',
    'SHOPIFY_STOREFRONT_ACCESS_TOKEN'
  ]
  const missingEnvironmentVariables = [] as string[]

  requiredEnvironmentVariables.forEach((envVar) => {
    if (!process.env[envVar]) {
      missingEnvironmentVariables.push(envVar)
    }
  })

  if (missingEnvironmentVariables.length) {
    throw new Error(
      `The following environment variables are missing. Your site will not work without them. Read more: https://vercel.com/docs/integrations/shopify#configure-environment-variables\n\n${missingEnvironmentVariables.join(
        '\n'
      )}\n`
    )
  }

  if (
    process.env.SHOPIFY_STORE_DOMAIN?.includes('[') ||
    process.env.SHOPIFY_STORE_DOMAIN?.includes(']')
  ) {
    throw new Error(
      'Your `SHOPIFY_STORE_DOMAIN` environment variable includes brackets (ie. `[` and / or `]`). Your site will not work with them there. Please remove them.'
    )
  }
}
