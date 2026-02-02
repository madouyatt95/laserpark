-- ============================================
-- LaserPark Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PARKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS parks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    country TEXT DEFAULT 'CI',
    city TEXT NOT NULL,
    currency TEXT DEFAULT 'XOF',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default parks
INSERT INTO parks (id, name, city) VALUES 
    ('11111111-1111-1111-1111-111111111111', 'LaserPark Angré', 'Abidjan'),
    ('22222222-2222-2222-2222-222222222222', 'LaserPark Zone 4', 'Abidjan')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'manager', 'staff')) DEFAULT 'staff',
    park_id UUID REFERENCES parks(id),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    park_id UUID NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
    icon TEXT,
    color TEXT,
    impacts_stock BOOLEAN DEFAULT false,
    stock_item_id UUID,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    park_id UUID NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    amount INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'wave', 'orange_money')),
    comment TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
    cancelled_reason TEXT,
    cancelled_by UUID REFERENCES profiles(id),
    cancelled_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES profiles(id),
    activity_date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    park_id UUID NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id),
    amount INTEGER NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'wave', 'orange_money')),
    comment TEXT,
    attachment_url TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    expense_date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- STOCK ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    park_id UUID NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER DEFAULT 0,
    min_threshold INTEGER DEFAULT 5,
    unit TEXT DEFAULT 'unité',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- STOCK MOVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    park_id UUID NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('entry', 'exit', 'adjustment')),
    quantity INTEGER NOT NULL,
    reason TEXT,
    activity_id UUID REFERENCES activities(id),
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- DAILY CLOSURES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS daily_closures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    park_id UUID NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
    closure_date DATE NOT NULL,
    total_revenue INTEGER DEFAULT 0,
    total_expenses INTEGER DEFAULT 0,
    net_result INTEGER DEFAULT 0,
    cash_total INTEGER DEFAULT 0,
    wave_total INTEGER DEFAULT 0,
    orange_money_total INTEGER DEFAULT 0,
    cash_counted INTEGER,
    cash_expected INTEGER,
    cash_difference INTEGER,
    activities_count INTEGER DEFAULT 0,
    expenses_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'locked')),
    created_by UUID NOT NULL REFERENCES profiles(id),
    validated_by UUID REFERENCES profiles(id),
    validated_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(park_id, closure_date)
);

-- ============================================
-- SHORTCUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS shortcuts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    park_id UUID NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '⚡',
    category_id UUID NOT NULL REFERENCES categories(id),
    amount INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'wave', 'orange_money')),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    park_id UUID REFERENCES parks(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE parks ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Parks: Super admins see all, others see their park
CREATE POLICY "Parks: Super admin access" ON parks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'super_admin'
        )
    );

CREATE POLICY "Parks: User park access" ON parks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.park_id = parks.id
        )
    );

-- Profiles: Users can read profiles in their park
CREATE POLICY "Profiles: Read own and park profiles" ON profiles
    FOR SELECT USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND (p.role = 'super_admin' OR p.park_id = profiles.park_id)
        )
    );

-- Activities: Users can CRUD in their park
CREATE POLICY "Activities: Park access" ON activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (profiles.role = 'super_admin' OR profiles.park_id = activities.park_id)
        )
    );

-- Similar policies for other tables...
-- (Add more specific policies as needed)

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at
CREATE TRIGGER update_parks_updated_at BEFORE UPDATE ON parks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_items_updated_at BEFORE UPDATE ON stock_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_closures_updated_at BEFORE UPDATE ON daily_closures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
