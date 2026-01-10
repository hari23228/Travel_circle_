-- Tripzz Database Schema for Supabase
-- This file contains all the SQL statements to create the database schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  city TEXT,
  bio TEXT,
  avatar_url TEXT,
  total_savings DECIMAL(12,2) DEFAULT 0.00,
  active_circles INTEGER DEFAULT 0,
  rewards_earned DECIMAL(10,2) DEFAULT 0.00,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TRAVEL CIRCLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS travel_circles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  destination TEXT,
  image_url TEXT,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0.00,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  max_members INTEGER DEFAULT 50,
  is_private BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CIRCLE MEMBERSHIPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS circle_memberships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES travel_circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  contribution_amount DECIMAL(10,2) DEFAULT 0.00,
  last_contribution_date TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(circle_id, user_id)
);

-- ============================================================================
-- CIRCLE CONTRIBUTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS circle_contributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES travel_circles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'upi',
  payment_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
  contribution_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================================================
-- TRAVEL GOALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS travel_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  destination TEXT,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) DEFAULT 0.00,
  target_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  category TEXT DEFAULT 'leisure' CHECK (category IN ('leisure', 'adventure', 'business', 'family', 'solo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  circle_id UUID REFERENCES travel_circles(id) ON DELETE SET NULL,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('hotel', 'transport', 'package')),
  
  -- Booking Details
  title TEXT NOT NULL,
  description TEXT,
  destination TEXT NOT NULL,
  
  -- Dates
  booking_date TIMESTAMPTZ NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Financial
  total_amount DECIMAL(12,2) NOT NULL,
  paid_amount DECIMAL(12,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'INR',
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  
  -- Booking specific data (JSON for flexibility)
  booking_data JSONB NOT NULL DEFAULT '{}',
  
  -- External references
  external_booking_id TEXT,
  provider_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'circle', 'booking', 'payment', 'goal')),
  is_read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  related_id UUID, -- Can reference circles, bookings, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CIRCLE INVITATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS circle_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES travel_circles(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invitee_email TEXT,
  invitee_phone TEXT,
  invitation_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- ============================================================================
-- USER SESSIONS TABLE (for enhanced auth tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  device_info JSONB DEFAULT '{}',
  ip_address INET,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON profiles(city);

-- Travel circles indexes
CREATE INDEX IF NOT EXISTS idx_travel_circles_creator ON travel_circles(creator_id);
CREATE INDEX IF NOT EXISTS idx_travel_circles_active ON travel_circles(is_active);
CREATE INDEX IF NOT EXISTS idx_travel_circles_destination ON travel_circles(destination);

-- Circle memberships indexes
CREATE INDEX IF NOT EXISTS idx_circle_memberships_circle ON circle_memberships(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_memberships_user ON circle_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_circle_memberships_active ON circle_memberships(is_active);

-- Contributions indexes
CREATE INDEX IF NOT EXISTS idx_contributions_circle ON circle_contributions(circle_id);
CREATE INDEX IF NOT EXISTS idx_contributions_user ON circle_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_date ON circle_contributions(contribution_date);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON circle_contributions(status);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_circle ON bookings(circle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_type ON bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);

-- Travel goals indexes
CREATE INDEX IF NOT EXISTS idx_travel_goals_user ON travel_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_goals_completed ON travel_goals(is_completed);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Travel circles policies
CREATE POLICY "Users can view public circles or circles they're members of" ON travel_circles
  FOR SELECT USING (
    NOT is_private OR 
    EXISTS (
      SELECT 1 FROM circle_memberships 
      WHERE circle_id = travel_circles.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create circles" ON travel_circles
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Circle creators and admins can update circles" ON travel_circles
  FOR UPDATE USING (
    auth.uid() = creator_id OR
    EXISTS (
      SELECT 1 FROM circle_memberships 
      WHERE circle_id = travel_circles.id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'moderator')
    )
  );

-- Circle memberships policies
CREATE POLICY "Users can view memberships of circles they belong to" ON circle_memberships
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM circle_memberships cm2 
      WHERE cm2.circle_id = circle_memberships.circle_id 
      AND cm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join circles" ON circle_memberships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Circle contributions policies
CREATE POLICY "Users can view contributions in their circles" ON circle_contributions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM circle_memberships 
      WHERE circle_id = circle_contributions.circle_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own contributions" ON circle_contributions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Travel goals policies
CREATE POLICY "Users can manage own goals" ON travel_goals
  FOR ALL USING (auth.uid() = user_id);

-- Bookings policies
CREATE POLICY "Users can manage own bookings" ON bookings
  FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Circle invitations policies
CREATE POLICY "Users can view invitations they sent or received" ON circle_invitations
  FOR SELECT USING (
    auth.uid() = inviter_id OR
    auth.email() = invitee_email
  );

-- User sessions policies
CREATE POLICY "Users can manage own sessions" ON user_sessions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travel_circles_updated_at BEFORE UPDATE ON travel_circles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_travel_goals_updated_at BEFORE UPDATE ON travel_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.phone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update circle stats when contributions change
CREATE OR REPLACE FUNCTION update_circle_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update circle current amount
  UPDATE travel_circles 
  SET current_amount = (
    SELECT COALESCE(SUM(amount), 0) 
    FROM circle_contributions 
    WHERE circle_id = COALESCE(NEW.circle_id, OLD.circle_id)
    AND status = 'confirmed'
  )
  WHERE id = COALESCE(NEW.circle_id, OLD.circle_id);
  
  -- Update user's total savings and active circles
  UPDATE profiles 
  SET 
    total_savings = (
      SELECT COALESCE(SUM(cc.amount), 0) 
      FROM circle_contributions cc 
      WHERE cc.user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND cc.status = 'confirmed'
    ),
    active_circles = (
      SELECT COUNT(DISTINCT cm.circle_id)
      FROM circle_memberships cm
      JOIN travel_circles tc ON tc.id = cm.circle_id
      WHERE cm.user_id = COALESCE(NEW.user_id, OLD.user_id)
      AND cm.is_active = true
      AND tc.is_active = true
    )
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for contribution changes
CREATE TRIGGER update_circle_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON circle_contributions
  FOR EACH ROW EXECUTE FUNCTION update_circle_stats();

-- Function to generate invitation codes
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ITINERARIES TABLE (Smart Itinerary Generation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS itineraries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  circle_id UUID REFERENCES travel_circles(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Trip Details
  title TEXT NOT NULL,
  destination TEXT NOT NULL,
  destination_country TEXT,
  destination_lat DECIMAL(10, 8),
  destination_lng DECIMAL(11, 8),
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  
  -- Budget Planning (DIFFERENTIATOR #1: Budget-First)
  total_budget DECIMAL(12,2) NOT NULL,
  per_person_budget DECIMAL(12,2),
  per_day_budget DECIMAL(12,2),
  planned_spend DECIMAL(12,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'INR',
  
  -- Preferences
  interests TEXT[] DEFAULT '{}', -- ['culture', 'food', 'adventure', 'nature', 'shopping']
  pace TEXT DEFAULT 'moderate' CHECK (pace IN ('relaxed', 'moderate', 'packed')),
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'generated', 'confirmed', 'completed')),
  
  -- AI Generation metadata
  ai_model_used TEXT,
  generation_prompt TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ITINERARY DAYS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS itinerary_days (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  
  -- Theme for the day
  theme TEXT, -- 'Cultural Exploration', 'Beach Day', 'Adventure Day'
  
  -- Budget for this day
  planned_budget DECIMAL(10,2) DEFAULT 0.00,
  actual_spend DECIMAL(10,2) DEFAULT 0.00,
  
  -- Timing
  start_time TIME DEFAULT '09:00',
  end_time TIME DEFAULT '21:00',
  
  -- Summary
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(itinerary_id, day_number)
);

-- ============================================================================
-- ITINERARY ACTIVITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS itinerary_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  day_id UUID REFERENCES itinerary_days(id) ON DELETE CASCADE NOT NULL,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  
  -- Sequence
  sequence_order INTEGER NOT NULL,
  
  -- Activity Details
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'attraction', 'restaurant', 'activity', 'transport', 'accommodation', 'break'
  
  -- Location
  place_id TEXT, -- Google Place ID
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Timing
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Cost (Budget-First Planning)
  estimated_cost DECIMAL(10,2) DEFAULT 0.00,
  cost_category TEXT DEFAULT 'medium' CHECK (cost_category IN ('free', 'budget', 'medium', 'expensive')),
  
  -- Additional Info
  image_url TEXT,
  rating DECIMAL(2,1),
  review_count INTEGER,
  tips TEXT,
  booking_required BOOLEAN DEFAULT FALSE,
  booking_url TEXT,
  
  -- Buffer/Flexibility
  is_buffer_time BOOLEAN DEFAULT FALSE,
  is_optional BOOLEAN DEFAULT FALSE,
  
  -- Circle Consensus (DIFFERENTIATOR #2)
  popularity_score INTEGER DEFAULT 0, -- How many members want this
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MEMBER PREFERENCES TABLE (Circle Consensus Builder)
-- ============================================================================
CREATE TABLE IF NOT EXISTS member_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Interest Ratings (1-5 scale)
  culture_rating INTEGER DEFAULT 3 CHECK (culture_rating BETWEEN 1 AND 5),
  food_rating INTEGER DEFAULT 3 CHECK (food_rating BETWEEN 1 AND 5),
  adventure_rating INTEGER DEFAULT 3 CHECK (adventure_rating BETWEEN 1 AND 5),
  nature_rating INTEGER DEFAULT 3 CHECK (nature_rating BETWEEN 1 AND 5),
  shopping_rating INTEGER DEFAULT 3 CHECK (shopping_rating BETWEEN 1 AND 5),
  nightlife_rating INTEGER DEFAULT 3 CHECK (nightlife_rating BETWEEN 1 AND 5),
  relaxation_rating INTEGER DEFAULT 3 CHECK (relaxation_rating BETWEEN 1 AND 5),
  
  -- Pace preference
  preferred_pace TEXT DEFAULT 'moderate' CHECK (preferred_pace IN ('relaxed', 'moderate', 'packed')),
  
  -- Budget comfort
  max_daily_budget DECIMAL(10,2),
  
  -- Dietary restrictions
  dietary_restrictions TEXT[],
  
  -- Accessibility needs
  accessibility_needs TEXT,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(itinerary_id, user_id)
);

-- ============================================================================
-- ACTIVITY VOTES TABLE (Circle Consensus - Voting System)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  activity_id UUID REFERENCES itinerary_activities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Vote type
  vote_type TEXT NOT NULL CHECK (vote_type IN ('love', 'like', 'neutral', 'dislike')),
  
  -- Optional comment
  comment TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

-- ============================================================================
-- ITINERARY ROUTES TABLE (For map visualization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS itinerary_routes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  day_id UUID REFERENCES itinerary_days(id) ON DELETE CASCADE NOT NULL,
  from_activity_id UUID REFERENCES itinerary_activities(id),
  to_activity_id UUID REFERENCES itinerary_activities(id),
  
  -- Route details
  distance_meters INTEGER,
  duration_minutes INTEGER,
  transport_mode TEXT DEFAULT 'walking' CHECK (transport_mode IN ('walking', 'driving', 'transit', 'cycling')),
  
  -- Map data
  polyline TEXT, -- Encoded polyline for map display
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ATTRACTIONS DATABASE (Pre-populated attractions for budget planning)
-- ============================================================================
CREATE TABLE IF NOT EXISTS attractions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  place_id TEXT UNIQUE,
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  destination TEXT NOT NULL, -- City/Area
  country TEXT,
  
  -- Location
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Categories
  category TEXT NOT NULL, -- 'attraction', 'restaurant', 'activity', 'shopping', 'nightlife'
  subcategory TEXT,
  tags TEXT[],
  
  -- Budget Info (CRITICAL for Budget-First Planning)
  estimated_cost DECIMAL(10,2) DEFAULT 0.00,
  cost_category TEXT DEFAULT 'medium' CHECK (cost_category IN ('free', 'budget', 'medium', 'expensive')),
  currency TEXT DEFAULT 'INR',
  
  -- Timing
  typical_duration_minutes INTEGER DEFAULT 60,
  opening_hours JSONB DEFAULT '{}',
  best_time_to_visit TEXT,
  
  -- Ratings
  rating DECIMAL(2,1),
  review_count INTEGER,
  
  -- Media
  image_url TEXT,
  images TEXT[],
  
  -- Popularity for suggestions
  popularity_score INTEGER DEFAULT 0,
  
  -- Metadata
  data_source TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ITINERARY INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_itineraries_circle ON itineraries(circle_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_creator ON itineraries(creator_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_destination ON itineraries(destination);
CREATE INDEX IF NOT EXISTS idx_itineraries_status ON itineraries(status);
CREATE INDEX IF NOT EXISTS idx_itinerary_days_itinerary ON itinerary_days(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_activities_day ON itinerary_activities(day_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_activities_itinerary ON itinerary_activities(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_member_preferences_itinerary ON member_preferences(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_activity_votes_activity ON activity_votes(activity_id);
CREATE INDEX IF NOT EXISTS idx_attractions_destination ON attractions(destination);
CREATE INDEX IF NOT EXISTS idx_attractions_category ON attractions(category);

-- ============================================================================
-- ITINERARY FUNCTIONS
-- ============================================================================

-- Function to calculate itinerary total cost
CREATE OR REPLACE FUNCTION calculate_itinerary_cost(p_itinerary_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL(12,2);
BEGIN
  SELECT COALESCE(SUM(estimated_cost), 0) INTO total
  FROM itinerary_activities
  WHERE itinerary_id = p_itinerary_id;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to update itinerary planned spend
CREATE OR REPLACE FUNCTION update_itinerary_spend()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE itineraries
  SET planned_spend = calculate_itinerary_cost(COALESCE(NEW.itinerary_id, OLD.itinerary_id)),
      updated_at = NOW()
  WHERE id = COALESCE(NEW.itinerary_id, OLD.itinerary_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update planned spend
CREATE TRIGGER update_itinerary_spend_trigger
  AFTER INSERT OR UPDATE OR DELETE ON itinerary_activities
  FOR EACH ROW EXECUTE FUNCTION update_itinerary_spend();

-- Function to calculate day cost
CREATE OR REPLACE FUNCTION calculate_day_cost(p_day_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(estimated_cost), 0) INTO total
  FROM itinerary_activities
  WHERE day_id = p_day_id;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to update activity popularity based on votes
CREATE OR REPLACE FUNCTION update_activity_popularity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE itinerary_activities
  SET popularity_score = (
    SELECT COUNT(*) FILTER (WHERE vote_type IN ('love', 'like'))
    FROM activity_votes
    WHERE activity_id = COALESCE(NEW.activity_id, OLD.activity_id)
  )
  WHERE id = COALESCE(NEW.activity_id, OLD.activity_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update popularity
CREATE TRIGGER update_activity_popularity_trigger
  AFTER INSERT OR UPDATE OR DELETE ON activity_votes
  FOR EACH ROW EXECUTE FUNCTION update_activity_popularity();

-- ============================================================================
-- INITIAL DATA / SEED DATA
-- ============================================================================

-- This section can be used to insert initial data
-- For now, we'll keep it empty as data will be added through the application

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for circle details with member count and progress
CREATE OR REPLACE VIEW circle_details AS
SELECT 
  tc.*,
  COUNT(cm.id) as member_count,
  ROUND((tc.current_amount / NULLIF(tc.target_amount, 0)) * 100, 2) as progress_percentage,
  p.full_name as creator_name,
  p.avatar_url as creator_avatar
FROM travel_circles tc
LEFT JOIN circle_memberships cm ON tc.id = cm.circle_id AND cm.is_active = true
LEFT JOIN profiles p ON tc.creator_id = p.id
WHERE tc.is_active = true
GROUP BY tc.id, p.full_name, p.avatar_url;

-- View for user dashboard stats
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT 
  p.id,
  p.full_name,
  p.total_savings,
  p.active_circles,
  p.rewards_earned,
  COUNT(DISTINCT tg.id) as total_goals,
  COUNT(DISTINCT CASE WHEN tg.is_completed = true THEN tg.id END) as completed_goals,
  COUNT(DISTINCT b.id) as total_bookings,
  COUNT(DISTINCT n.id) as unread_notifications
FROM profiles p
LEFT JOIN travel_goals tg ON p.id = tg.user_id
LEFT JOIN bookings b ON p.id = b.user_id
LEFT JOIN notifications n ON p.id = n.user_id AND n.is_read = false
GROUP BY p.id, p.full_name, p.total_savings, p.active_circles, p.rewards_earned;
