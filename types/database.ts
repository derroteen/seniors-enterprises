type Table<Row, Insert, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type InsertShape<Row, Required extends keyof Row> =
  Pick<Row, Required> & Partial<Omit<Row, Required>>;

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      categories: Table<
        {
          id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          image_url: string | null;
          created_at: string;
        },
        InsertShape<
          {
            id: string;
            name: string;
            slug: string;
            parent_id: string | null;
            image_url: string | null;
            created_at: string;
          },
          "name" | "slug"
        >
      >;
      products: Table<
        {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          category_id: string;
          base_price_kes: number;
          compare_at_price_kes: number | null;
          is_active: boolean;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        },
        InsertShape<
          {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            category_id: string;
            base_price_kes: number;
            compare_at_price_kes: number | null;
            is_active: boolean;
            is_featured: boolean;
            created_at: string;
            updated_at: string;
          },
          "name" | "slug" | "category_id" | "base_price_kes"
        >
      >;
      product_variants: Table<
        {
          id: string;
          product_id: string;
          size: string;
          color: string;
          sku: string;
          stock_quantity: number;
          price_override_kes: number | null;
        },
        InsertShape<
          {
            id: string;
            product_id: string;
            size: string;
            color: string;
            sku: string;
            stock_quantity: number;
            price_override_kes: number | null;
          },
          "product_id" | "size" | "color" | "sku"
        >
      >;
      product_images: Table<
        {
          id: string;
          product_id: string;
          url: string;
          alt_text: string | null;
          sort_order: number;
        },
        InsertShape<
          {
            id: string;
            product_id: string;
            url: string;
            alt_text: string | null;
            sort_order: number;
          },
          "product_id" | "url"
        >
      >;
      orders: Table<
        {
          id: string;
          order_number: string;
          user_id: string | null;
          customer_name: string;
          email: string;
          phone: string;
          delivery_address: Json;
          subtotal_kes: number;
          delivery_fee_kes: number;
          total_kes: number;
          status: Database["public"]["Enums"]["order_status"];
          payment_status: Database["public"]["Enums"]["payment_status"];
          paystack_reference: string | null;
          created_at: string;
        },
        InsertShape<
          {
            id: string;
            order_number: string;
            user_id: string | null;
            customer_name: string;
            email: string;
            phone: string;
            delivery_address: Json;
            subtotal_kes: number;
            delivery_fee_kes: number;
            total_kes: number;
            status: Database["public"]["Enums"]["order_status"];
            payment_status: Database["public"]["Enums"]["payment_status"];
            paystack_reference: string | null;
            created_at: string;
          },
          "customer_name" | "email" | "phone" | "delivery_address" | "subtotal_kes" | "total_kes"
        >
      >;
      order_items: Table<
        {
          id: string;
          order_id: string;
          product_id: string;
          variant_id: string | null;
          product_name_snapshot: string;
          unit_price_kes: number;
          quantity: number;
        },
        InsertShape<
          {
            id: string;
            order_id: string;
            product_id: string;
            variant_id: string | null;
            product_name_snapshot: string;
            unit_price_kes: number;
            quantity: number;
          },
          "order_id" | "product_id" | "product_name_snapshot" | "unit_price_kes" | "quantity"
        >
      >;
      profiles: Table<
        {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["profile_role"];
        },
        InsertShape<
          {
            id: string;
            full_name: string | null;
            phone: string | null;
            role: Database["public"]["Enums"]["profile_role"];
          },
          "id"
        >
      >;
      wishlist_items: Table<
        {
          user_id: string;
          product_id: string;
        },
        { user_id: string; product_id: string }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      decrement_variant_stock: {
        Args: { p_variant_id: string; p_quantity: number };
        Returns: undefined;
      };
    };
    Enums: {
      order_status:
        | "pending"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded";
      payment_status: "pending" | "paid" | "failed" | "refunded";
      profile_role: "customer" | "admin";
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
