'use client'

import { useState, useEffect } from 'react'
import { CustomerClient } from '../lib/customer-client'

// Hook for customer profile
export function useCustomerProfile() {
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const profile = await CustomerClient.getProfile()
      setCustomer(profile)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (CustomerClient.isLoggedIn()) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [])

  return { customer, loading, error, refetch: fetchProfile }
}

// Hook for customer orders
export function useCustomerOrders(first: number = 20) {
  const [orders, setOrders] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const orderList = await CustomerClient.getOrders(first)
      setOrders(orderList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (CustomerClient.isLoggedIn()) {
      fetchOrders()
    } else {
      setLoading(false)
    }
  }, [first])

  return { orders, loading, error, refetch: fetchOrders }
}

// Hook for specific order
export function useCustomerOrder(orderId: string) {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrder = async () => {
    if (!orderId) return
    
    try {
      setLoading(true)
      setError(null)
      const orderData = await CustomerClient.getOrder(orderId)
      setOrder(orderData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch order')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (CustomerClient.isLoggedIn()) {
      fetchOrder()
    } else {
      setLoading(false)
    }
  }, [orderId])

  return { order, loading, error, refetch: fetchOrder }
}