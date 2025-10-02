-- Create reference table
CREATE TABLE IF NOT EXISTS reference (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id UUID NOT NULL REFERENCES gallery(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for gallery_id for faster queries
CREATE INDEX idx_reference_gallery_id ON reference(gallery_id);

-- Create index for category for filtering
CREATE INDEX idx_reference_category ON reference(category);

-- Create GIN index for tags array for faster array searches
CREATE INDEX idx_reference_tags ON reference USING GIN(tags);

-- Create index for created_at for sorting
CREATE INDEX idx_reference_created_at ON reference(created_at DESC);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_reference_updated_at
    BEFORE UPDATE ON reference
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE reference ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reference table
-- Users can manage references for their own gallery items
CREATE POLICY "Users can create references for their gallery items" ON reference
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM gallery
            WHERE gallery.id = reference.gallery_id
            AND gallery.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can read references for their gallery items" ON reference
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM gallery
            WHERE gallery.id = reference.gallery_id
            AND gallery.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update references for their gallery items" ON reference
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM gallery
            WHERE gallery.id = reference.gallery_id
            AND gallery.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete references for their gallery items" ON reference
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM gallery
            WHERE gallery.id = reference.gallery_id
            AND gallery.user_id = auth.uid()
        )
    );
