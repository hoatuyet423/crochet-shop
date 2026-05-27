export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered'

export interface Product {
  id: string
  slug: string
  name: string
  description: string | null
  price_cents: number
  images: string[]
  category: string | null
  stock_qty: number
  is_active: boolean
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  user_id: string | null
  guest_email: string | null
  shipping_name: string
  shipping_email: string
  shipping_line1: string
  shipping_line2: string | null
  shipping_city: string
  shipping_state: string
  shipping_postal: string
  shipping_country: string
  subtotal_cents: number
  shipping_cents: number
  total_cents: number
  stripe_session_id: string | null
  stripe_payment_intent: string | null
  status: OrderStatus
  tracking_number: string | null
  carrier: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_image: string | null
  unit_price_cents: number
  quantity: number
  created_at: string
}

export interface ShippingUpdate {
  id: string
  order_id: string
  status: OrderStatus
  message: string | null
  tracking_number: string | null
  updated_by: string | null
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface ShippingAddress {
  name: string
  email: string
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string
}
