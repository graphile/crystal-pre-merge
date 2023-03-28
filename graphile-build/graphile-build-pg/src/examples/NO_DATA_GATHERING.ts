/* eslint-disable no-restricted-syntax */

/*
 * This file demonstrates a schema that's autogenerated by some user-supplied
 * data sources (hence the "no data gathering" - we skip the gather phase).
 */

import {
  PgExecutorContextPlans,
  PgRegistryAny,
  WithPgClient,
  makePgSourceOptions,
} from "@dataplan/pg";
import { makeRegistryBuilder } from "@dataplan/pg";
import {
  PgExecutor,
  recordCodec,
  sqlFromArgDigests,
  TYPES,
} from "@dataplan/pg";
import { makePgAdaptorWithPgClient } from "@dataplan/pg/adaptors/pg";
import chalk from "chalk";
import { readFile } from "fs/promises";
import { context, object } from "grafast";
import {
  buildSchema,
  defaultPreset as graphileBuildPreset,
  QueryQueryPlugin,
} from "graphile-build";
import { resolvePresets } from "graphile-config";
import { EXPORTABLE, exportSchema } from "graphile-export";
import { graphql, printSchema } from "graphql";
import { Pool } from "pg";
import sql from "pg-sql2";
import { inspect } from "util";

import { defaultPreset as graphileBuildPgPreset } from "../index.js";

declare global {
  namespace Grafast {
    interface Context {
      pgSettings: {
        [key: string]: string;
      } | null;
      withPgClient: WithPgClient;
    }
  }
}

const pool = new Pool({
  connectionString: "pggql_test",
});
const withPgClient: WithPgClient = makePgAdaptorWithPgClient(pool);

