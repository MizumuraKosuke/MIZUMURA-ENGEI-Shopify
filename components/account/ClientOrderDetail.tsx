'use client'

import Link from 'next/link'
import { useCustomerOrder } from '../../hooks/useCustomer'

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

interface ClientOrderDetailProps {
  orderId: string
}

export default function ClientOrderDetail({ orderId }: ClientOrderDetailProps) {
  const { order, loading, error } = useCustomerOrder(orderId)

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading order...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link href="/account/orders" className="text-indigo-600 hover:text-indigo-500 mt-2 inline-block">
            ← Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
          <p className="mt-2 text-gray-600">The requested order could not be found.</p>
          <Link href="/account/orders" className="text-indigo-600 hover:text-indigo-500 mt-2 inline-block">
            ← Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2">
          <li><Link href="/account" className="text-gray-500 hover:text-gray-700">Account</Link></li>
          <li><span className="text-gray-400">/</span></li>
          <li><Link href="/account/orders" className="text-gray-500 hover:text-gray-700">Orders</Link></li>
          <li><span className="text-gray-400">/</span></li>
          <li><span className="text-gray-900">{order.orderNumber}</span></li>
        </ol>
      </nav>

      {/* Order Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Order {order.orderNumber}
            </h1>
            <p className="mt-1 text-gray-600">
              Placed on {new Date(order.processedAt).toLocaleDateString('ja-JP')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.fulfillmentStatus)}`}>
              {getStatusText(order.fulfillmentStatus)}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.financialStatus)}`}>
              {getStatusText(order.financialStatus)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Order Items */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">注文商品</h2>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                {order.lineItems.map((item: any) => (
                  <div key={item.id} className="flex items-start space-x-4">
                    <div className="h-20 w-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      {item.variant?.image?.url ? (
                        <img 
                          src={item.variant.image.url} 
                          alt={item.variant.image.altText || item.title}
                          className="h-20 w-20 rounded-lg object-cover"
                        />
                      ) : (
                        <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                      {item.variant?.title && <p className="text-sm text-gray-600">{item.variant.title}</p>}
                      {item.variant?.sku && <p className="text-sm text-gray-600">SKU: {item.variant.sku}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-600">数量: {item.quantity}</span>
                        <span className="text-lg font-medium text-gray-900">
                          ¥{(parseInt(item.originalUnitPrice.amount) * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fulfillments */}
          {order.fulfillments.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">配送情報</h2>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  {order.fulfillments.map((fulfillment: any) => (
                    <div key={fulfillment.id} className="border-l-4 border-indigo-400 pl-4">
                      <p className="font-medium text-gray-900">
                        Status: {fulfillment.status}
                      </p>
                      {fulfillment.trackingNumber && (
                        <p className="text-sm text-gray-600">
                          追跡番号: {fulfillment.trackingNumber}
                        </p>
                      )}
                      {fulfillment.trackingUrl && (
                        <a 
                          href={fulfillment.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-500"
                        >
                          配送状況を確認
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-8">
          {/* Order Summary */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">注文合計</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>小計</span>
                <span>¥{parseInt(order.subtotalPrice.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>配送料</span>
                <span>¥{parseInt(order.totalShippingPrice.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>税金</span>
                <span>¥{parseInt(order.totalTax.amount).toLocaleString()}</span>
              </div>
              <hr />
              <div className="flex justify-between font-medium text-lg">
                <span>合計</span>
                <span>¥{parseInt(order.totalPrice.amount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">配送先住所</h2>
            </div>
            <div className="px-6 py-4">
              <div className="text-sm text-gray-900">
                <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zip}</p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && <p>Tel: {order.shippingAddress.phone}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}