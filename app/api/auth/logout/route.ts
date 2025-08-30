import { NextRequest } from 'next/server'
import { CustomerAccount } from '../../../../lib/customer-account'

export async function GET(request: NextRequest) {
  const customerAccount = new CustomerAccount()
  await customerAccount.logout()
  
  return Response.redirect(new URL('/', request.url))
}