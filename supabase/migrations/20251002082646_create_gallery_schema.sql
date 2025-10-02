-- Create gallery table
CREATE TABLE IF NOT EXISTS gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for user_id for faster queries
CREATE INDEX idx_gallery_user_id ON gallery(user_id);

-- Create index for created_at for sorting
CREATE INDEX idx_gallery_created_at ON gallery(created_at DESC);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gallery_updated_at
    BEFORE UPDATE ON gallery
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for gallery table
CREATE POLICY "Users can create their own gallery items" ON gallery
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own gallery items" ON gallery
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own gallery items" ON gallery
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gallery items" ON gallery
    FOR DELETE USING (auth.uid() = user_id);
