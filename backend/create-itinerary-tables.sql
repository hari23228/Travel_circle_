-- Quick script to create itinerary tables in Supabase
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/editor

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
  
  -- Budget Planning
  total_budget DECIMAL(12,2) NOT NULL,
  per_person_budget DECIMAL(12,2),
  per_day_budget DECIMAL(12,2),
  planned_spend DECIMAL(12,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'INR',
  
  -- Preferences
  interests TEXT[] DEFAULT '{}',
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
  theme TEXT,
  
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
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'sightseeing', 'dining', 'activity', 'transportation', 'accommodation'
  
  -- Location
  location_name TEXT,
  location_address TEXT,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  
  -- Timing
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  
  -- Budget
  estimated_cost DECIMAL(10,2) DEFAULT 0.00,
  actual_cost DECIMAL(10,2) DEFAULT 0.00,
  
  -- Booking
  booking_required BOOLEAN DEFAULT FALSE,
  booking_url TEXT,
  booking_status TEXT,
  
  -- Additional Info
  notes TEXT,
  tips TEXT,
  
  -- Voting (for group decisions)
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MEMBER PREFERENCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS member_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Preferences
  dietary_restrictions TEXT[],
  mobility_considerations TEXT,
  must_visit_places TEXT[],
  avoid_places TEXT[],
  preferred_activities TEXT[],
  preferred_pace TEXT,
  budget_preference TEXT,
  
  -- Submitted
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(itinerary_id, user_id)
);

-- ============================================================================
-- ACTIVITY VOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS activity_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  activity_id UUID REFERENCES itinerary_activities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT CHECK (vote_type IN ('up', 'down')) NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(activity_id, user_id)
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_itineraries_creator ON itineraries(creator_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_circle ON itineraries(circle_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_days_itinerary ON itinerary_days(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_activities_day ON itinerary_activities(day_id);
CREATE INDEX IF NOT EXISTS idx_activities_itinerary ON itinerary_activities(itinerary_id);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_votes ENABLE ROW LEVEL SECURITY;

-- Itineraries: Users can see their own itineraries or circle itineraries they're part of
CREATE POLICY "Users can view own itineraries"
  ON itineraries FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Users can create itineraries"
  ON itineraries FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update own itineraries"
  ON itineraries FOR UPDATE
  USING (auth.uid() = creator_id);

-- Itinerary Days: Same as parent itinerary
CREATE POLICY "Users can view own itinerary days"
  ON itinerary_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itineraries 
      WHERE itineraries.id = itinerary_days.itinerary_id 
      AND itineraries.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own itinerary days"
  ON itinerary_days FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM itineraries 
      WHERE itineraries.id = itinerary_days.itinerary_id 
      AND itineraries.creator_id = auth.uid()
    )
  );

-- Activities: Same as parent itinerary
CREATE POLICY "Users can view itinerary activities"
  ON itinerary_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM itineraries 
      WHERE itineraries.id = itinerary_activities.itinerary_id 
      AND itineraries.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage itinerary activities"
  ON itinerary_activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM itineraries 
      WHERE itineraries.id = itinerary_activities.itinerary_id 
      AND itineraries.creator_id = auth.uid()
    )
  );

-- Member Preferences: Users can manage their own preferences
CREATE POLICY "Users can view own preferences"
  ON member_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences"
  ON member_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Activity Votes: Users can manage their own votes
CREATE POLICY "Users can view all votes"
  ON activity_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own votes"
  ON activity_votes FOR ALL
  USING (auth.uid() = user_id);
