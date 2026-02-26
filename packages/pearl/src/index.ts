// ─── Core ─────────────────────────────────────────────────────────────────────
export {
    Application,
    Container,
    ServiceProvider,
    Config,
    env,
} from '@pearl-framework/core'
export type {
    ApplicationOptions,
    IContainer,
    BindingToken,
} from '@pearl-framework/core'

// ─── HTTP ─────────────────────────────────────────────────────────────────────
export {
    HttpKernel,
    Router,
    HttpContext,
    Request,
    Response,
} from '@pearl-framework/http'
export type {
    RouteHandler,
    HttpMethod,
    Middleware,
} from '@pearl-framework/http'

// ─── Validation ───────────────────────────────────────────────────────────────
export {
    FormRequest,
    ValidationException,
} from '@pearl-framework/validate'

// ─── Auth ─────────────────────────────────────────────────────────────────────
export {
    AuthManager,
    JwtGuard,
    ApiTokenGuard,
    Hash,
    Authenticate,
    OptionalAuth,
} from '@pearl-framework/auth'
export type {
    AuthUser,
    UserProvider,
    AuthGuard,
} from '@pearl-framework/auth'

// ─── Events ───────────────────────────────────────────────────────────────────
export {
    Event,
    Listener,
    EventDispatcher,
} from '@pearl-framework/events'

// ─── Queue ────────────────────────────────────────────────────────────────────
export {
    Job,
    QueueManager,
    QueueWorker,
} from '@pearl-framework/queue'

// ─── Mail ─────────────────────────────────────────────────────────────────────
export {
    Mailable,
    Mailer,
} from '@pearl-framework/mail'

// ─── Database ─────────────────────────────────────────────────────────────────
export {
    DatabaseManager,
    Model,
    // Drizzle column helpers — re-exported for convenience
    pgTable,
    serial,
    varchar,
    text,
    boolean,
    integer,
    timestamp,
    eq,
    and,
    or,
    not,
} from '@pearl-framework/database'