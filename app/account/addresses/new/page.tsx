import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CustomerAccount } from '../../../../lib/customer-account'

export default async function NewAddressPage() {
  const customerAccount = new CustomerAccount()
  const customer = await customerAccount.getCustomer()
  
  if (!customer) {
    redirect('/login')
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <div className="flex items-center space-x-2 text-sm">
          <Link href="/account" className="text-gray-500 hover:text-gray-700">
            Account
          </Link>
          <span className="text-gray-400">/</span>
          <Link href="/account/addresses" className="text-gray-500 hover:text-gray-700">
            Addresses
          </Link>
          <span className="text-gray-400">/</span>
          <span className="font-medium text-gray-900">新しい住所を追加</span>
        </div>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          新しい住所を追加
        </h1>
        <p className="mt-2 text-gray-600">
          配送や請求に使用する住所を追加してください。
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form 
          className="px-6 py-8 space-y-6" 
          onSubmit={async (e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            
            try {
              const { CustomerAccount } = await import('../../../../lib/customer-account')
              const customerAccount = new CustomerAccount()
              
              const addressData = {
                firstName: formData.get('firstName') as string,
                lastName: formData.get('lastName') as string,
                company: formData.get('company') as string,
                address1: formData.get('address1') as string,
                address2: formData.get('address2') as string,
                city: formData.get('city') as string,
                province: formData.get('province') as string,
                zip: formData.get('zip') as string,
                country: formData.get('country') as string,
                phone: formData.get('phone') as string,
              }
              
              const newAddress = await customerAccount.createAddress(addressData)
              
              if (formData.get('setAsDefault') === 'on' && newAddress.id) {
                await customerAccount.setDefaultAddress(newAddress.id)
              }
              
              window.location.href = '/account/addresses'
            } catch (error) {
              alert(error instanceof Error ? error.message : 'エラーが発生しました')
            }
          }}
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                id="firstName"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                苗字 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                id="lastName"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700">
              会社名（任意）
            </label>
            <input
              type="text"
              name="company"
              id="company"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="address1" className="block text-sm font-medium text-gray-700">
              住所1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address1"
              id="address1"
              required
              placeholder="都道府県市区町村番地"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="address2" className="block text-sm font-medium text-gray-700">
              住所2（任意）
            </label>
            <input
              type="text"
              name="address2"
              id="address2"
              placeholder="建物名・部屋番号等"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                市区町村 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                id="city"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="province" className="block text-sm font-medium text-gray-700">
                都道府県 <span className="text-red-500">*</span>
              </label>
              <select
                name="province"
                id="province"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">選択してください</option>
                <option value="北海道">北海道</option>
                <option value="青森県">青森県</option>
                <option value="岩手県">岩手県</option>
                <option value="宮城県">宮城県</option>
                <option value="秋田県">秋田県</option>
                <option value="山形県">山形県</option>
                <option value="福島県">福島県</option>
                <option value="茨城県">茨城県</option>
                <option value="栃木県">栃木県</option>
                <option value="群馬県">群馬県</option>
                <option value="埼玉県">埼玉県</option>
                <option value="千葉県">千葉県</option>
                <option value="東京都">東京都</option>
                <option value="神奈川県">神奈川県</option>
                <option value="新潟県">新潟県</option>
                <option value="富山県">富山県</option>
                <option value="石川県">石川県</option>
                <option value="福井県">福井県</option>
                <option value="山梨県">山梨県</option>
                <option value="長野県">長野県</option>
                <option value="岐阜県">岐阜県</option>
                <option value="静岡県">静岡県</option>
                <option value="愛知県">愛知県</option>
                <option value="三重県">三重県</option>
                <option value="滋賀県">滋賀県</option>
                <option value="京都府">京都府</option>
                <option value="大阪府">大阪府</option>
                <option value="兵庫県">兵庫県</option>
                <option value="奈良県">奈良県</option>
                <option value="和歌山県">和歌山県</option>
                <option value="鳥取県">鳥取県</option>
                <option value="島根県">島根県</option>
                <option value="岡山県">岡山県</option>
                <option value="広島県">広島県</option>
                <option value="山口県">山口県</option>
                <option value="徳島県">徳島県</option>
                <option value="香川県">香川県</option>
                <option value="愛媛県">愛媛県</option>
                <option value="高知県">高知県</option>
                <option value="福岡県">福岡県</option>
                <option value="佐賀県">佐賀県</option>
                <option value="長崎県">長崎県</option>
                <option value="熊本県">熊本県</option>
                <option value="大分県">大分県</option>
                <option value="宮崎県">宮崎県</option>
                <option value="鹿児島県">鹿児島県</option>
                <option value="沖縄県">沖縄県</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
                郵便番号 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="zip"
                id="zip"
                required
                placeholder="123-4567"
                pattern="\d{3}-\d{4}"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
              国 <span className="text-red-500">*</span>
            </label>
            <select
              name="country"
              id="country"
              required
              defaultValue="Japan"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="Japan">日本</option>
            </select>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              電話番号（任意）
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              placeholder="03-1234-5678"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center">
            <input
              id="setAsDefault"
              name="setAsDefault"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="setAsDefault" className="ml-2 block text-sm text-gray-900">
              この住所をデフォルト住所に設定する
            </label>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <Link
              href="/account/addresses"
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              住所を追加
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}