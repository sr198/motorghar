#!/bin/bash
set -e

# Note: PostGIS will be added later when needed for geo queries
# For now, just ensure the database is ready

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'Database initialized successfully' AS status;
EOSQL