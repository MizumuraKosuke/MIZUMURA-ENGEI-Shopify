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

  return NextResponse.next()
}

export const config = {
  matcher: ['/customer_authentication/sso_hint/:path*']
}