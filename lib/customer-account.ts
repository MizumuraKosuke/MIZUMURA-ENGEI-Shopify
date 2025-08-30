import { parseCookies, setCookie, destroyCookie } from 'nookies'

// Types for Customer Account API responses
interface CustomerOrderEdge {
  node: {
    id: string
    orderNumber: string
    processedAt: string
    fulfillmentStatus: string
    financialStatus: string
    totalPrice: { amount: string; currencyCode: string }
    subtotalPrice: { amount: string; currencyCode: string }
    totalShippingPrice: { amount: string; currencyCode: string }
    totalTax: { amount: string; currencyCode: string }
    shippingAddress: {
      firstName: string
      lastName: string
      address1: string
      address2?: string
      city: string
      province: string
      zip: string
      country: string
      phone?: string
    }
    billingAddress: {
      firstName: string
      lastName: string
      address1: string
      address2?: string
      city: string
      province: string
      zip: string
      country: string
    }
    lineItems: {
      edges: Array<{
        node: {
          id: string
          title: string
          quantity: number
          originalUnitPrice: { amount: string; currencyCode: string }
          totalDiscount: { amount: string; currencyCode: string }
          variant: {
            id: string
            title: string
            sku: string
            image: {
              url: string
              altText: string
            }
          }
        }
      }>
    }
    fulfillments: {
      edges: Array<{
        node: {
          id: string
          status: string
          trackingCompany?: string
          trackingNumbers?: string[]
          trackingUrls?: string[]
          updatedAt: string
          deliveredAt?: string
        }
      }>
    }
  }
}

interface CustomerOrdersResponse {
  data: {
    customer: {
      orders: {
        edges: CustomerOrderEdge[]
      }
    }
  }
  errors?: Array<{ message: string }>
}

interface CustomerOrderResponse {
  data: {
    customer: {
      order: CustomerOrderEdge['node']
    }
  }
  errors?: Array<{ message: string }>
}

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

const CUSTOMER_ORDERS_QUERY = `#graphql
  query CustomerOrders($first: Int!) {
    customer {
      id
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true) {
        edges {
          node {
            id
            orderNumber
            processedAt
            fulfillmentStatus
            financialStatus
            totalPrice {
              amount
              currencyCode
            }
            subtotalPrice {
              amount
              currencyCode
            }
            totalShippingPrice {
              amount
              currencyCode
            }
            totalTax {
              amount
              currencyCode
            }
            shippingAddress {
              firstName
              lastName
              address1
              address2
              city
              province
              zip
              country
              phone
            }
            billingAddress {
              firstName
              lastName
              address1
              address2
              city
              province
              zip
              country
            }
            lineItems(first: 100) {
              edges {
                node {
                  id
                  title
                  quantity
                  originalUnitPrice {
                    amount
                    currencyCode
                  }
                  totalDiscount {
                    amount
                    currencyCode
                  }
                  variant {
                    id
                    title
                    sku
                    image {
                      url
                      altText
                    }
                  }
                }
              }
            }
            fulfillments(first: 10) {
              edges {
                node {
                  id
                  status
                  trackingCompany
                  trackingNumbers
                  trackingUrls
                  updatedAt
                  deliveredAt
                }
              }
            }
          }
        }
      }
    }
  }
`

const CUSTOMER_ORDER_QUERY = `#graphql
  query CustomerOrder($id: ID!) {
    customer {
      id
      order(id: $id) {
        id
        orderNumber
        processedAt
        fulfillmentStatus
        financialStatus
        totalPrice {
          amount
          currencyCode
        }
        subtotalPrice {
          amount
          currencyCode
        }
        totalShippingPrice {
          amount
          currencyCode
        }
        totalTax {
          amount
          currencyCode
        }
        shippingAddress {
          firstName
          lastName
          address1
          address2
          city
          province
          zip
          country
          phone
        }
        billingAddress {
          firstName
          lastName
          address1
          address2
          city
          province
          zip
          country
        }
        lineItems(first: 100) {
          edges {
            node {
              id
              title
              quantity
              originalUnitPrice {
                amount
                currencyCode
              }
              totalDiscount {
                amount
                currencyCode
              }
              variant {
                id
                title
                sku
                image {
                  url
                  altText
                }
              }
            }
          }
        }
        fulfillments(first: 10) {
          edges {
            node {
              id
              status
              trackingCompany
              trackingNumbers
              trackingUrls
              updatedAt
              deliveredAt
            }
          }
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
        setCookie(null, 'customer_access_token', tokens.access_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: tokens.expires_in || 3600,
          path: '/'
        })
        
        // Store id_token if present (needed for logout)
        if (tokens.id_token) {
          setCookie(null, 'customer_id_token', tokens.id_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: tokens.expires_in || 3600,
            path: '/'
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
    const cookies = parseCookies()
    const accessToken = cookies.customer_access_token
    
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
    const cookies = parseCookies()
    const idToken = cookies.customer_id_token
    
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
    destroyCookie(null, 'customer_access_token', { path: '/' })
    destroyCookie(null, 'customer_id_token', { path: '/' })
  }

  // Get customer access token for buyer identity (if needed)
  async getAccessToken() {
    const cookies = parseCookies()
    return cookies.customer_access_token
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

  // Get customer orders
  async getOrders(first: number = 20) {
    const cookies = parseCookies()
    const accessToken = cookies.customer_access_token
    
    if (!accessToken) {
      return null
    }

    try {
      const graphqlUrl = `https://shopify.com/${this.shopId}/account/customer/api/2025-07/graphql`
      
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken,
        },
        body: JSON.stringify({
          query: CUSTOMER_ORDERS_QUERY,
          variables: { first }
        })
      })

      const result: CustomerOrdersResponse = await response.json()
      
      if (!response.ok || result.errors || !result.data?.customer?.orders) {
        return null
      }

      // Transform edges to nodes
      return result.data.customer.orders.edges.map((edge) => ({
        ...edge.node,
        lineItems: edge.node.lineItems.edges.map((lineEdge) => lineEdge.node),
        fulfillments: edge.node.fulfillments.edges.map((fulfillmentEdge) => ({
          ...fulfillmentEdge.node,
          trackingNumber: fulfillmentEdge.node.trackingNumbers?.[0] || null,
          trackingUrl: fulfillmentEdge.node.trackingUrls?.[0] || null
        }))
      }))
    } catch (error) {
      console.warn('Error fetching customer orders:', error)
      return null
    }
  }

  // Get specific order by ID
  async getOrder(orderId: string) {
    const cookies = parseCookies()
    const accessToken = cookies.customer_access_token
    
    if (!accessToken) {
      return null
    }

    try {
      const graphqlUrl = `https://shopify.com/${this.shopId}/account/customer/api/2025-07/graphql`
      
      const response = await fetch(graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken,
        },
        body: JSON.stringify({
          query: CUSTOMER_ORDER_QUERY,
          variables: { id: orderId }
        })
      })

      const result: CustomerOrderResponse = await response.json()
      
      if (!response.ok || result.errors || !result.data?.customer?.order) {
        return null
      }

      const order = result.data.customer.order
      
      // Transform edges to nodes
      return {
        ...order,
        lineItems: order.lineItems.edges.map((edge) => edge.node),
        fulfillments: order.fulfillments.edges.map((edge) => ({
          ...edge.node,
          trackingNumber: edge.node.trackingNumbers?.[0] || null,
          trackingUrl: edge.node.trackingUrls?.[0] || null
        }))
      }
    } catch (error) {
      console.warn('Error fetching customer order:', error)
      return null
    }
  }
}
