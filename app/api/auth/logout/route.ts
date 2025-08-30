import { NextRequest } from 'next/server'
import { CustomerAccount } from '../../../../lib/customer-account'

// Customer Account API logout flow
export async function GET(request: NextRequest) {
  const customerAccount = new CustomerAccount()
  
  // Generate Shopify logout URL with redirect back to our site
  const redirectUri = new URL('/', request.url).toString()
  const logoutUrl = customerAccount.logout(redirectUri)
  
  // Clear local session first
  await customerAccount.clearSession()
  
  // Redirect to Shopify's logout endpoint
  return Response.redirect(logoutUrl)
}