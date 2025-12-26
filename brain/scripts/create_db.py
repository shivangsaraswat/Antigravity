from app.core.config import Config
from sqlalchemy import create_engine, text

def force_create_table():
    engine = create_engine(Config.get_sqlalchemy_url())
    
    # SQL to create the resources table matching the Go model
    create_sql = text("""
    CREATE TABLE IF NOT EXISTS resources (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ,
        category TEXT,
        subject TEXT,
        year BIGINT,
        title TEXT,
        content TEXT,
        topic TEXT,
        difficulty TEXT,
        metadata JSONB,
        embedding vector(768)
    );
    
    CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
    CREATE INDEX IF NOT EXISTS idx_resources_deleted_at ON resources(deleted_at);
    """)
    
    with engine.connect() as conn:
        print("🔨 Creating 'resources' table...")
        conn.execute(create_sql)
        conn.commit()
        print("✅ Table 'resources' created successfully!")

if __name__ == "__main__":
    force_create_table()
