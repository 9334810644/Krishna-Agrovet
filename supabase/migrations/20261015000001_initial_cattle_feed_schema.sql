-- ==============================================================================
-- KRISHNA AGROVET CATTLE FEED E-COMMERCE DATABASE SCHEMA & RPC
-- Migration: 20261015000001_initial_cattle_feed_schema.sql
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(50) DEFAULT 'Wheat',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    bag_weight_kg NUMERIC(6, 2) NOT NULL CHECK (bag_weight_kg > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    mrp NUMERIC(10, 2) CHECK (mrp >= price),
    available_stock INT NOT NULL DEFAULT 0 CHECK (available_stock >= 0),
    low_stock_threshold INT NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
    description TEXT NOT NULL,
    short_description VARCHAR(300),
    image_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    nutritional_info JSONB DEFAULT '{}'::jsonb, -- e.g. {"crude_protein": "22%", "crude_fat": "4.5%", "fiber": "10%", "calcium": "1.2%"}
    feeding_guide TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for product search & filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products(price);

-- 3. STORE SETTINGS TABLE (Single row configuration)
CREATE TABLE IF NOT EXISTS public.store_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(150) NOT NULL DEFAULT 'Krishna Agrovet',
    tagline VARCHAR(250) DEFAULT 'Premium Cattle Feed & Dairy Nutrition Directly to Your Farm',
    owner_whatsapp VARCHAR(20) NOT NULL DEFAULT '919876543210',
    owner_phone VARCHAR(20) DEFAULT '+91 98765 43210',
    support_email VARCHAR(100) DEFAULT 'contact@krishnaagrovet.com',
    delivery_areas TEXT NOT NULL DEFAULT 'Alwar, Bharatpur, Behror, Kotputli, Rewari & Nearby Villages (within 40km)',
    min_order_bags INT DEFAULT 1 CHECK (min_order_bags >= 1),
    delivery_fee_per_bag NUMERIC(8, 2) DEFAULT 0.00,
    free_delivery_threshold_bags INT DEFAULT 5,
    notice_banner_text TEXT DEFAULT '🌾 Direct Mill Dispatch: Book online for prompt farm delivery. Pay Cash upon delivery.',
    is_store_open BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROFILES / ADMIN ROLES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150),
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    village_town VARCHAR(150) NOT NULL,
    full_address TEXT NOT NULL,
    landmark VARCHAR(150),
    pincode VARCHAR(10) NOT NULL,
    district VARCHAR(100) DEFAULT 'Alwar',
    state VARCHAR(100) DEFAULT 'Rajasthan',
    delivery_notes TEXT,
    total_bags INT NOT NULL CHECK (total_bags > 0),
    subtotal_amount NUMERIC(12, 2) NOT NULL CHECK (subtotal_amount >= 0),
    delivery_fee NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash_on_delivery',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled')),
    whatsapp_sent_at TIMESTAMPTZ,
    internal_notes TEXT,
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- 6. ORDER ITEMS TABLE (Immutable snapshot of purchase time details)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    bag_weight_kg NUMERIC(6, 2) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    line_total NUMERIC(12, 2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 7. INVENTORY MOVEMENTS (Full audit log for inventory changes)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    change_quantity INT NOT NULL, -- Negative for sales, positive for restock/restoration
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reason VARCHAR(50) NOT NULL 
        CHECK (reason IN ('order_placed', 'order_cancelled', 'manual_adjustment', 'restock', 'spoilage_damage', 'correction')),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_created_at ON public.inventory_movements(created_at DESC);

-- ==============================================================================
-- HELPER FUNCTIONS & ATOMIC PROCEDURES
-- ==============================================================================

-- Order Number Generator: KAV-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
    v_date TEXT;
    v_random TEXT;
    v_order_num TEXT;
    v_exists BOOLEAN;
BEGIN
    v_date := to_char(NOW(), 'YYYYMMDD');
    LOOP
        v_random := upper(substring(md5(random()::text) from 1 for 4));
        v_order_num := 'KAV-' || v_date || '-' || v_random;
        SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = v_order_num) INTO v_exists;
        EXIT WHEN NOT v_exists;
    END LOOP;
    RETURN v_order_num;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ATOMIC ORDER PLACEMENT RPC
