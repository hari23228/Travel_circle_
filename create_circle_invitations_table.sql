-- Create circle_invitations table
-- Run this in Supabase SQL Editor

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_circle_invitations_circle ON circle_invitations(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_invitations_inviter ON circle_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_circle_invitations_code ON circle_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_circle_invitations_status ON circle_invitations(status);

-- Enable RLS
ALTER TABLE circle_invitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view invitations they sent or received" ON circle_invitations;
DROP POLICY IF EXISTS "Circle admins can create invitations" ON circle_invitations;
DROP POLICY IF EXISTS "Users can update invitation status" ON circle_invitations;

-- RLS Policies

-- Policy 1: Users can view invitations they sent or received
CREATE POLICY "Users can view invitations they sent or received" ON circle_invitations
  FOR SELECT
  USING (
    auth.uid() = inviter_id OR 
    auth.uid() IN (
      SELECT id FROM profiles WHERE email = invitee_email OR phone = invitee_phone
    )
  );

-- Policy 2: Circle admins can create invitations
CREATE POLICY "Circle admins can create invitations" ON circle_invitations
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM circle_memberships 
      WHERE circle_id = circle_invitations.circle_id 
      AND role IN ('admin', 'creator', 'moderator')
      AND status = 'active'
    ) OR
    auth.uid() IN (
      SELECT creator_id FROM travel_circles WHERE id = circle_invitations.circle_id
    )
  );

-- Policy 3: Users can update invitation status (accept/decline)
CREATE POLICY "Users can update invitation status" ON circle_invitations
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE email = invitee_email OR phone = invitee_phone
    ) OR
    auth.uid() = inviter_id
  );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON circle_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON circle_invitations TO service_role;
