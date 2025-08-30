import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CustomerAccount } from '../../lib/customer-account'

export default async function AccountPage() {
  const customerAccount = new CustomerAccount()
  const customer = await customerAccount.getCustomer()

  if (!customer) {
    redirect('/login')
  }

  const heading = customer
    ? customer.firstName
      ? `Welcome, ${customer.firstName}`
      : `Welcome to your account.`
    : 'Account Details'

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <div className="account">
        <h1 className="text-3xl font-bold">{heading}</h1>
        <br />
        <AccountMenu />
        <br />
        <br />
        <AccountDetails customer={customer} />
      </div>
    </div>
  )
}

function AccountMenu() {
  return (
    <nav role="navigation" className="flex space-x-4 text-sm">
      <Link href="/account/orders" className="hover:font-bold">
        Orders
      </Link>
      <span>|</span>
      <Link href="/account/profile" className="hover:font-bold">
        Profile
      </Link>
      <span>|</span>
      <Link href="/account/addresses" className="hover:font-bold">
        Addresses
      </Link>
      <span>|</span>
      <Logout />
    </nav>
  )
}

function Logout() {
  return (
    <form className="inline" method="GET" action="/api/auth/logout">
      <button type="submit" className="hover:font-bold">
        Sign out
      </button>
    </form>
  )
}

function AccountDetails({ customer }: { customer: any }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Profile</h2>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Name:</span> {customer.firstName} {customer.lastName}
          </p>
          <p>
            <span className="font-medium">Email:</span> {customer.emailAddress?.emailAddress}
          </p>
        </div>
      </div>

      {customer.defaultAddress && (
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">Default Address</h2>
          <div className="space-y-1">
            <p>{customer.defaultAddress.firstName} {customer.defaultAddress.lastName}</p>
            {customer.defaultAddress.company && <p>{customer.defaultAddress.company}</p>}
            <p>{customer.defaultAddress.address1}</p>
            {customer.defaultAddress.address2 && <p>{customer.defaultAddress.address2}</p>}
            <p>{customer.defaultAddress.city}, {customer.defaultAddress.territoryCode} {customer.defaultAddress.zip}</p>
            {customer.defaultAddress.phoneNumber && <p>{customer.defaultAddress.phoneNumber}</p>}
          </div>
        </div>
      )}

      {customer.addresses?.nodes?.length > 0 && (
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-semibold">All Addresses ({customer.addresses.nodes.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {customer.addresses.nodes.map((address: any) => (
              <div key={address.id} className="rounded border p-3">
                <p className="font-medium">{address.firstName} {address.lastName}</p>
                {address.company && <p className="text-sm text-gray-600">{address.company}</p>}
                <p className="text-sm">{address.address1}</p>
                {address.address2 && <p className="text-sm">{address.address2}</p>}
                <p className="text-sm">{address.city}, {address.territoryCode} {address.zip}</p>
                {address.phoneNumber && <p className="text-sm">{address.phoneNumber}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
