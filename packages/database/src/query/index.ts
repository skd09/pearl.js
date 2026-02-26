/**
 * Re-export Drizzle's schema builders and operators.
 * Users import from @pearl-framework/database instead of drizzle-orm directly.
 */

// Schema builders
export {
  pgTable,
  pgEnum,
  serial,
  integer,
  bigserial,
  bigint,
  varchar,
  text,
  boolean,
  timestamp,
  date,
  numeric,
  jsonb,
  uuid,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export {
  mysqlTable,
  mysqlEnum,
  int,
  bigint as mysqlBigint,
  varchar as mysqlVarchar,
  text as mysqlText,
  boolean as mysqlBoolean,
  timestamp as mysqlTimestamp,
  datetime,
  decimal,
  json,
  primaryKey as mysqlPrimaryKey,
  index as mysqlIndex,
  uniqueIndex as mysqlUniqueIndex,
} from 'drizzle-orm/mysql-core'

export {
  sqliteTable,
  integer as sqliteInteger,
  text as sqliteText,
  real,
  blob,
  primaryKey as sqlitePrimaryKey,
  index as sqliteIndex,
  uniqueIndex as sqliteUniqueIndex,
} from 'drizzle-orm/sqlite-core'

// Query operators
export {
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  and,
  or,
  not,
  isNull,
  isNotNull,
  inArray,
  notInArray,
  like,
  ilike,
  between,
  sql,
  count,
  sum,
  avg,
  min,
  max,
  asc,
  desc,
} from 'drizzle-orm'