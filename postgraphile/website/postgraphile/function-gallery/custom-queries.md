---
title: "Custom Query Examples"
sidebar_position: 1
---

# Custom Queries

Below you'll find some examples of various PostgreSQL functions, and their effects on PostGraphile.

## Logged in user field

```sql
create function viewer()
returns users
as $$
  select *
  from users
  where id = current_user_id();
  /*
   * current_user_id() is a function
   * that returns the logged in user's
   * id, e.g. by extracting from the JWT
   * or indicated via pgSettings.
   */
$$ language sql stable set search_path from current;
```

```diff
--- Original GraphQL Schema
+++ Modified GraphQL Schema
@@ -1795,6 +1795,7 @@

   """Chosen by fair dice roll. Guaranteed to be random. XKCD#221"""
   randomNumber: Int
+  viewer: User

   """Reads a single `Forum` using its globally unique `ID`."""
   forumByNodeId(
```
