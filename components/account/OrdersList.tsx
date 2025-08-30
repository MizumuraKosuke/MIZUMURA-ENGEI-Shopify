'use client'

import Link from 'next/link'
import { useCustomerOrders } from '../../hooks/useCustomer'

function getStatusColor(status: string) {
  switch (status) {
    case 'FULFILLED':
      return 'bg-green-100 text-green-800'
    case 'UNFULFILLED':
      return 'bg-yellow-100 text-yellow-800'
    case 'PAID':
      return 'bg-green-100 text-green-800'
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'FULFILLED':
      return '配送済み'
    case 'UNFULFILLED':
      return '未配送'
    case 'PAID':
      return '支払い済み'
    case 'PENDING':
      return '支払い保留中'
    default:
      return status
  }
}

export default function OrdersList() {
  const { orders, loading, error } = useCustomerOrders()

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading orders...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No orders</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by placing your first order.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <div key={order.id} className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Order {order.orderNumber}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.fulfillmentStatus)}`}>
                  {getStatusText(order.fulfillmentStatus)}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.financialStatus)}`}>
                  {getStatusText(order.financialStatus)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-gray-900">
                  ¥{parseInt(order.totalPrice.amount).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(order.processedAt).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4">
            <div className="space-y-3">
              {order.lineItems.map((item: any, index: number) => (
                <div key={item.id || index} className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    {item.variant?.image?.url ? (
                      <img 
                        src={item.variant.image.url} 
                        alt={item.variant.image.altText || item.title}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-500">
                      数量: {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="px-6 py-3 bg-gray-50 rounded-b-lg">
            <div className="flex justify-between">
              <Link 
                href={`/account/orders/${order.id.split('/').pop()}`}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                注文詳細を見る
              </Link>
              <button className="text-sm text-indigo-600 hover:text-indigo-500">
                再注文する
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}