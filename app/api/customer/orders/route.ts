import { NextRequest, NextResponse } from 'next/server'
import { CustomerAccount } from '../../../../lib/customer-account'

export async function GET(request: NextRequest) {
  try {
    const customerAccount = new CustomerAccount()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const first = parseInt(searchParams.get('first') || '20', 10)
    
    const orders = await customerAccount.getOrders(first)
    
    if (!orders) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    
    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Customer orders API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}