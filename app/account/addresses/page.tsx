import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CustomerAccount } from '../../../lib/customer-account'

function AddressCard({ address, isDefault }: { address: any, isDefault: boolean }) {
  return (
    <div className="bg-white shadow rounded-lg p-6 relative">
      {isDefault && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            デフォルト
          </span>
        </div>
      )}
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-gray-900">
            {address.firstName} {address.lastName}
          </h3>
        </div>
        
        {address.company && (
          <p className="text-gray-600">{address.company}</p>
        )}
        
        <div className="text-gray-600">
          <p>{address.address1}</p>
          {address.address2 && <p>{address.address2}</p>}
          <p>
            {address.city}, {address.province} {address.zip}
          </p>
          <p>{address.country}</p>
        </div>
        
        {address.phoneNumber && (
          <p className="text-gray-600">{address.phoneNumber}</p>
        )}
      </div>
      
      <div className="mt-6 flex space-x-3">
        <Link 
          href={`/account/addresses/${address.id}/edit`}
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          編集
        </Link>
        {!isDefault && (
          <>
            <button 
              onClick={async () => {
                try {
                  const { CustomerAccount } = await import('../../../lib/customer-account')
                  const customerAccount = new CustomerAccount()
                  await customerAccount.setDefaultAddress(address.id)
                  window.location.reload()
                } catch (error) {
                  alert(error instanceof Error ? error.message : 'エラーが発生しました')
                }
              }}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              デフォルトに設定
            </button>
            <button 
              onClick={async () => {
                if (!confirm('この住所を削除しますか？')) return
                
                try {
                  const { CustomerAccount } = await import('../../../lib/customer-account')
                  const customerAccount = new CustomerAccount()
                  await customerAccount.deleteAddress(address.id)
                  window.location.reload()
                } catch (error) {
                  alert(error instanceof Error ? error.message : 'エラーが発生しました')
                }
              }}
              className="text-sm text-red-600 hover:text-red-500"
            >
              削除
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default async function AddressesPage() {
  const customerAccount = new CustomerAccount()
  const customer = await customerAccount.getCustomer()
  
  if (!customer) {
    redirect('/login')
  }

  const addresses = customer.addresses?.edges?.map((edge: any) => edge.node) || []
  const defaultAddress = customer.defaultAddress

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Addresses
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your shipping and billing addresses.
          </p>
        </div>
        
        <Link
          href="/account/addresses/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          新しい住所を追加
        </Link>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No addresses</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new address.</p>
          <div className="mt-6">
            <Link
              href="/account/addresses/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              住所を追加
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Default Address */}
          {defaultAddress && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">デフォルト住所</h2>
              <AddressCard address={defaultAddress} isDefault={true} />
            </div>
          )}
          
          {/* Other Addresses */}
          {addresses.filter((addr: any) => addr.id !== defaultAddress?.id).length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">その他の住所</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {addresses
                  .filter((addr: any) => addr.id !== defaultAddress?.id)
                  .map((address: any) => (
                    <AddressCard 
                      key={address.id} 
                      address={address} 
                      isDefault={false} 
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
