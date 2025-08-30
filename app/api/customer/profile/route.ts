import { NextResponse } from 'next/server'
import { CustomerAccount } from '../../../../lib/customer-account'

export async function GET() {
  try {
    const customerAccount = new CustomerAccount()
    const customer = await customerAccount.getCustomer()
    
    if (!customer) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Customer profile API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer profile' },
      { status: 500 }
    )
  }
}