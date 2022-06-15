## Contact with address

```sql
create table contacts (
  id int primary key generated always as identity,
  name text not null,
  phone_number text not null,
  address_line1 text not null,
  address_line2 text,
  address_city text not null,
  address_country text not null,
  address_postcode text
);
```

```graphql
input ContactInput {
  name: String!
  phoneNumber: String!
  address: UserAddressInput!
}

input ContactAddressInput {
  line1: String!
  line2: String
  city: String!
  country: String!
  postcode: String
}
```

```js
const contactGql2PgPlan = ($contactInput) => {
  const $address = $contactInput.get("address");
  return object({
    name: $contactInput.get("name"),
    phone_number: $contactInput.get("phone_number"),
    address_line1: $address.get("line1"),
    address_line2: $address.get("line2"),
    address_city: $address.get("city"),
    address_country: $address.get("country"),
    address_postcode: $address.get("postcode"),
  });
};
```

## Feeding a lot of contacts into a function

```sql
create function find_matching_contacts(contacts contacts[])
returns setof contacts as $$
  -- ...
$$ language sql stable;
```

```graphql
extend type Query {
  findMatchingContacts(contacts: [ContactInput!]): [Contact]
}
```

```js
const findMatchingContactsPlan = ($root, args) => {
  const $plan = findMatchingContactsSource.execute([
    {
      plan: each(args.contacts, ($contact) => contactGql2PgPlan($contact)),
      pgCodec: listOfContactsCodec,
      name: "contacts",
    },
  ]);
  return $plan;
};
```

## Updating a contact

```graphql
input ContactPatch {
  name: String
  phoneNumber: String
  address: UserAddressInput!
}
input UpdateContactInput {
  id: Int!
  patch: ContactPatch!
}
extend type Mutation {
  updateContact(input: UpdateContactInput!): UpdateContactPayload
}
```

```js
const updateContactPlan = ($root, args) => {
  const $contact = pgUpdate(contactsSource, {
    id: args.input.get("id"),
  });
  const $data = args.input.get("patch");
  if (!$data.get("name").evalIs(undefined)) {
    $contact.set("name", $data.get("name"));
  }
  if (!$data.get("phoneNumber").evalIs(undefined)) {
    $contact.set("phone_number", $data.get("phoneNumber"));
  }
  const $addressInput = $data.get("address");
  if (!$addressInput.evalIs(undefined)) {
    $contact.set("address_line1", $addressInput.get("line1"));
    $contact.set("address_line2", $addressInput.get("line2"));
    $contact.set("address_city", $addressInput.get("city"));
    $contact.set("address_country", $addressInput.get("country"));
    $contact.set("address_postcode", $addressInput.get("postcode"));
  }
  return $contact;
};
```

## Updating a lot of contacts via custom mutation

```graphql
extend type Mutation {
  updateManyContacts(input: [UpdateContactInput!]!): UpdateManyContactsPayload
}
```

```js
const isNotUndefined = (data) => data !== undefined;
const updateManyContactsPlan = ($root, args) => {
  const $data = each(args.input, ($input) => {
    return object({
      id: $input.get("id"),

      name: $contactInput.get("name"),
      has_name: lambda($contactInput.get("name"), isNotUndefined),
      phone_number: $contactInput.get("phone_number"),
      has_phone_number: lambda(
        $contactInput.get("phone_number"),
        isNotUndefined,
      ),
      address_line1: $address.get("line1"),
      address_line2: $address.get("line2"),
      address_city: $address.get("city"),
      address_country: $address.get("country"),
      address_postcode: $address.get("postcode"),
      has_address: lambda($contactInput.get("address"), isNotUndefined),
    });
  });
  const $contactIds = pgRaw($data, async (data, pgClient) => {
    const rows = await pgClient.query(
      `
      update contacts
        set name = case when patch.has_name then patch.name else contacts.name,
        set phone_number = case when patch.has_phone_number then patch.phone_number else contacts.phone_number,
        set address_line1 = case when patch.has_address then patch.address_line1 else contacts.address_line1,
        set address_line2 = case when patch.has_address then patch.address_line2 else contacts.address_line2,
        -- ...
      from (
        select
          (el ->> 'id')::int as id,
          (el ->> 'name')::text as name,
          (el ->> 'has_name') = 'true' as has_name,
          -- ...
        from json_array_elements($1::json) el
      ) patch
      where contacts.id = patch.id
      returning contacts.id
    `,
      [data],
    );
    return rows.map((r) => r.id);
  });
  const $results = contactsSource.find();
  $results.where(
    sql`${$results.alias}.id = any (${$results.placeholder(
      $contactIds,
      TYPES.listOfType(TYPES.int),
    )})`,
  );
  return $results;
};
```

## Filtering

```graphql
input HasManyContactsFilter {
  none: [ContactsFilter!]
  some: [ContactsFilter!]
  all: [ContactsFilter!]
  count: IntFilter!
}
input OrganizationsFilter {
  AND: [OrganizationsFilter!]
  OR: [OrganizationsFilter!]
  NOT: OrganizationsFilter
  contactsByOrganizationId: HasManyContactsFilter
}
input ContactsFilter {
  AND: [ContactsFilter!]
  OR: [ContactsFilter!]
  NOT: ContactsFilter
  name: StringFilter
  phoneNumber: StringFilter
  organizationByOrganizationId: OrganizationsFilter
}
extend type Query {
  allContacts(filter: ContactsFilter): [Contact!]
}
```

## Ordering
