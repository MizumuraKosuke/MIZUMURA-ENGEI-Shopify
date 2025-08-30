import { NextRequest, NextResponse } from 'next/server'
import { CustomerAccount } from '../../../../../lib/customer-account'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const customerAccount = new CustomerAccount()
    
    const order = await customerAccount.getOrder(orderId)
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found or not authenticated' }, { status: 404 })
    }
    
    return NextResponse.json({ order })
  } catch (error) {
    console.error('Customer order API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}