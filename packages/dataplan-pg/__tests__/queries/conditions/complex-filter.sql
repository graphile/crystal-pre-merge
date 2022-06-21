select __forums_result__.*
from (
  select
    ids.ordinality - 1 as idx,
    (ids.value->>0)::"bool" as "id0",
    (ids.value->>1)::"bool" as "id1"
  from json_array_elements($1::json) with ordinality as ids
) as __forums_identifiers__,
lateral (
  select
    __forums__."name" as "0",
    (select json_agg(_) from (
      select
        __messages__."body" as "0",
        __messages__."featured"::text as "1"
      from app_public.messages as __messages__
      where
        (
          __messages__.featured <> __forums_identifiers__."id1"
        ) and (
          (__messages__.archived_at is null) = (__forums__."archived_at" is null)
        ) and (
          __forums__."id"::"uuid" = __messages__."forum_id"
        )
      order by __messages__."id" asc
    ) _) as "1",
    __forums_identifiers__.idx as "2"
  from app_public.forums as __forums__
  where
    (
      __forums__.archived_at is null
    ) and (
      exists(
        select 1
        from app_public.messages as __messages_filter__
        where
          (
            __forums__."id" = __messages_filter__."forum_id"
          ) and (
            __messages_filter__.featured = __forums_identifiers__."id0"
          )
      )
    ) and (
      true /* authorization checks */
    )
  order by __forums__."id" asc
) as __forums_result__