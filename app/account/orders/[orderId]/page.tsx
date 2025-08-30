import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CustomerAccount } from '../../../../lib/customer-account'

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

export default async function OrderDetailPage({ 
  params 
}: { 
  params: Promise<{ orderId: string }> 
}) {
  const { orderId } = await params
  const customerAccount = new CustomerAccount()
  const customer = await customerAccount.getCustomer()
  
  if (!customer) {
    redirect('/login')
  }

  const order = await customerAccount.getOrder(orderId)
  
  if (!order) {
    redirect('/account/orders')
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <div className="flex items-center space-x-2 text-sm">
          <Link href="/account" className="text-gray-500 hover:text-gray-700">
            Account
          </Link>
          <span className="text-gray-400">/</span>
          <Link href="/account/orders" className="text-gray-500 hover:text-gray-700">
            Orders
          </Link>
          <span className="text-gray-400">/</span>
          <span className="font-medium text-gray-900">{order.orderNumber}</span>
        </div>
      </nav>

      {/* Order Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Order {order.orderNumber}
            </h1>
            <p className="mt-2 text-gray-600">
              注文日: {new Date(order.processedAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          
          <div className="flex space-x-3">
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
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Items */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">注文商品</h2>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                {order.lineItems.map((item) => (
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

          {/* Shipping & Tracking */}
          {order.fulfillments.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">配送情報</h2>
              </div>
              <div className="px-6 py-4">
                {order.fulfillments.map((fulfillment, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">追跡番号</span>
                      <span className="text-sm text-gray-600 font-mono">{fulfillment.trackingNumber}</span>
                    </div>
                    {fulfillment.deliveredAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">配送完了日</span>
                        <span className="text-sm text-gray-600">
                          {new Date(fulfillment.deliveredAt).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    )}
                    <div className="pt-2">
                      <a
                        href={fulfillment.trackingUrl || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        配送状況を確認
                        <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Summary */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">注文合計</h2>
            </div>
            <div className="px-6 py-4">
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">小計</dt>
                  <dd className="text-sm text-gray-900">¥{parseInt(order.subtotalPrice.amount).toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">送料</dt>
                  <dd className="text-sm text-gray-900">¥{parseInt(order.totalShippingPrice.amount).toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">税金</dt>
                  <dd className="text-sm text-gray-900">¥{parseInt(order.totalTax.amount).toLocaleString()}</dd>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <dt className="text-lg font-medium text-gray-900">合計</dt>
                  <dd className="text-lg font-medium text-gray-900">¥{parseInt(order.totalPrice.amount).toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">配送先住所</h2>
            </div>
            <div className="px-6 py-4">
              <address className="not-italic text-sm text-gray-600 space-y-1">
                <div className="font-medium text-gray-900">
                  {order.shippingAddress.lastName} {order.shippingAddress.firstName}
                </div>
                <div>{order.shippingAddress.address1}</div>
                {order.shippingAddress.address2 && <div>{order.shippingAddress.address2}</div>}
                <div>
                  {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zip}
                </div>
                <div>{order.shippingAddress.country}</div>
                {order.shippingAddress.phone && <div>{order.shippingAddress.phone}</div>}
              </address>
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">請求先住所</h2>
            </div>
            <div className="px-6 py-4">
              <address className="not-italic text-sm text-gray-600 space-y-1">
                <div className="font-medium text-gray-900">
                  {order.billingAddress.lastName} {order.billingAddress.firstName}
                </div>
                <div>{order.billingAddress.address1}</div>
                {order.billingAddress.address2 && <div>{order.billingAddress.address2}</div>}
                <div>
                  {order.billingAddress.city}, {order.billingAddress.province} {order.billingAddress.zip}
                </div>
                <div>{order.billingAddress.country}</div>
              </address>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4">
              <div className="space-y-3">
                <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  再注文する
                </button>
                <button className="w-full border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  サポートに連絡
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
