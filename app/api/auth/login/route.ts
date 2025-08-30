import { NextRequest } from 'next/server'
import { CustomerAccount } from '../../../../lib/customer-account'

export async function GET(request: NextRequest) {
  const customerAccount = new CustomerAccount()
  const redirectUri = new URL('/api/auth/callback', request.url).toString()
  
  const loginUrl = await customerAccount.login(redirectUri)
  return Response.redirect(loginUrl)
}
