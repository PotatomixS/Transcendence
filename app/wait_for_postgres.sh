#!/bin/sh

# wait-for-postgres.sh
# until PGPASSWORD=$POSTGRES_PASSWORD PGUSER=$POSTGRES_USER PGHOST=$POSTGRES_DB_HOST PGDATABASE=$POSTGRES_DB_PREFIX"_"$POSTGRES_DB_NAME psql -c '\q'; do
#   sleep 1
# done

# npx prisma migrate dev

npm run start:dev