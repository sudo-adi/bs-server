-- Migration: Create news_updates table for infrastructure news scraper
-- Created: 2025-11-01

-- Create news_updates table
CREATE TABLE IF NOT EXISTS news_updates (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(500) NOT NULL,
    sector VARCHAR(200),
    company_authority VARCHAR(300),
    location VARCHAR(300),
    value_cr DECIMAL(15, 2) CHECK (value_cr >= 1000),
    status VARCHAR(100),
    revised_budget DECIMAL(15, 2),
    revised_timeline VARCHAR(200),
    delay_reason TEXT,
    source_url VARCHAR(1000) NOT NULL UNIQUE,
    source_type VARCHAR(100),
    summary_remarks TEXT,
    scraped_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_news_updates_sector ON news_updates(sector);
CREATE INDEX IF NOT EXISTS idx_news_updates_status ON news_updates(status);
CREATE INDEX IF NOT EXISTS idx_news_updates_value_cr ON news_updates(value_cr);
CREATE INDEX IF NOT EXISTS idx_news_updates_scraped_date ON news_updates(scraped_date);
CREATE INDEX IF NOT EXISTS idx_news_updates_source_url ON news_updates(source_url);
CREATE INDEX IF NOT EXISTS idx_news_updates_created_at ON news_updates(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_news_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_news_updates_updated_at
    BEFORE UPDATE ON news_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_news_updates_updated_at();

-- Add comments for documentation
COMMENT ON TABLE news_updates IS 'Stores infrastructure news updates scraped daily from various sources';
COMMENT ON COLUMN news_updates.project_name IS 'Name of the infrastructure project';
COMMENT ON COLUMN news_updates.sector IS 'Sector category (Roads, Railways, Power, etc.)';
COMMENT ON COLUMN news_updates.company_authority IS 'Company or government authority handling the project';
COMMENT ON COLUMN news_updates.location IS 'Project location (City, State, etc.)';
COMMENT ON COLUMN news_updates.value_cr IS 'Project value in crores (minimum 1000 crore)';
COMMENT ON COLUMN news_updates.status IS 'Project status (Approved, Under Construction, Delayed, etc.)';
COMMENT ON COLUMN news_updates.revised_budget IS 'Revised budget if applicable';
COMMENT ON COLUMN news_updates.revised_timeline IS 'Revised timeline if applicable';
COMMENT ON COLUMN news_updates.delay_reason IS 'Reason for project delay if applicable';
COMMENT ON COLUMN news_updates.source_url IS 'Original source URL of the news article (unique)';
COMMENT ON COLUMN news_updates.source_type IS 'Type of source (Government, News Media, Company)';
COMMENT ON COLUMN news_updates.summary_remarks IS 'Brief summary of the news update';
COMMENT ON COLUMN news_updates.scraped_date IS 'Date when the news was scraped';
