// AUTO-GENERATED — do not edit manually
// Run: node scripts/gen-types.mjs

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      addresses: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string
          line1: string
          line2: string | null
          city: string
          state: string
          pincode: string
          type: string | null
          is_default: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          user_id: string
          name: string
          phone: string
          line1: string
          line2?: string | null | undefined
          city: string
          state: string
          pincode: string
          type?: string | null | undefined
          is_default?: boolean | null | undefined
          created_at?: string | null | undefined
          updated_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>
        Relationships: []
      }
      banners: {
        Row: {
          id: string
          image_url_desktop: string
          image_url_mobile: string
          target_url: string | null
          position: string | null
          active: boolean | null
          start_date: string | null
          end_date: string | null
          sort_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          image_url_desktop: string
          image_url_mobile: string
          target_url?: string | null | undefined
          position?: string | null | undefined
          active?: boolean | null | undefined
          start_date?: string | null | undefined
          end_date?: string | null | undefined
          sort_order?: number | null | undefined
          created_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["banners"]["Insert"]>
        Relationships: []
      }
      brands: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          description: string | null
          active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          name: string
          slug: string
          logo_url?: string | null | undefined
          description?: string | null | undefined
          active?: boolean | null | undefined
          created_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["brands"]["Insert"]>
        Relationships: []
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          variant_id: string
          quantity: number
          added_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          user_id: string
          product_id: string
          variant_id: string
          quantity?: number | null | undefined
          added_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Insert"]>
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          parent_id: string | null
          icon_url: string | null
          display_order: number | null
          active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          name: string
          slug: string
          parent_id?: string | null | undefined
          icon_url?: string | null | undefined
          display_order?: number | null | undefined
          active?: boolean | null | undefined
          created_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>
        Relationships: []
      }
      coupon_usages: {
        Row: {
          id: string
          coupon_id: string
          user_id: string
          order_id: string
          discount_applied: number
          used_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          coupon_id: string
          user_id: string
          order_id: string
          discount_applied: number
          used_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["coupon_usages"]["Insert"]>
        Relationships: []
      }
      coupons: {
        Row: {
          id: string
          code: string
          type: string
          value: number
          max_discount: number | null
          min_order_amount: number | null
          applicable_category_id: string | null
          applicable_brand_id: string | null
          max_uses: number | null
          used_count: number | null
          active: boolean | null
          valid_from: string
          valid_until: string
          created_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          code: string
          type: string
          value: number
          max_discount?: number | null | undefined
          min_order_amount?: number | null | undefined
          applicable_category_id?: string | null | undefined
          applicable_brand_id?: string | null | undefined
          max_uses?: number | null | undefined
          used_count?: number | null | undefined
          active?: boolean | null | undefined
          valid_from: string
          valid_until: string
          created_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["coupons"]["Insert"]>
        Relationships: []
      }
      deals_of_day: {
        Row: {
          id: string
          product_id: string
          deal_price: number
          start_at: string
          end_at: string
        }
        Insert: {
          id?: string | null | undefined
          product_id: string
          deal_price: number
          start_at: string
          end_at: string
        }
        Update: Partial<Database["public"]["Tables"]["deals_of_day"]["Insert"]>
        Relationships: []
      }
      insider_points_ledger: {
        Row: {
          id: string
          user_id: string
          points: number
          type: string
          reference_id: string | null
          description: string | null
          expires_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          user_id: string
          points: number
          type: string
          reference_id?: string | null | undefined
          description?: string | null | undefined
          expires_at?: string | null | undefined
          created_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["insider_points_ledger"]["Insert"]>
        Relationships: []
      }
      login_attempts: {
        Row: {
          id: string
          ip: string
          identifier: string
          ts: string | null
        }
        Insert: {
          id?: string | null | undefined
          ip: string
          identifier: string
          ts?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["login_attempts"]["Insert"]>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string | null
          data: Record<string, unknown> | null
          read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          user_id: string
          type: string
          title: string
          body?: string | null | undefined
          data?: Record<string, unknown> | null | undefined
          read?: boolean | null | undefined
          created_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          variant_id: string
          seller_id: string
          qty: number
          mrp: number
          selling_price: number
          status: string | null
          tracking_number: string | null
          courier: string | null
          dispatched_at: string | null
          delivered_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          order_id: string
          product_id: string
          variant_id: string
          seller_id: string
          qty?: number | null | undefined
          mrp: number
          selling_price: number
          status?: string | null | undefined
          tracking_number?: string | null | undefined
          courier?: string | null | undefined
          dispatched_at?: string | null | undefined
          delivered_at?: string | null | undefined
          created_at?: string | null | undefined
          updated_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>
        Relationships: []
      }
      order_tracking_events: {
        Row: {
          id: string
          order_item_id: string | null
          status: string
          location: string | null
          description: string | null
          ts: string | null
        }
        Insert: {
          id?: string | null | undefined
          order_item_id?: string | null | undefined
          status: string
          location?: string | null | undefined
          description?: string | null | undefined
          ts?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["order_tracking_events"]["Insert"]>
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          user_id: string
          address_id: string
          status: string | null
          subtotal: number
          total_discount: number | null
          delivery_charge: number | null
          coupon_discount: number | null
          credits_used: number | null
          total: number
          payment_method: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          user_id: string
          address_id: string
          status?: string | null | undefined
          subtotal: number
          total_discount?: number | null | undefined
          delivery_charge?: number | null | undefined
          coupon_discount?: number | null | undefined
          credits_used?: number | null | undefined
          total: number
          payment_method?: string | null | undefined
          payment_status?: string | null | undefined
          razorpay_order_id?: string | null | undefined
          razorpay_payment_id?: string | null | undefined
          cancel_reason?: string | null | undefined
          cancelled_at?: string | null | undefined
          created_at?: string | null | undefined
          updated_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>
        Relationships: []
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          variant_id: string | null
          url: string
          blur_data_url: string | null
          sort_order: number | null
          is_primary: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          product_id: string
          variant_id?: string | null | undefined
          url: string
          blur_data_url?: string | null | undefined
          sort_order?: number | null | undefined
          is_primary?: boolean | null | undefined
          created_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>
        Relationships: []
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          size: string
          color: string
          color_hex: string | null
          sku: string
          stock_qty: number | null
          mrp: number
          selling_price: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          product_id: string
          size: string
          color: string
          color_hex?: string | null | undefined
          sku: string
          stock_qty?: number | null | undefined
          mrp: number
          selling_price: number
          created_at?: string | null | undefined
          updated_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>
        Relationships: []
      }
      products: {
        Row: {
          id: string
          title: string
          slug: string
          brand_id: string | null
          category_id: string | null
          seller_id: string
          description: string | null
          gender: string | null
          rating_avg: number | null
          rating_count: number | null
          status: string | null
          search_vector: string | null
          deleted_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          title: string
          slug: string
          brand_id?: string | null | undefined
          category_id?: string | null | undefined
          seller_id: string
          description?: string | null | undefined
          gender?: string | null | undefined
          rating_avg?: number | null | undefined
          rating_count?: number | null | undefined
          status?: string | null | undefined
          search_vector?: string | null | undefined
          deleted_at?: string | null | undefined
          created_at?: string | null | undefined
          updated_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          phone: string | null
          avatar_url: string | null
          gender: string | null
          dob: string | null
          insider_tier: string | null
          insider_points: number | null
          deleted_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name?: string | null | undefined
          email?: string | null | undefined
          phone?: string | null | undefined
          avatar_url?: string | null | undefined
          gender?: string | null | undefined
          dob?: string | null | undefined
          insider_tier?: string | null | undefined
          insider_points?: number | null | undefined
          deleted_at?: string | null | undefined
          created_at?: string | null | undefined
          updated_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      returns: {
        Row: {
          id: string
          order_item_id: string
          user_id: string
          reason: string
          sub_reason: string | null
          pickup_address_id: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          order_item_id: string
          user_id: string
          reason: string
          sub_reason?: string | null | undefined
          pickup_address_id?: string | null | undefined
          status?: string | null | undefined
          created_at?: string | null | undefined
          updated_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["returns"]["Insert"]>
        Relationships: []
      }
      review_photos: {
        Row: {
          id: string
          review_id: string | null
          url: string
          blur_data_url: string | null
          sort_order: number | null
        }
        Insert: {
          id?: string | null | undefined
          review_id?: string | null | undefined
          url: string
          blur_data_url?: string | null | undefined
          sort_order?: number | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["review_photos"]["Insert"]>
        Relationships: []
      }
      review_votes: {
        Row: {
          review_id: string
          user_id: string
          helpful: boolean
        }
        Insert: {
          review_id: string
          user_id: string
          helpful: boolean
        }
        Update: Partial<Database["public"]["Tables"]["review_votes"]["Insert"]>
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          order_item_id: string | null
          rating: number
          title: string | null
          body: string | null
          helpful_yes: number | null
          helpful_no: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          product_id: string
          user_id: string
          order_item_id?: string | null | undefined
          rating: number
          title?: string | null | undefined
          body?: string | null | undefined
          helpful_yes?: number | null | undefined
          helpful_no?: number | null | undefined
          created_at?: string | null | undefined
          updated_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>
        Relationships: []
      }
      sellers: {
        Row: {
          id: string
          user_id: string | null
          store_name: string
          gstin: string | null
          pan: string | null
          status: string | null
          rating_avg: number | null
          rating_count: number | null
          commission_rate: number | null
          bank_account_verified: boolean | null
          deleted_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          user_id?: string | null | undefined
          store_name: string
          gstin?: string | null | undefined
          pan?: string | null | undefined
          status?: string | null | undefined
          rating_avg?: number | null | undefined
          rating_count?: number | null | undefined
          commission_rate?: number | null | undefined
          bank_account_verified?: boolean | null | undefined
          deleted_at?: string | null | undefined
          created_at?: string | null | undefined
          updated_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["sellers"]["Insert"]>
        Relationships: []
      }
      settlements: {
        Row: {
          id: string
          seller_id: string
          period_start: string
          period_end: string
          gross_amount: number
          commission: number
          tds: number | null
          net_amount: number
          status: string | null
          razorpay_payout_id: string | null
          paid_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          seller_id: string
          period_start: string
          period_end: string
          gross_amount: number
          commission: number
          tds?: number | null | undefined
          net_amount: number
          status?: string | null | undefined
          razorpay_payout_id?: string | null | undefined
          paid_at?: string | null | undefined
          created_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["settlements"]["Insert"]>
        Relationships: []
      }
      size_guides: {
        Row: {
          id: string
          category_id: string | null
          guide_data: Record<string, unknown>
          created_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          category_id?: string | null | undefined
          guide_data: Record<string, unknown>
          created_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["size_guides"]["Insert"]>
        Relationships: []
      }
      user_flags: {
        Row: {
          id: string
          user_id: string | null
          flag_type: string
          reason: string | null
          created_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          user_id?: string | null | undefined
          flag_type: string
          reason?: string | null | undefined
          created_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["user_flags"]["Insert"]>
        Relationships: []
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          variant_id: string | null
          added_at: string | null
        }
        Insert: {
          id?: string | null | undefined
          user_id: string
          product_id: string
          variant_id?: string | null | undefined
          added_at?: string | null | undefined
        }
        Update: Partial<Database["public"]["Tables"]["wishlists"]["Insert"]>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      get_products_filtered: {
        Args: {
          p_category_slug?: string | null
          p_search?: string | null
          p_brand_ids?: string[] | null
          p_min_price?: number | null
          p_max_price?: number | null
          p_min_discount?: number | null
          p_sizes?: string[] | null
          p_colors?: string[] | null
          p_min_rating?: number | null
          p_gender?: string | null
          p_sort?: string
          p_page?: number
          p_limit?: number
        }
        Returns: Array<{
          id: string
          title: string
          slug: string
          brand_name: string
          selling_price: number
          mrp: number
          discount_pct: number
          rating_avg: number
          rating_count: number
          primary_image_url: string | null
          blur_data_url: string | null
          in_stock: boolean
          total_count: number
        }>
      }
      create_order: {
        Args: {
          p_user_id: string
          p_address_id: string
          p_variant_ids: string[]
          p_quantities: number[]
          p_coupon_code?: string | null
          p_razorpay_order_id?: string | null
          p_razorpay_payment_id?: string | null
        }
        Returns: Array<{ order_id: string | null; total: number; error_code: string | null }>
      }
      apply_coupon: {
        Args: { p_code: string; p_user_id: string; p_order_total: number }
        Returns: Array<{ discount: number; error_code: string | null }>
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}

// Convenience row types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Address = Database["public"]["Tables"]["addresses"]["Row"]
export type Category = Database["public"]["Tables"]["categories"]["Row"]
export type Brand = Database["public"]["Tables"]["brands"]["Row"]
export type Seller = Database["public"]["Tables"]["sellers"]["Row"]
export type Product = Database["public"]["Tables"]["products"]["Row"]
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"]
export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"]
export type CartItem = Database["public"]["Tables"]["cart_items"]["Row"]
export type WishlistItem = Database["public"]["Tables"]["wishlists"]["Row"]
export type Order = Database["public"]["Tables"]["orders"]["Row"]
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"]
export type Review = Database["public"]["Tables"]["reviews"]["Row"]
export type Notification = Database["public"]["Tables"]["notifications"]["Row"]
export type Coupon = Database["public"]["Tables"]["coupons"]["Row"]
export type Banner = Database["public"]["Tables"]["banners"]["Row"]
export type Settlement = Database["public"]["Tables"]["settlements"]["Row"]