-- Validates stock, locks product rows FOR UPDATE, calculates server-side totals,
-- deducts stock, creates order & order_items, logs inventory movements atomically.
CREATE OR REPLACE FUNCTION public.place_order_atomic(
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_village_town TEXT,
    p_full_address TEXT,
    p_landmark TEXT,
    p_pincode TEXT,
    p_district TEXT,
    p_state TEXT,
    p_delivery_notes TEXT,
    p_payment_method TEXT,
    p_items JSONB,              -- Array of [{"product_id": "uuid", "quantity": 3}]
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_item RECORD;
    v_prod RECORD;
    v_total_bags INT := 0;
    v_subtotal NUMERIC(12, 2) := 0.00;
    v_delivery_fee NUMERIC(8, 2) := 0.00;
    v_total_amount NUMERIC(12, 2) := 0.00;
    v_line_total NUMERIC(12, 2);
    v_existing_order RECORD;
    v_free_delivery_threshold INT := 5;
    v_delivery_fee_per_bag NUMERIC(8, 2) := 0.00;
BEGIN
    -- 1. Idempotency Check
    IF p_idempotency_key IS NOT NULL AND trim(p_idempotency_key) <> '' THEN
        SELECT id, order_number, total_amount, status INTO v_existing_order
        FROM public.orders
        WHERE idempotency_key = p_idempotency_key;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', true,
                'order_id', v_existing_order.id,
                'order_number', v_existing_order.order_number,
                'total_amount', v_existing_order.total_amount,
                'status', v_existing_order.status,
                'message', 'Existing order returned via idempotency key.'
            );
        END IF;
    END IF;

    -- 2. Basic Validation
    IF trim(p_customer_name) = '' OR trim(p_customer_phone) = '' OR trim(p_full_address) = '' THEN
        RAISE EXCEPTION 'Customer name, phone number, and address are strictly required.';
    END IF;

    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cannot place an empty order. At least one feed product is required.';
    END IF;

    -- Fetch store delivery configuration
    SELECT delivery_fee_per_bag, free_delivery_threshold_bags 
    INTO v_delivery_fee_per_bag, v_free_delivery_threshold
    FROM public.store_settings LIMIT 1;

    -- 3. Lock products and calculate server-side totals
    -- Sorting by product_id prevents deadlocks when multiple transactions occur simultaneously
    FOR v_item IN 
        SELECT (x->>'product_id')::UUID AS product_id, (x->>'quantity')::INT AS quantity
        FROM jsonb_array_elements(p_items) AS x
        ORDER BY (x->>'product_id')::UUID
    LOOP
        IF v_item.quantity <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity % for item. Must be greater than 0.', v_item.quantity;
        END IF;

        -- Lock the row FOR UPDATE to prevent race conditions & overselling
        SELECT id, name, brand, bag_weight_kg, price, available_stock, is_active
        INTO v_prod
        FROM public.products
        WHERE id = v_item.product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % does not exist.', v_item.product_id;
        END IF;

        IF NOT v_prod.is_active THEN
            RAISE EXCEPTION 'Product "%" is currently discontinued or inactive.', v_prod.name;
        END IF;

        IF v_prod.available_stock < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for "%". Available: % bags, Requested: % bags.',
                v_prod.name, v_prod.available_stock, v_item.quantity;
        END IF;

        v_line_total := v_prod.price * v_item.quantity;
        v_subtotal := v_subtotal + v_line_total;
        v_total_bags := v_total_bags + v_item.quantity;
    END LOOP;

    -- 4. Calculate Delivery Fee
    IF v_total_bags < COALESCE(v_free_delivery_threshold, 5) THEN
        v_delivery_fee := v_total_bags * COALESCE(v_delivery_fee_per_bag, 0.00);
    ELSE
        v_delivery_fee := 0.00;
    END IF;
    v_total_amount := v_subtotal + v_delivery_fee;

    -- 5. Generate unique order number
    v_order_number := public.generate_order_number();

    -- 6. Insert Order Header
    INSERT INTO public.orders (
        order_number, customer_name, customer_phone, village_town, full_address, landmark,
        pincode, district, state, delivery_notes, total_bags, subtotal_amount, delivery_fee,
        total_amount, payment_method, status, idempotency_key
    ) VALUES (
        v_order_number, trim(p_customer_name), trim(p_customer_phone), trim(p_village_town),
        trim(p_full_address), trim(p_landmark), trim(p_pincode),
        COALESCE(NULLIF(trim(p_district), ''), 'Alwar'),
        COALESCE(NULLIF(trim(p_state), ''), 'Rajasthan'),
        trim(p_delivery_notes), v_total_bags, v_subtotal, v_delivery_fee, v_total_amount,
        COALESCE(NULLIF(p_payment_method, ''), 'cash_on_delivery'), 'pending', p_idempotency_key
    ) RETURNING id INTO v_order_id;

    -- 7. Insert Order Items & Deduct Stock with Inventory Movement Log
    FOR v_item IN 
        SELECT (x->>'product_id')::UUID AS product_id, (x->>'quantity')::INT AS quantity
        FROM jsonb_array_elements(p_items) AS x
        ORDER BY (x->>'product_id')::UUID
    LOOP
        SELECT id, name, brand, bag_weight_kg, price, available_stock
        INTO v_prod
        FROM public.products
        WHERE id = v_item.product_id;

        v_line_total := v_prod.price * v_item.quantity;

        -- Immutable snapshot insert
        INSERT INTO public.order_items (
            order_id, product_id, product_name, brand, bag_weight_kg, unit_price, quantity, line_total
        ) VALUES (
            v_order_id, v_prod.id, v_prod.name, v_prod.brand, v_prod.bag_weight_kg, v_prod.price, v_item.quantity, v_line_total
        );

        -- Deduct inventory
        UPDATE public.products
        SET available_stock = available_stock - v_item.quantity,
            updated_at = NOW()
        WHERE id = v_prod.id;

        -- Log movement audit
        INSERT INTO public.inventory_movements (
            product_id, change_quantity, previous_stock, new_stock, reason, order_id, notes
        ) VALUES (
            v_prod.id, -v_item.quantity, v_prod.available_stock, v_prod.available_stock - v_item.quantity,
            'order_placed', v_order_id, 'Stock reserved for customer order ' || v_order_number
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_bags', v_total_bags,
        'subtotal_amount', v_subtotal,
        'delivery_fee', v_delivery_fee,
        'total_amount', v_total_amount,
        'status', 'pending',
        'message', 'Order placed successfully and stock reserved.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ATOMIC CANCEL ORDER & RESTORE STOCK RPC
-- Restores stock safely, logs inventory audit, and marks order cancelled.
-- Prevents double-cancellation and restores stock only once.
CREATE OR REPLACE FUNCTION public.cancel_order_atomic(
    p_order_id UUID,
    p_reason TEXT DEFAULT 'Customer or owner requested cancellation'
)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_prod RECORD;
BEGIN
    SELECT id, order_number, status INTO v_order
    FROM public.orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order % not found.', p_order_id;
    END IF;

    IF v_order.status = 'cancelled' THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Order ' || v_order.order_number || ' is already cancelled.'
        );
    END IF;

    -- Restore stock for each item in the order
    FOR v_item IN
        SELECT product_id, quantity, product_name
        FROM public.order_items
        WHERE order_id = p_order_id
    LOOP
        IF v_item.product_id IS NOT NULL THEN
            SELECT id, available_stock INTO v_prod
            FROM public.products
            WHERE id = v_item.product_id
            FOR UPDATE;

            IF FOUND THEN
                UPDATE public.products
                SET available_stock = available_stock + v_item.quantity,
                    updated_at = NOW()
                WHERE id = v_prod.id;

                INSERT INTO public.inventory_movements (
                    product_id, change_quantity, previous_stock, new_stock, reason, order_id, notes
                ) VALUES (
                    v_prod.id, v_item.quantity, v_prod.available_stock, v_prod.available_stock + v_item.quantity,
                    'order_cancelled', p_order_id, 'Restored stock upon order cancellation (' || p_reason || ')'
                );
            END IF;
        END IF;
    END LOOP;

    -- Update order status
    UPDATE public.orders
    SET status = 'cancelled',
        internal_notes = COALESCE(internal_notes || E'\n', '') || '[Cancelled on ' || to_char(NOW(), 'YYYY-MM-DD HH24:MI') || '] ' || p_reason,
        updated_at = NOW()
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'order_number', v_order.order_number,
        'status', 'cancelled',
        'message', 'Order cancelled and stock restored successfully.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- MANUAL INVENTORY ADJUSTMENT RPC
