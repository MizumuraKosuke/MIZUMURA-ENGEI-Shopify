import { cookies } from 'next/headers'

// GraphQL Queries
const CUSTOMER_DETAILS_QUERY = `#graphql
  query CustomerDetails {
    customer {
      id
      firstName
      lastName
      displayName
      emailAddress {
        emailAddress
      }
      phoneNumber {
        phoneNumber
      }
      defaultAddress {
        id
        formatted
        firstName
        lastName
        company
        address1
        address2
        city
        province
        country
        zip
        phoneNumber
      }
      addresses(first: 10) {
        edges {
          node {
            id
            formatted
            firstName
            lastName
            company
            address1
            address2
            city
            province
            country
            zip
            phoneNumber
          }
        }
      }
    }
  }
`

// GraphQL Mutations
const CUSTOMER_UPDATE_MUTATION = `#graphql
  mutation customerUpdate($customer: CustomerUpdateInput!) {
    customerUpdate(customer: $customer) {
      customer {
        id
        firstName
        lastName
        emailAddress {
          emailAddress
        }
        phoneNumber {
          phoneNumber
        }
      }
      customerUserErrors {
        field
        message
      }
    }
  }
`

const CUSTOMER_ADDRESS_CREATE_MUTATION = `#graphql
  mutation customerAddressCreate($address: CustomerAddressInput!) {
    customerAddressCreate(address: $address) {
      customerAddress {
        id
        formatted
        firstName
        lastName
        company
        address1
        address2
        city
        province
        country
        zip
        phoneNumber
      }
      customerUserErrors {
        field
        message
      }
    }
  }
`

const CUSTOMER_ADDRESS_DELETE_MUTATION = `#graphql
  mutation customerAddressDelete($id: ID!) {
    customerAddressDelete(id: $id) {
      deletedCustomerAddressId
      customerUserErrors {
        field
        message
      }
    }
  }
`

const CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION = `#graphql
  mutation customerDefaultAddressUpdate($addressId: ID!) {
    customerDefaultAddressUpdate(addressId: $addressId) {
      customer {
        id
        defaultAddress {
          id
        }
      }
      customerUserErrors {
        field
        message
      }
    }
  }
`

export class CustomerAccount {
  private clientId: string
  private apiUrl: string
  private shopId: string

  constructor() {
    this.clientId = process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID!
    this.apiUrl = process.env.SHOPIFY_CUSTOMER_ACCOUNT_API_URL!
    this.shopId = process.env.SHOPIFY_SHOP_ID!
  }

