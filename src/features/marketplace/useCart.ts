import { useState, useEffect } from 'react'
import type { CartItem } from '../../components/CartDrawer'

const CART_STORAGE_KEY = 'marketspace_cart'

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
    } catch {
      // Storage error fallback
    }
  }, [cartItems])

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setCartItems((prev) => {
      const existing = prev.find((it) => it.id === item.id)
      if (existing) {
        return prev.map((it) =>
          it.id === item.id ? { ...it, quantity: it.quantity + (item.quantity || 1) } : it
        )
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }]
    })
    setIsCartOpen(true)
  }

  const updateQuantity = (id: number | string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id)
      return
    }
    setCartItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, quantity: qty } : it))
    )
  }

  const removeFromCart = (id: number | string) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id))
  }

  const clearCart = () => {
    setCartItems([])
  }

  const totalCount = cartItems.reduce((acc, it) => acc + it.quantity, 0)

  return {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalCount,
  }
}