CREATE OR REPLACE FUNCTION public.adjust_inventory_stock(
    p_product_id UUID,
    p_change_quantity INT,
    p_reason TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_prod RECORD;
    v_new_stock INT;
BEGIN
    IF p_change_quantity = 0 THEN
        RAISE EXCEPTION 'Adjustment quantity cannot be 0.';
    END IF;

    SELECT id, name, available_stock INTO v_prod
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product % not found.', p_product_id;
    END IF;

    v_new_stock := v_prod.available_stock + p_change_quantity;
    IF v_new_stock < 0 THEN
        RAISE EXCEPTION 'Cannot adjust stock below 0. Current stock: %, Adjustment: %', v_prod.available_stock, p_change_quantity;
    END IF;

    UPDATE public.products
    SET available_stock = v_new_stock,
        updated_at = NOW()
    WHERE id = v_prod.id;

    INSERT INTO public.inventory_movements (
        product_id, change_quantity, previous_stock, new_stock, reason, performed_by, notes
    ) VALUES (
        v_prod.id, p_change_quantity, v_prod.available_stock, v_new_stock,
        p_reason, auth.uid(), p_notes
    );

    RETURN jsonb_build_object(
        'success', true,
        'product_id', v_prod.id,
        'product_name', v_prod.name,
        'previous_stock', v_prod.available_stock,
        'new_stock', v_new_stock
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper to check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Categories RLS
CREATE POLICY "Public can view active categories" 
ON public.categories FOR SELECT 
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage categories" 
ON public.categories FOR ALL 
USING (public.is_admin());

-- Products RLS
CREATE POLICY "Public can view active products" 
ON public.products FOR SELECT 
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage products" 
ON public.products FOR ALL 
USING (public.is_admin());

-- Store Settings RLS
CREATE POLICY "Public can view store settings" 
ON public.store_settings FOR SELECT 
USING (true);

CREATE POLICY "Admins can update store settings" 
ON public.store_settings FOR UPDATE 
USING (public.is_admin());

-- Orders RLS
-- Public cannot view all orders; admins can view and update all orders
CREATE POLICY "Admins can view and manage all orders" 
ON public.orders FOR ALL 
USING (public.is_admin());

-- Order Items RLS
CREATE POLICY "Admins can view order items" 
ON public.order_items FOR ALL 
USING (public.is_admin());

-- Inventory Movements RLS
CREATE POLICY "Admins can view inventory movements" 
ON public.inventory_movements FOR SELECT 
USING (public.is_admin());

-- Profiles RLS
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage profiles" 
ON public.profiles FOR ALL 
USING (public.is_admin());

-- ==============================================================================
-- DEMO SEED DATA (Authentic Indian Cattle Feed Products & Categories)
-- Clearly marked as demo/starter records with high nutritional realism
-- ==============================================================================

-- Initial Store Settings
INSERT INTO public.store_settings (
    business_name, tagline, owner_whatsapp, owner_phone, delivery_areas, min_order_bags, delivery_fee_per_bag, free_delivery_threshold_bags
) VALUES (
    'Krishna Agrovet',
    'Certified High-Yield Cattle Feed & Dairy Supplements Delivered Directly to Your Farm',
    '919876543210',
    '+91 98765 43210',
    'Serving Dairy Farmers in Alwar, Behror, Bharatpur, Rewari & Nearby Gram Panchayats',
    1,
    30.00,
    5
) ON CONFLICT DO NOTHING;

-- Seed Categories
INSERT INTO public.categories (name, slug, description, icon_name, display_order) VALUES
('Dairy Cattle Pellets', 'dairy-pellets', 'Balanced compound feed pellets formulated for high milking cows & buffaloes to maximize FAT and SNF.', 'Wheat', 1),
('Bypass Protein & Energy', 'bypass-protein', 'Advanced high-nutrition feeds with rumen-protected bypass fats and proteins for peak lactation.', 'Sparkles', 2),
('Calf Starter & Growth', 'calf-nutrition', 'Specially textured feed with high digestible protein to build robust calf immunity and early rumen development.', 'Milk', 3),
('Mineral & Calcium Supplements', 'supplements', 'Chelated mineral mixtures, liquid calcium gels, and vitamin tonics to prevent milk fever and metabolic disorders.', 'Pill', 4),
('Mustard Cake & Mash', 'oil-cakes-mash', 'Cold-pressed pure mustard oil cakes and traditional balanced dairy mash blends.', 'Leaf', 5)
ON CONFLICT (slug) DO NOTHING;

-- Seed Products (Realistic Indian Cattle Feed formulations)
DO $$
DECLARE
    cat_dairy UUID;
    cat_bypass UUID;
    cat_calf UUID;
    cat_supp UUID;
    cat_cake UUID;
BEGIN
    SELECT id INTO cat_dairy FROM public.categories WHERE slug = 'dairy-pellets' LIMIT 1;
    SELECT id INTO cat_bypass FROM public.categories WHERE slug = 'bypass-protein' LIMIT 1;
    SELECT id INTO cat_calf FROM public.categories WHERE slug = 'calf-nutrition' LIMIT 1;
    SELECT id INTO cat_supp FROM public.categories WHERE slug = 'supplements' LIMIT 1;
    SELECT id INTO cat_cake FROM public.categories WHERE slug = 'oil-cakes-mash' LIMIT 1;

    INSERT INTO public.products (
        category_id, name, brand, sku, bag_weight_kg, price, mrp, available_stock, low_stock_threshold,
        description, short_description, image_url, is_active, featured, nutritional_info, feeding_guide
    ) VALUES
    (
        cat_dairy,
        'Krishna Gold Milk Booster Pellets (Type II)',
        'Krishna Agrovet',
        'KAV-PEL-50KG-01',
        50.00,
        1450.00,
        1550.00,
        85,
        15,
        'Premium quality steam-cooked feed pellets manufactured according to BIS Type II standards. Enriched with bypass fat, probiotics, and balanced calcium-phosphorus ratio to maximize daily milk yield and ensure higher fat (6.5%+) and SNF in both cow and buffalo milk.',
        'Steam-cooked 50kg pellets for 10-18 liter daily milking cattle. Improves milk fat and SNF.',
        'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=800&q=80',
        true,
        true,
        '{"crude_protein": "20.5%", "crude_fat": "3.5%", "crude_fiber": "11.0%", "calcium": "1.2%", "phosphorus": "0.6%", "moisture": "10.0% max"}'::jsonb,
        'Feed 400g per liter of cow milk and 500g per liter of buffalo milk, plus 1.5kg for body maintenance.'
    ),
    (
        cat_dairy,
        'Kapila Super Pashu Aahar Pellets',
        'Kapila',
        'KAP-SUP-50KG-02',
        50.00,
        1520.00,
        1600.00,
        60,
        10,
        'Trusted dairy compound feed formulated with grains, de-oiled rice bran, and molasses. Highly palatable, improves digestive rumen function, and maintains consistent milk production during seasonal heat stress.',
        'Well-known branded 50kg bag for healthy digestion, body condition, and consistent yield.',
        'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=800&q=80',
        true,
        true,
        '{"crude_protein": "21.0%", "crude_fat": "3.8%", "crude_fiber": "10.5%", "calcium": "1.0%", "moisture": "10.0% max"}'::jsonb,
        'Mix with chopped green fodder or wheat straw. Feed twice daily during morning and evening milking.'
    ),
    (
        cat_bypass,
        'Krishna Rumen-Bypass Ultra Lactation Mix',
        'Krishna Agrovet',
        'KAV-BYP-50KG-03',
        50.00,
        1780.00,
        1920.00,
        40,
        10,
        'Specially engineered for high-producing dairy animals (producing over 18-25 liters/day). Formulated with protected soybean bypass protein and rumen-inert calcium soaps to prevent negative energy balance and post-calving ketosis.',
        'High-density bypass protein pellets for elite dairy crossbred cows and Murrah buffaloes.',
        'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=800&q=80',
        true,
        true,
        '{"crude_protein": "24.0%", "bypass_protein": "55% of CP", "crude_fat": "5.5%", "crude_fiber": "9.0%", "energy": "3000 Kcal/kg"}'::jsonb,
        'Feed 2kg to 3.5kg daily alongside standard dry and green roughage.'
    ),
    (
        cat_calf,
        'Balram Calf Starter Crumble',
        'Krishna Agrovet',
        'KAV-CLF-25KG-04',
        25.00,
        980.00,
        1080.00,
        35,
        8,
        'Highly digestible, milk-scented starter crumbles for calves aged 2 weeks to 3 months. Accelerates rumen papillae growth, builds intestinal immunity, and reduces calf mortality.',
        '25kg bag. Early rumen development crumble for calves from 14 days onwards.',
        'https://images.unsplash.com/photo-1596733430284-f7437764b14d?auto=format&fit=crop&w=800&q=80',
        true,
        false,
        '{"crude_protein": "22.5%", "crude_fat": "4.0%", "digestible_energy": "3200 Kcal/kg", "calcium": "1.4%", "vitamin_ad3e": "Enriched"}'::jsonb,
        'Introduce from day 14 at 100g/day, increasing gradually up to 1.5kg/day by weaning age.'
    ),
    (
        cat_supp,
        'Krishna Chelated Doodh-Dhara Mineral Mixture (5kg)',
        'Krishna Agrovet',
        'KAV-MIN-05KG-05',
        5.00,
        650.00,
        720.00,
        120,
        20,
        'Fortified with organic amino-acid chelated zinc, copper, manganese, chromium, iodine, cobalt, selenium, and live yeast cultures. Ensures timely heat, increases conception rates, and prevents reproductive repeat breeding.',
        '5kg bucket pack. Chelated minerals with bio-active yeast culture for fertility and high milk fat.',
        'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=800&q=80',
        true,
        true,
        '{"calcium": "25.0%", "phosphorus": "12.5%", "chelated_minerals": "100%", "vitamin_a": "700,000 IU", "biotin": "500 mg"}'::jsonb,
        'Mix 50g daily into cattle feed for milking cows; 30g daily for heifers and dry cows.'
    ),
    (
        cat_supp,
        'Calci-Plus Double Action Liquid Calcium (5 Litre)',
        'VetNutra',
        'VET-CAL-05LT-06',
        5.00,
        850.00,
        950.00,
        45,
        10,
        'High bio-availability ionic calcium enriched with Vitamin D3, B12, and herbal galactagogues (Shatavari, Jivanti). Quickly restores serum calcium levels around parturition and prevents milk fever.',
        '5 Litre can. High potency liquid calcium with Shatavari & D3 for sustained peak lactation.',
        'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
        true,
        false,
        '{"calcium": "3500 mg/100ml", "phosphorus": "1750 mg/100ml", "vitamin_d3": "15,000 IU/100ml", "shatavari_extract": "1000 mg"}'::jsonb,
        'Administer 100ml daily for 10-15 days, or 200ml for 3 days post calving.'
    ),
    (
        cat_cake,
        'Pure Shuddh Sarson Khal (Mustard Cake)',
        'Krishna Agrovet',
        'KAV-KHL-50KG-07',
        50.00,
        1850.00,
        1950.00,
        50,
        12,
        'Traditional cold-pressed double-filtered mustard oil cake without any chemical adulteration or urea. Natural pungent aroma, high natural oil content (7.5%+), providing exceptional energy and butterfat yield.',
        'Pure cold-pressed 50kg bag mustard cake. Unadulterated source of natural protein and oil.',
        'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80',
        true,
        false,
        '{"crude_protein": "34.0%", "natural_oil_fat": "7.8%", "moisture": "8.0% max", "silica": "1.5% max"}'::jsonb,
        'Soak in clean water for 2-3 hours before feeding. Mix with wheat bran or cattle pellets.'
    ),
    (
        cat_dairy,
        'Amul Dan Diamond Cattle Feed',
        'Amul',
        'AML-DIA-50KG-08',
        50.00,
        1490.00,
        1580.00,
        70,
        15,
        'Manufactured by GCMMF (Amul). Well balanced compound feed with optimum mineral fortification and rumen digestion enhancers. Popular among dairy cooperative members across North India.',
        'Genuine Amul 50kg dairy cattle feed. Reliable nutrition for crossbred cows and high-yield buffaloes.',
        'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80',
        true,
        true,
        '{"crude_protein": "20.0%", "crude_fat": "3.5%", "crude_fiber": "11.5%", "acid_insoluble_ash": "3.0% max"}'::jsonb,
        'Feed 400g to 450g per liter of milk output alongside dry straw and green fodder.'
    )
    ON CONFLICT (sku) DO NOTHING;
END $$;
