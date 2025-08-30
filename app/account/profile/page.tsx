import { redirect } from 'next/navigation'
import { CustomerAccount } from '../../../lib/customer-account'
import ProfileForm from '../../../components/account/ProfileForm'

export default async function ProfilePage() {
  const customerAccount = new CustomerAccount()
  const customer = await customerAccount.getCustomer()
  
  if (!customer) {
    redirect('/login')
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Profile Details
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your personal information and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <ProfileForm customer={customer} />
        </div>

        {/* Account Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Account Summary
              </h3>
              
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Display Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {customer.displayName || `${customer.firstName} ${customer.lastName}`}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Customer ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {customer.id}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Addresses</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {customer.addresses?.edges?.length || 0}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}