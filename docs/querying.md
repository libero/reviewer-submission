# Get manuscript by author email

```sql
  SELECT id, team_members, x FROM public.team, unnest(team_members) x where x->'alias'->>'email' like '%elifesciences%';
```