  // Generate login URL (simplified)
  async login(redirectUri: string) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: 'openid email customer-account-api:full'
    })

    // Correct Customer Account API OAuth URL
    const oauthUrl = `https://shopify.com/authentication/${this.shopId}/oauth/authorize`
    return `${oauthUrl}?${params.toString()}`
  }

  // Handle authorization callback
  async authorize(code: string, redirectUri: string) {
    const cookieStore = await cookies()
    
    try {
      // Exchange code for access token
      const tokenUrl = `https://shopify.com/authentication/${this.shopId}/oauth/token`
      
      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.clientId,
          code,
          redirect_uri: redirectUri
        })
      })

      const responseText = await tokenResponse.text()
      
      const tokens = JSON.parse(responseText)
      
      if (tokens.access_token) {
        
        // Store access token in secure cookie
        cookieStore.set('customer_access_token', tokens.access_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: tokens.expires_in || 3600
        })
        
        // Store id_token if present (needed for logout)
        if (tokens.id_token) {
          cookieStore.set('customer_id_token', tokens.id_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: tokens.expires_in || 3600
          })
        }
      } else {
        throw new Error('No access_token in response')
      }
    } catch (error) {
      throw error
    }
    
    return { success: true }
  }

  // Get current customer details from Customer Account API
  async getCustomer() {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('customer_access_token')?.value
    
    if (!accessToken) {
      return null
    }

    try {
      // Customer Account API GraphQLエンドポイント (OAuth URLと同じ形式)
      // 最新APIバージョンを使用: 2025-07
      const graphqlUrl = `https://shopify.com/${this.shopId}/account/customer/api/2025-07/graphql`
      
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken,
        },
        body: JSON.stringify({
          query: CUSTOMER_DETAILS_QUERY
        })
      })

      const responseText = await response.text()
      
      if (!response.ok) {
        return null
      }
      
      const result = JSON.parse(responseText)
      
      if (result.errors) {
        return null
      }
      
      if (!result.data?.customer) {
        return null
      }

      return result.data.customer
    } catch (error) {
      console.warn('Error fetching customer details:', error)
      return null
    }
  }

  // Logout - Customer Account API pattern
  async logout(redirectUri: string) {
    const cookieStore = await cookies()
    const idToken = cookieStore.get('customer_id_token')?.value
    
    if (!idToken) {
      // Still attempt logout without id_token_hint
    }
    
    const params = new URLSearchParams({
      post_logout_redirect_uri: redirectUri
    })
    
    if (idToken) {
      params.set('id_token_hint', idToken)
    }
    
    const logoutUrl = `https://shopify.com/authentication/${this.shopId}/logout`
    return `${logoutUrl}?${params.toString()}`
  }

  // Clear local session
  async clearSession() {
    const cookieStore = await cookies()
    cookieStore.delete('customer_access_token')
    cookieStore.delete('customer_id_token')
  }

  // Get customer access token for buyer identity (if needed)
  async getAccessToken() {
    const cookieStore = await cookies()
    return cookieStore.get('customer_access_token')?.value
  }

  // Check if customer is logged in
  async isLoggedIn(): Promise<boolean> {
    try {
      const customer = await this.getCustomer()
      return customer !== null
    } catch {
      return false
    }
  }

  // Update customer profile
  async updateProfile(profileData: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }) {
    const accessToken = await this.getAccessToken()
    if (!accessToken) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch(`${this.apiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken
        },
        body: JSON.stringify({
          query: CUSTOMER_UPDATE_MUTATION,
          variables: {
            customer: {
              firstName: profileData.firstName,
              lastName: profileData.lastName,
              emailAddress: profileData.email,
              phoneNumber: profileData.phone || null
            }
          }
        })
      })

      const result = await response.json()
      
      if (result.errors) {
        throw new Error(result.errors[0].message)
      }

      if (result.data.customerUpdate.customerUserErrors.length > 0) {
        const errorMessage = result.data.customerUpdate.customerUserErrors
          .map((error: { message: string }) => error.message)
          .join(', ')
        throw new Error(errorMessage)
      }

      return result.data.customerUpdate.customer
    } catch (error) {
      throw error
    }
  }

  // Create new address
  async createAddress(addressData: {
    firstName: string
    lastName: string
    company?: string
    address1: string
    address2?: string
    city: string
    province: string
    zip: string
    country: string
    phone?: string
  }) {
    const accessToken = await this.getAccessToken()
    if (!accessToken) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch(`${this.apiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken
        },
        body: JSON.stringify({
          query: CUSTOMER_ADDRESS_CREATE_MUTATION,
          variables: {
            address: {
              firstName: addressData.firstName,
              lastName: addressData.lastName,
              company: addressData.company || '',
              address1: addressData.address1,
              address2: addressData.address2 || '',
              city: addressData.city,
              province: addressData.province,
              zip: addressData.zip,
              country: addressData.country,
              phoneNumber: addressData.phone || ''
            }
          }
        })
      })

      const result = await response.json()
      
      if (result.errors) {
        throw new Error(result.errors[0].message)
      }

      if (result.data.customerAddressCreate.customerUserErrors.length > 0) {
        const errorMessage = result.data.customerAddressCreate.customerUserErrors
          .map((error: { message: string }) => error.message)
          .join(', ')
        throw new Error(errorMessage)
      }

      return result.data.customerAddressCreate.customerAddress
    } catch (error) {
      throw error
    }
  }

  // Delete address
  async deleteAddress(addressId: string) {
    const accessToken = await this.getAccessToken()
    if (!accessToken) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch(`${this.apiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken
        },
        body: JSON.stringify({
          query: CUSTOMER_ADDRESS_DELETE_MUTATION,
          variables: { id: addressId }
        })
      })

      const result = await response.json()
      
      if (result.errors) {
        throw new Error(result.errors[0].message)
      }

      if (result.data.customerAddressDelete.customerUserErrors.length > 0) {
        const errorMessage = result.data.customerAddressDelete.customerUserErrors
          .map((error: { message: string }) => error.message)
          .join(', ')
        throw new Error(errorMessage)
      }

      return result.data.customerAddressDelete.deletedCustomerAddressId
    } catch (error) {
      throw error
    }
  }

  // Set default address
  async setDefaultAddress(addressId: string) {
    const accessToken = await this.getAccessToken()
    if (!accessToken) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch(`${this.apiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken
        },
        body: JSON.stringify({
          query: CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION,
          variables: { addressId }
        })
      })

      const result = await response.json()
      
      if (result.errors) {
        throw new Error(result.errors[0].message)
      }

      if (result.data.customerDefaultAddressUpdate.customerUserErrors.length > 0) {
        const errorMessage = result.data.customerDefaultAddressUpdate.customerUserErrors
          .map((error: { message: string }) => error.message)
          .join(', ')
        throw new Error(errorMessage)
      }

      return result.data.customerDefaultAddressUpdate.customer
    } catch (error) {
      throw error
    }
  }
}