async function main() {
  // Create our GraphQL schema by applying all the plugins
  const executor = EXPORTABLE(
    (PgExecutor, context, object) =>
      new PgExecutor({
        name: "main",
        context: () =>
          object({
            pgSettings: context<Grafast.Context>().get("pgSettings"),
            withPgClient: context<Grafast.Context>().get("withPgClient"),
          } as PgExecutorContextPlans<any>),
      }),
    [PgExecutor, context, object],
  );
  // TODO: extract this to be usable in general and not specific to this
  // example file.
  const UseRelationNamesPlugin: GraphileConfig.Plugin = {
    name: "UseRelationNamesPlugin",
    version: "0.0.0",
    inflection: {
      replace: {
        singleRelation(previous, options, details) {
          return this.camelCase(details.relationName);
        },
        singleRelationBackwards(previous, options, details) {
          return this.camelCase(details.relationName);
        },
        manyRelationConnection(previous, options, details) {
          return this.connectionField(this.camelCase(details.relationName));
        },
        manyRelationList(previous, options, details) {
          return this.listField(this.camelCase(details.relationName));
        },
      },
    },
  };
  const config = resolvePresets([
    {
      extends: [graphileBuildPreset, graphileBuildPgPreset],
      plugins: [QueryQueryPlugin, UseRelationNamesPlugin],
    },
  ]);

  const registry = EXPORTABLE(
    (
      TYPES,
      executor,
      makeRegistryBuilder,
      recordCodec,
      sql,
      sqlFromArgDigests,
    ) => {
      const usersCodec = recordCodec({
        name: `app_public.users`,
        identifier: sql`app_public.users`,
        columns: {
          id: {
            codec: TYPES.uuid,
            notNull: true,
            extensions: {
              tags: {
                hasDefault: true,
              },
            },
          },
          username: {
            codec: TYPES.text,
            notNull: true,
          },
          gravatar_url: {
            codec: TYPES.text,
            notNull: false,
          },
          created_at: {
            codec: TYPES.timestamptz,
            notNull: true,
          },
        },
        extensions: {
          tags: {
            name: "users",
          },
        },
      });

      const forumsCodec = recordCodec({
        name: `app_public.forums`,
        identifier: sql`app_public.forums`,
        columns: {
          id: {
            codec: TYPES.uuid,
            notNull: true,
            extensions: {
              tags: {
                hasDefault: true,
              },
            },
          },
          name: {
            codec: TYPES.text,
            notNull: true,
          },
          archived_at: {
            codec: TYPES.timestamptz,
            notNull: false,
          },
        },
        extensions: {
          tags: {
            name: "forums",
          },
        },
      });

      const messagesCodec = recordCodec({
        name: `app_public.messages`,
        identifier: sql`app_public.messages`,
        columns: {
          id: {
            codec: TYPES.uuid,
            notNull: true,
            extensions: {
              tags: {
                hasDefault: true,
              },
            },
          },
          forum_id: {
            codec: TYPES.uuid,
            notNull: true,
          },
          author_id: {
            codec: TYPES.uuid,
            notNull: true,
          },
          body: {
            codec: TYPES.text,
            notNull: true,
          },
          featured: {
            codec: TYPES.boolean,
            notNull: true,
          },
          created_at: {
            codec: TYPES.timestamptz,
            notNull: true,
          },
          archived_at: {
            codec: TYPES.timestamptz,
            notNull: false,
          },
        },
        extensions: {
          tags: {
            name: "messages",
          },
        },
      });

      const usersSourceOptions = makePgSourceOptions({
        name: "users",
        executor,
        source: usersCodec.sqlType,
        codec: usersCodec,
        uniques: [{ columns: ["id"], isPrimary: true }],
      });

      const forumsSourceOptions = makePgSourceOptions({
        //name: "main.app_public.forums",
        name: "forums",
        executor,
        source: forumsCodec.sqlType,
        codec: forumsCodec,
        uniques: [{ columns: ["id"], isPrimary: true }],
      });

      const messagesSourceOptions = makePgSourceOptions({
        name: "messages",
        executor,
        source: messagesCodec.sqlType,
        codec: messagesCodec,
        uniques: [{ columns: ["id"], isPrimary: true }],
      });

      const uniqueAuthorCountSourceOptions = makePgSourceOptions({
        executor,
        codec: TYPES.int,
        source: (...args) =>
          sql`app_public.unique_author_count(${sqlFromArgDigests(args)})`,
        name: "unique_author_count",
        parameters: [
          {
            name: "featured",
            required: false,
            codec: TYPES.boolean,
          },
        ],
        extensions: {
          tags: {
            behavior: "queryField",
          },
        },
      });

      const forumsUniqueAuthorCountSourceOptions = makePgSourceOptions({
        executor,
        codec: TYPES.int,
        isUnique: true,
        source: (...args) =>
          sql`app_public.forums_unique_author_count(${sqlFromArgDigests(
            args,
          )})`,
        name: "forums_unique_author_count",
        parameters: [
          {
            name: "forum",
            codec: forumsCodec,
            required: true,
            notNull: true,
          },
          {
            name: "featured",
            codec: TYPES.boolean,
            required: false,
            notNull: false,
          },
        ],
        extensions: {
          tags: {
            // behavior: ["typeField"],
            name: "unique_author_count",
          },
        },
      });

      const forumsRandomUserSourceOptions = makePgSourceOptions({
        executor,
        codec: usersCodec,
        isUnique: true,
        source: (...args) =>
          sql`app_public.forums_random_user(${sqlFromArgDigests(args)})`,
        name: "forums_random_user",
        parameters: [
          {
            name: "forum",
            codec: forumsCodec,
            required: true,
            notNull: true,
          },
        ],
        extensions: {
          tags: {
            // behavior: ["typeField"],
            name: "random_user",
          },
        },
      });

      const forumsFeaturedMessagesSourceOptions = makePgSourceOptions({
        executor,
        codec: messagesCodec,
        isUnique: false,
        source: (...args) =>
          sql`app_public.forums_featured_messages(${sqlFromArgDigests(args)})`,
        name: "forums_featured_messages",
        parameters: [
          {
            name: "forum",
            codec: forumsCodec,
            required: true,
            notNull: true,
          },
        ],
        extensions: {
          tags: {
            behavior: "typeField connection list",
            name: "featured_messages",
          },
        },
      });
      return makeRegistryBuilder()
        .addSource(usersSourceOptions)
        .addSource(forumsSourceOptions)
        .addSource(messagesSourceOptions)
        .addSource(uniqueAuthorCountSourceOptions)
        .addSource(forumsUniqueAuthorCountSourceOptions)
        .addSource(forumsRandomUserSourceOptions)
        .addSource(forumsFeaturedMessagesSourceOptions)
        .addRelation(
          usersSourceOptions.codec,
          "messages",
          messagesSourceOptions,
          {
            isUnique: false,
            localColumns: ["id"],
            remoteColumns: ["author_id"],
          },
        )
        .addRelation(
          forumsSourceOptions.codec,
          "messages",
          messagesSourceOptions,
          {
            isUnique: false,
            localColumns: ["id"],
            remoteColumns: ["forum_id"],
            extensions: {
              tags: {
                behavior: "connection list",
              },
            },
          },
        )
        .addRelation(
          messagesSourceOptions.codec,
          "author",
          usersSourceOptions,
          {
            isUnique: true,
            localColumns: ["author_id"],
            remoteColumns: ["id"],
          },
        )
        .addRelation(
          messagesSourceOptions.codec,
          "forum",
          forumsSourceOptions,
          {
            isUnique: true,
            localColumns: ["forum_id"],
            remoteColumns: ["id"],
          },
        )
        .build();
    },
    [TYPES, executor, makeRegistryBuilder, recordCodec, sql, sqlFromArgDigests],
  );

  // We're crafting our own input
  const input: GraphileBuild.BuildInput = {
    pgRegistry: registry as unknown as PgRegistryAny,
  };
  const schema = buildSchema(config, input);

  // Output our schema
  console.log(chalk.blue(printSchema(schema)));
  console.log();
  console.log();
  console.log();

  // Common GraphQL arguments
  const source = /* GraphQL */ `
    query {
      allForumsList {
        id
        name
        archivedAt
      }
      allForums {
        nodes {
          id
          name
          archivedAt
          messagesList {
            id
            body
            forumId
            authorId
          }
        }
        edges {
          cursor
          node {
            id
            name
            archivedAt
            messages {
              nodes {
                id
                body
                forumId
                authorId
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
      }
      allUsersList {
        id
        username
        gravatarUrl
        createdAt
        messages {
          totalCount
        }
      }
      allMessagesList {
        id
        forumId
        authorId
        body
        featured
        createdAt
        archivedAt
        forum {
          name
          uniqueAuthorCount
          uniqueAuthorCountFeatured: uniqueAuthorCount(featured: true)
          randomUser {
            id
            username
          }
          featuredMessages {
            nodes {
              id
              body
              featured
            }
          }
          featuredMessagesList {
            id
            body
            featured
          }
        }
        author {
          username
        }
      }
    }
  `;

  const rootValue = null;
  const contextValue = {
    withPgClient,
  };
  const variableValues = Object.create(null);

  // Run our query
  const result = await graphql({
    schema,
    source,
    rootValue,
    variableValues,
    contextValue,
  });
  console.log(inspect(result, { depth: Infinity, colors: true }));

  if ("errors" in result && result.errors) {
    process.exit(1);
  }

  // Export schema
  // const exportFileLocation = new URL("../../temp.js", import.meta.url);
  const exportFileLocation = `${__dirname}/../../temp.mjs`;
  await exportSchema(schema, exportFileLocation);

  // output code
  console.log(chalk.green(await readFile(exportFileLocation, "utf8")));

  // run code
  const { schema: schema2 } = await import(exportFileLocation.toString());
  const result2 = await graphql({
    schema: schema2,
    source,
    rootValue,
    variableValues,
    contextValue,
  });
  console.log(inspect(result2, { depth: Infinity, colors: true }));
}

main()
  .then(() => pool.end())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
