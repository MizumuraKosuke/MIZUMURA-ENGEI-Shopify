import { cookies } from 'next/headers'

const CUSTOMER_DETAILS_QUERY = `#graphql
  query CustomerDetails {
    customer {
      id
      firstName
      lastName
      emailAddress {
        emailAddress
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
        territoryCode
        zip
        phoneNumber
      }
      addresses(first: 6) {
        nodes {
          id
          formatted
          firstName
          lastName
          company
          address1
          address2
          city
          territoryCode
          zip
          phoneNumber
        }
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
      console.log('Exchanging token at:', tokenUrl)
      
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

      console.log('Token exchange response status:', tokenResponse.status)
      
      const responseText = await tokenResponse.text()
      console.log('Token exchange response text:', responseText)
      
      const tokens = JSON.parse(responseText)
      console.log('Parsed tokens:', tokens)
      
      if (tokens.access_token) {
        console.log('Access token received:', tokens.access_token)
        console.log('Token starts with shcat_?', tokens.access_token.startsWith('shcat_'))
        
        // Store access token in secure cookie
        cookieStore.set('customer_access_token', tokens.access_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: tokens.expires_in || 3600
        })
      } else {
        console.error('No access_token in response:', tokens)
      }
    } catch (error) {
      console.error('Token exchange failed:', error)
    }
    
    return { success: true }
  }

  // Get current customer details from Customer Account API
  async getCustomer() {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('customer_access_token')?.value
    
    console.log('Getting customer with token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'null')
    console.log('Token starts with shcat_?', accessToken?.startsWith('shcat_'))
    
    if (!accessToken) {
      console.log('No access token found in cookies')
      return null
    }

    try {
      // Customer Account API GraphQLエンドポイント (OAuth URLと同じ形式)
      // 最新APIバージョンを使用: 2025-07
      const graphqlUrl = `https://shopify.com/${this.shopId}/account/customer/api/2025-07/graphql`
      console.log('Fetching customer from:', graphqlUrl)
      console.log('Authorization header:', `${accessToken}`)
      
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${accessToken}`,
        },
        body: JSON.stringify({
          query: CUSTOMER_DETAILS_QUERY
        })
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
      
      const responseText = await response.text()
      console.log('Response text:', responseText.substring(0, 200))
      
      if (!response.ok) {
        console.error('API response not ok:', response.status, responseText)
        return null
      }
      
      const result = JSON.parse(responseText)
      
      if (result.errors) {
        console.error('GraphQL errors:', result.errors)
        return null
      }
      
      if (!result.data?.customer) {
        console.error('No customer data in response')
        return null
      }

      return result.data.customer
    } catch (error) {
      console.error('Failed to fetch customer:', error)
      return null
    }
  }

  // Logout - Customer Account API pattern
  logout(redirectUri: string) {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri
    })
    const logoutUrl = `https://shopify.com/${this.shopId}/auth/logout`
    return `${logoutUrl}?${params.toString()}`
  }

  // Clear local session
  async clearSession() {
    const cookieStore = await cookies()
    cookieStore.delete('customer_access_token')
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
}
