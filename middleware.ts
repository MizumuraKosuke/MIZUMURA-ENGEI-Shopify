import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Intercept Shopify SSO hint and redirect to return_to URL
  if (pathname.startsWith('/customer_authentication/sso_hint')) {
    const returnTo = request.nextUrl.searchParams.get('return_to')
    
    if (returnTo) {
      // Decode the return_to URL and redirect there
      return NextResponse.redirect(decodeURIComponent(returnTo))
    }
    
    // Fallback to Shopify account page if no return_to parameter
    const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN || 'yourstore.myshopify.com'
    return NextResponse.redirect(`https://${shopifyDomain}/account`)
  }

  // Intercept Shopify login and redirect to Shopify login with return_to
  if (pathname.startsWith('/customer_authentication/login')) {
    const returnTo = request.nextUrl.searchParams.get('return_to')
    const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN || 'yourstore.myshopify.com'
    
    let loginUrl = `https://${shopifyDomain}/account/login`
    
    if (returnTo) {
      loginUrl += `?return_url=${encodeURIComponent(returnTo)}`
    }
    
    return NextResponse.redirect(loginUrl)
  }

  // Intercept Shopify logout and redirect to return_url
  if (pathname.startsWith('/customer_identity/logout')) {
    const returnUrl = request.nextUrl.searchParams.get('return_url')
    
    if (returnUrl) {
      // Decode the return_url and redirect there
      return NextResponse.redirect(decodeURIComponent(returnUrl))
    }
    
    // Fallback to home page if no return_url parameter
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/customer_authentication/sso_hint/:path*',
    '/customer_authentication/login/:path*', 
    '/customer_identity/logout/:path*'
  ]
}
