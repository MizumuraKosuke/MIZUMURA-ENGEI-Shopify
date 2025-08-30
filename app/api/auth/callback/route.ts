import { NextRequest } from 'next/server'
import { CustomerAccount } from '../../../../lib/customer-account'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const customerAccount = new CustomerAccount()
    const redirectUri = new URL('/api/auth/callback', request.url).toString()
    await customerAccount.authorize(code, redirectUri)
  }

  return Response.redirect(new URL('/', request.url))
}