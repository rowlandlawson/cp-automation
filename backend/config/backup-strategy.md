# Database Backup Strategy

## Recommended Approach

1. Create a Neon branch before any schema change or destructive data update.
2. Export a logical backup with `pg_dump` on a fixed schedule.
3. Store backups outside the app server, such as cloud storage or a secured CI artifact bucket.
4. Test restore steps regularly with a disposable database.

## Suggested Commands

```bash
pg_dump "$DATABASE_URL" --format=custom --file=backups/cp_automation.dump
pg_restore --clean --if-exists --no-owner --dbname="$RESTORE_DATABASE_URL" backups/cp_automation.dump
```

## Suggested Schedule

- Nightly full logical backup
- Pre-deploy backup before schema changes
- Retain daily backups for 14 days
- Retain weekly backups for 8 weeks

## Restore Checklist

1. Create a fresh target database or Neon branch.
2. Restore the latest verified backup.
3. Run smoke checks against `/api/health`.
4. Validate admin login and core content queries before switching traffic.
