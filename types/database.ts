export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type TableDefinition<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      categories: TableDefinition<
        {
          id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          image_url: string | null;
          created_at: string;
        },
        {
          id?: string;
          name: string;
          slug: string;
          parent_id?: string | null;
          image_url?: string | null;
          created_at?: string;
        }
      >;
      products: TableDefinition<
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
        {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          category_id: string;
          base_price_kes: number;
          compare_at_price_kes?: number | null;
          is_active?: boolean;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      product_variants: TableDefinition<
        {
          id: string;
          product_id: string;
          size: string;
          color: string;
          sku: string;
          stock_quantity: number;
          price_override_kes: number | null;
        },
        {
          id?: string;
          product_id: string;
          size: string;
          color: string;
          sku: string;
          stock_quantity?: number;
          price_override_kes?: number | null;
        }
      >;
      product_images: TableDefinition<
        {
          id: string;
          product_id: string;
          url: string;
          alt_text: string | null;
          sort_order: number;
        },
        {
          id?: string;
          product_id: string;
          url: string;
          alt_text?: string | null;
          sort_order?: number;
        }
      >;
      orders: TableDefinition<
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
        {
          id?: string;
          order_number?: string;
          user_id?: string | null;
          customer_name: string;
          email: string;
          phone: string;
          delivery_address: Json;
          subtotal_kes: number;
          delivery_fee_kes?: number;
          total_kes: number;
          status?: Database["public"]["Enums"]["order_status"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          paystack_reference?: string | null;
          created_at?: string;
        }
      >;
      order_items: TableDefinition<
        {
          id: string;
          order_id: string;
          product_id: string;
          variant_id: string | null;
          product_name_snapshot: string;
          unit_price_kes: number;
          quantity: number;
        },
        {
          id?: string;
          order_id: string;
          product_id: string;
          variant_id?: string | null;
          product_name_snapshot: string;
          unit_price_kes: number;
          quantity: number;
        }
      >;
      profiles: TableDefinition<
        {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: Database["public"]["Enums"]["profile_role"];
        },
        {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: Database["public"]["Enums"]["profile_role"];
        }
      >;
      wishlist_items: TableDefinition<
        {
          user_id: string;
          product_id: string;
        },
        {
          user_id: string;
          product_id: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: {
      decrement_variant_stock: {
        Args: { p_variant_id: string; p_quantity: number };
        Returns: undefined;
      };
      generate_order_number: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
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

export type Tables<Name extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][Name]["Row"];
