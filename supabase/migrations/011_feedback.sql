-- Create feedback table for user feedback
CREATE TABLE IF NOT EXISTS feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own feedback
CREATE POLICY "Users can view own feedback" ON feedback
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" ON feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all feedback (using service role for admin access)
CREATE POLICY "Admins can view all feedback" ON feedback
    FOR SELECT USING (true);

-- Policy: Admins can update feedback status (using service role for admin access)
CREATE POLICY "Admins can update feedback" ON feedback
    FOR UPDATE USING (true);

-- Create index for better performance
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);