// Client-side Customer API wrapper for safe access from React components
export class CustomerClient {
  
  // Get customer profile
  static async getProfile() {
    try {
      const response = await fetch('/api/customer/profile')
      
      if (!response.ok) {
        if (response.status === 401) {
          return null // Not authenticated
        }
        throw new Error('Failed to fetch profile')
      }
      
      const data = await response.json()
      return data.customer
    } catch (error) {
      console.warn('Error fetching customer profile:', error)
      return null
    }
  }
  
  // Get customer orders
  static async getOrders(first: number = 20) {
    try {
      const response = await fetch(`/api/customer/orders?first=${first}`)
      
      if (!response.ok) {
        if (response.status === 401) {
          return null // Not authenticated
        }
        throw new Error('Failed to fetch orders')
      }
      
      const data = await response.json()
      return data.orders
    } catch (error) {
      console.warn('Error fetching customer orders:', error)
      return null
    }
  }
  
  // Get specific order
  static async getOrder(orderId: string) {
    try {
      const response = await fetch(`/api/customer/orders/${orderId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          return null // Order not found
        }
        throw new Error('Failed to fetch order')
      }
      
      const data = await response.json()
      return data.order
    } catch (error) {
      console.warn('Error fetching customer order:', error)
      return null
    }
  }
  
  // Check if customer is logged in (client-side only)
  static isLoggedIn(): boolean {
    if (typeof window === 'undefined') return false
    return document.cookie.includes('customer_logged_in=true')
  }
}