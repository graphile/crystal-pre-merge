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
  id: Int
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
const isNotUndefined = (data) => data !== undefined;
ContactInput.extensions.toDataPlan = ($contactInput) => {
  const $address = $contactInput.get("address");
  return object({
    id: $contactInput.get("id"),

    name: $contactInput.get("name"),
    phone_number: $contactInput.get("phone_number"),
    address_line1: $address.get("line1"),
    address_line2: $address.get("line2"),
    address_city: $address.get("city"),
    address_country: $address.get("country"),
    address_postcode: $address.get("postcode"),

    has_name: lambda($contactInput.get("name"), isNotUndefined),
    has_phone_number: lambda($contactInput.get("phone_number"), isNotUndefined),
    has_address: lambda($contactInput.get("address"), isNotUndefined),
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
      plan: each(args.contacts, ($contact) =>
        ContactInput.extensions.toDataPlan($contact),
      ),
      pgCodec: listOfContactsCodec,
      name: "contacts",
    },
  ]);
  return $plan;
};
```

## Creating a contact

```graphql
input CreateContactInput {
  contact: ContactInput!
}
extend type Mutation {
  createContact(input: CreateContactInput!): CreateContactPayload
}
```

```js
ContactInput.extensions.applyToCreate = ($pgCreate, $data) => {
  if (!$data.get("id").evalIs(undefined)) {
    $pgCreate.set("id", $data.get("id"));
  }
  if (!$data.get("name").evalIs(undefined)) {
    $pgCreate.set("name", $data.get("name"));
  }
  if (!$data.get("phoneNumber").evalIs(undefined)) {
    $pgCreate.set("phone_number", $data.get("phoneNumber"));
  }
  const $addressInput = $data.get("address");
  if (!$addressInput.evalIs(undefined)) {
    $pgCreate.set("address_line1", $addressInput.get("line1"));
    $pgCreate.set("address_line2", $addressInput.get("line2"));
    $pgCreate.set("address_city", $addressInput.get("city"));
    $pgCreate.set("address_country", $addressInput.get("country"));
    $pgCreate.set("address_postcode", $addressInput.get("postcode"));
  }
};

const createContactPlan = ($root, args) => {
  const $contact = pgCreate(contactsSource);
  const $data = args.input.get("contact");
  ContactInput.extensions.applyToCreate($contact, $data);
  return $contact;
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
ContactPatch.extensions.applyToUpdate = ($pgUpdate, $patch) => {
  if (!$patch.get("name").evalIs(undefined)) {
    $pgUpdate.set("name", $patch.get("name"));
  }
  if (!$patch.get("phoneNumber").evalIs(undefined)) {
    $pgUpdate.set("phone_number", $patch.get("phoneNumber"));
  }
  const $addressInput = $patch.get("address");
  if (!$addressInput.evalIs(undefined)) {
    $pgUpdate.set("address_line1", $addressInput.get("line1"));
    $pgUpdate.set("address_line2", $addressInput.get("line2"));
    $pgUpdate.set("address_city", $addressInput.get("city"));
    $pgUpdate.set("address_country", $addressInput.get("country"));
    $pgUpdate.set("address_postcode", $addressInput.get("postcode"));
  }
};

const updateContactPlan = ($root, args) => {
  const $contact = pgUpdate(contactsSource, {
    id: args.input.get("id"),
  });
  const $data = args.input.get("patch");
  ContactPatch.extensions.applyToUpdate($contact, $data);
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
const updateManyContactsPlan = ($root, args) => {
  const $data = each(args.input, ($input) =>
    ContactInput.extensions.toDataPlan($input),
  );
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

```js
const applyFilter = (InputType, $where, $input) => {
  const fields = InputType.getFields();
  for (const field of fields) {
    const $value = $input.get(field.fieldName);
    const plan = field.extensions.filterPlan;
    if (plan && !$value.evalIs(null) && !$value.evalIs(undefined)) {
      plan($where, $value);
    }
  }
};

const allContactsPlan = ($root, args) => {
  const $contacts = contactsSource.find();
  const $where = $contacts.wherePlan();
  if (!args.filter.evalIs(null) && !args.filter.evalIs(undefined)) {
    applyFilter(ContactsFilter, $where, args.filter);
  }
};
```

## Ordering
