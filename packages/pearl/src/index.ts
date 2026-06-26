// ─── Core ─────────────────────────────────────────────────────────────────────
export {
    Application,
    Container,
    ServiceProvider,
    Config,
    env,
    loadDotenv,
    parseDotenv,
    PearlError,
    BindingNotFoundError,
    CircularDependencyError,
    ContainerFrozenError,
    ProviderBootError,
} from '@pearl-framework/core'
export type {
    ApplicationOptions,
    IContainer,
    BindingToken,
    Factory,
    Binding,
} from '@pearl-framework/core'

// ─── HTTP ─────────────────────────────────────────────────────────────────────
export {
    HttpKernel,
    Router,
    HttpContext,
    Request,
    Response,
    Pipeline,
    RateLimit,
    MemoryRateLimitStore,
} from '@pearl-framework/http'
export type {
    Route,
    RouteMatch,
    RouteHandler,
    HttpMethod,
    Middleware,
    MiddlewareFn,
    MiddlewareClass,
    NextFn,
    RateLimitOptions,
    RateLimitStore,
    ParsedBody,
    KernelOptions,
} from '@pearl-framework/http'
export { HttpServiceProvider } from '@pearl-framework/http'

// ─── Validation ───────────────────────────────────────────────────────────────
export {
    FormRequest,
    ValidationException,
    AuthorizationException,
    ValidationPipe,
    validate,
    validateSync,
    rules,
    z,
    ValidateServiceProvider,
} from '@pearl-framework/validate'
export type {
    ValidationErrors,
    ZodSchema,
    ZodTypeAny,
    ZodInfer,
} from '@pearl-framework/validate'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export {
    AuthManager,
    JwtGuard,
    ApiTokenGuard,
    SessionGuard,
    Hash,
    Authenticate,
    OptionalAuth,
    AuthServiceProvider,
} from '@pearl-framework/auth'
export type {
    AuthUser,
    UserProvider,
    AuthGuard,
    JwtConfig,
    JwtPayload,
    TokenRecord,
    TokenStore,
    SessionRecord,
    SessionStore,
    SessionConfig,
    AuthMiddlewareOptions,
    AuthServiceConfig,
} from '@pearl-framework/auth'

// ─── Events ───────────────────────────────────────────────────────────────────
export {
    Event,
    Listener,
    EventDispatcher,
    EventServiceProvider,
} from '@pearl-framework/events'
export type {
    EventMap,
    EventErrorHandler,
} from '@pearl-framework/events'

// ─── Queue ────────────────────────────────────────────────────────────────────
export {
    Job,
    QueueManager,
    QueueWorker,
    QueueServiceProvider,
    retryWith,
    fixedBackoff,
    linearBackoff,
    exponentialBackoff,
} from '@pearl-framework/queue'
export type {
    QueueConfig,
    QueueServiceConfig,
    WorkerOptions,
    UnknownJobHandler,
    BackoffStrategy,
    ExponentialBackoffOptions,
    RetryOptions,
} from '@pearl-framework/queue'

// ─── Mail ─────────────────────────────────────────────────────────────────────
export {
    Mailable,
    Mailer,
    SmtpTransport,
    LogTransport,
    ArrayTransport,
    SesTransport,
    MailServiceProvider,
} from '@pearl-framework/mail'
export type {
    MailerConfig,
    SendBulkOptions,
    BulkSendResult,
    MailServiceConfig,
    MailDriver,
    MailTransport,
    SmtpConfig,
    SesConfig,
    MailAddress,
    MailEnvelope,
    MailContent,
    BuiltMail,
} from '@pearl-framework/mail'

// ─── Database ─────────────────────────────────────────────────────────────────
export {
    DatabaseManager,
    Model,
    Migrator,
    DatabaseServiceProvider,
    // Drizzle column helpers — re-exported for convenience
    pgTable,
    serial,
    varchar,
    text,
    boolean,
    integer,
    bigserial,
    bigint,
    timestamp,
    date,
    jsonb,
    uuid,
    numeric,
    index,
    uniqueIndex,
    // Query operators
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
    sql,
    count,
    asc,
    desc,
} from '@pearl-framework/database'
export type {
    DatabaseConfig,
    DatabaseDriver,
    PostgresConfig,
    MysqlConfig,
    SqliteConfig,
    MigratorOptions,
} from '@pearl-framework/database'