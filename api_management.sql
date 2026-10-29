/*
===============================================================================
DEVELOPER API MANAGEMENT & USAGE METERING PLATFORM  (MySQL 8.0.16+)
===============================================================================

Relational implementation of the Chen ER diagram.

ER -> RELATIONAL MAPPING SUMMARY
--------------------------------
STRONG ENTITIES (own primary key)
    roles, users, organizations, apis, pricing_plans, api_pricing,
    subscriptions, api_keys, usage_records, invoices, api_key_audit

WEAK ENTITIES (double rectangle) - identified through an IDENTIFYING
relationship (double diamond). PK = owner's PK + partial key (dashed underline)

    api_versions   owner: apis           ("has version")
        PK = (api_id, version_name)                 partial key: version_name

    api_endpoints  owner: api_versions   ("exposes")
        PK = (api_id, version_name, http_method, path)
                                                    partial key: http_method + path
        The owner's whole composite PK is carried down, so the endpoint
        is also (transitively) identified by its API.

    invoice_items  owner: invoices       ("contains")
        PK = (invoice_id, invoice_item_id)          partial key: invoice_item_id
        invoice_item_id is the line number inside one invoice (1, 2, 3 ...).

    Foreign keys of weak entities use ON DELETE CASCADE / ON UPDATE CASCADE:
    a weak entity cannot exist without its owner.

MANY-TO-MANY RELATIONSHIPS (diamonds with attributes)
    "member of"     users <-> organizations   -> organization_members
    "has access to" organizations <-> apis    -> api_access

MULTIVALUED ATTRIBUTES (double ellipse) - each becomes its own table whose PK
is (owner PK, value):
    users.phone_number      -> user_phone_numbers
    apis.tag                -> api_tags
    api_keys.scope          -> api_key_scopes
    pricing_plans.feature   -> plan_features

TOTAL PARTICIPATION (double line) -> the foreign key is NOT NULL
PARTIAL PARTICIPATION (single line) -> the foreign key is nullable
    (only api_key_audit.api_key_id, which is ON DELETE SET NULL)

NOTES
    - MySQL 8.0.16+ is required for enforced CHECK constraints.
    - Passwords and API keys must be stored as hashes; the values below are
      placeholders.
===============================================================================
*/

CREATE DATABASE IF NOT EXISTS api_management
    CHARACTER SET utf8mb4;

USE api_management;


/*
===============================================================================
1. CLEANUP  (development only - never run on a database holding real data)
===============================================================================
*/

SET FOREIGN_KEY_CHECKS = 0;

DROP VIEW IF EXISTS organization_billing_summary;
DROP VIEW IF EXISTS monthly_api_usage;
DROP VIEW IF EXISTS api_usage_summary;

DROP FUNCTION  IF EXISTS calculate_usage_cost;
DROP FUNCTION  IF EXISTS calculate_billable_requests;
DROP PROCEDURE IF EXISTS refresh_invoice_total;

DROP TABLE IF EXISTS plan_features;
DROP TABLE IF EXISTS api_key_scopes;
DROP TABLE IF EXISTS api_tags;
DROP TABLE IF EXISTS user_phone_numbers;
DROP TABLE IF EXISTS api_key_audit;
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS usage_records;
DROP TABLE IF EXISTS api_access;
DROP TABLE IF EXISTS api_keys;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS api_pricing;
DROP TABLE IF EXISTS pricing_plans;
DROP TABLE IF EXISTS api_endpoints;
DROP TABLE IF EXISTS api_versions;
DROP TABLE IF EXISTS apis;
DROP TABLE IF EXISTS organization_members;
DROP TABLE IF EXISTS organizations;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;


/*
===============================================================================
2. ROLES                                              (strong entity)
===============================================================================
Relationship: roles 1 ---- N users   ("assigned to")
===============================================================================
*/

CREATE TABLE roles (
    role_id     BIGINT      NOT NULL AUTO_INCREMENT,
    role_name   VARCHAR(50) NOT NULL,
    description TEXT,

    PRIMARY KEY (role_id),
    UNIQUE KEY uq_roles_name (role_name)
) ENGINE = InnoDB;


/*
===============================================================================
3. USERS                                              (strong entity)
===============================================================================
"assigned to": every user has exactly one role  -> role_id NOT NULL
(total participation of USERS)
===============================================================================
*/

CREATE TABLE users (
    user_id       BIGINT       NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash TEXT         NOT NULL,
    role_id       BIGINT       NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id),
    UNIQUE KEY uq_users_email (email),

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles (role_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB;


/*
===============================================================================
4. USER PHONE NUMBERS            (multivalued attribute of USERS)
===============================================================================
A user can have many phone numbers -> separate table.
PK = (user_id, phone_number): the owner's PK + the attribute value.
===============================================================================
*/

CREATE TABLE user_phone_numbers (
    user_id      BIGINT      NOT NULL,
    phone_number VARCHAR(20) NOT NULL,

    PRIMARY KEY (user_id, phone_number),

    CONSTRAINT fk_user_phone_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;


/*
===============================================================================
5. ORGANIZATIONS                                      (strong entity)
===============================================================================
*/

CREATE TABLE organizations (
    organization_id BIGINT       NOT NULL AUTO_INCREMENT,
    name            VARCHAR(150) NOT NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (organization_id),
    UNIQUE KEY uq_organizations_name (name)
) ENGINE = InnoDB;


/*
===============================================================================
6. ORGANIZATION MEMBERS       (M:N relationship "member of" with attributes)
===============================================================================
users M ---- N organizations.  Both sides are partial participation.
Relationship attributes: member_role, joined_at.
===============================================================================
*/

CREATE TABLE organization_members (
    organization_id BIGINT      NOT NULL,
    user_id         BIGINT      NOT NULL,
    member_role     VARCHAR(50) NOT NULL DEFAULT 'DEVELOPER',
    joined_at       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (organization_id, user_id),

    CONSTRAINT fk_org_members_org
        FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_org_members_user
        FOREIGN KEY (user_id) REFERENCES users (user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_member_role
        CHECK (member_role IN ('OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER'))
) ENGINE = InnoDB;


/*
===============================================================================
7. APIS                                               (strong entity)
===============================================================================
"owns": organizations 1 ---- N apis.  Every API has exactly one organization
(total participation of APIS) -> organization_id NOT NULL.
===============================================================================
*/

CREATE TABLE apis (
    api_id          BIGINT       NOT NULL AUTO_INCREMENT,
    organization_id BIGINT       NOT NULL,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    base_url        TEXT         NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (api_id),

    CONSTRAINT fk_apis_organization
        FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_api_status
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'DEPRECATED'))
) ENGINE = InnoDB;


/*
===============================================================================
8. API TAGS                          (multivalued attribute of APIS)
===============================================================================
An API can carry many tags (e.g. 'nlp', 'translation', 'beta').
===============================================================================
*/

CREATE TABLE api_tags (
    api_id BIGINT      NOT NULL,
    tag    VARCHAR(50) NOT NULL,

    PRIMARY KEY (api_id, tag),

    CONSTRAINT fk_api_tags_api
        FOREIGN KEY (api_id) REFERENCES apis (api_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;


/*
===============================================================================
9. API VERSIONS            (WEAK ENTITY, owner = APIS, "has version")
===============================================================================
Identifying relationship: apis 1 ---- N api_versions.

    Primary key  = owner PK  +  partial key
                 = api_id    +  version_name

A version name such as 'v1' only has meaning inside one API, so the version
is identified by the API's key together with its own (partial) key.

version_id is kept as an ordinary attribute of the diagram; it is a surrogate
value (UNIQUE), not the primary key.
===============================================================================
*/

CREATE TABLE api_versions (
    api_id       BIGINT      NOT NULL,          -- owner PK (part of PK + FK)
    version_name VARCHAR(30) NOT NULL,          -- partial key (part of PK)
    version_id   BIGINT      NOT NULL AUTO_INCREMENT,
    release_date DATE        NOT NULL DEFAULT (CURRENT_DATE),
    status       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (api_id, version_name),
    UNIQUE KEY uq_api_versions_version_id (version_id),

    CONSTRAINT fk_versions_api
        FOREIGN KEY (api_id) REFERENCES apis (api_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_version_status
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'DEPRECATED'))
) ENGINE = InnoDB;


/*
===============================================================================
10. API ENDPOINTS      (WEAK ENTITY, owner = API_VERSIONS, "exposes")
===============================================================================
Identifying relationship: api_versions 1 ---- N api_endpoints.

    Primary key  = owner PK               +  partial key
                 = (api_id, version_name) +  (http_method, path)

The whole composite key of the owner (api_id, version_name) is copied into the
child, and the same pair is the composite foreign key. Two endpoints of the
same API version can never share the same method + path.

endpoint_id is kept as an ordinary attribute of the diagram (surrogate,
UNIQUE), not the primary key.
===============================================================================
*/

CREATE TABLE api_endpoints (
    api_id       BIGINT       NOT NULL,         -- owner PK (part of PK + FK)
    version_name VARCHAR(30)  NOT NULL,         -- owner PK (part of PK + FK)
    http_method  VARCHAR(10)  NOT NULL,         -- partial key
    path         VARCHAR(255) NOT NULL,         -- partial key
    endpoint_id  BIGINT       NOT NULL AUTO_INCREMENT,
    description  TEXT,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (api_id, version_name, http_method, path),
    UNIQUE KEY uq_api_endpoints_endpoint_id (endpoint_id),

    CONSTRAINT fk_endpoint_version
        FOREIGN KEY (api_id, version_name)
        REFERENCES api_versions (api_id, version_name)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_http_method
        CHECK (http_method IN
               ('GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'))
) ENGINE = InnoDB;


/*
===============================================================================
11. PRICING PLANS                                     (strong entity)
===============================================================================
*/

CREATE TABLE pricing_plans (
    plan_id               BIGINT        NOT NULL AUTO_INCREMENT,
    plan_name             VARCHAR(100)  NOT NULL,
    monthly_fee           DECIMAL(12,2) NOT NULL DEFAULT 0,
    included_requests     BIGINT        NOT NULL DEFAULT 0,
    rate_limit_per_minute INT           NOT NULL DEFAULT 60,
    created_at            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (plan_id),
    UNIQUE KEY uq_pricing_plans_name (plan_name),

    CONSTRAINT chk_monthly_fee       CHECK (monthly_fee >= 0),
    CONSTRAINT chk_included_requests CHECK (included_requests >= 0),
    CONSTRAINT chk_rate_limit        CHECK (rate_limit_per_minute > 0)
) ENGINE = InnoDB;


/*
===============================================================================
12. PLAN FEATURES                (multivalued attribute of PRICING_PLANS)
===============================================================================
*/

CREATE TABLE plan_features (
    plan_id BIGINT       NOT NULL,
    feature VARCHAR(100) NOT NULL,

    PRIMARY KEY (plan_id, feature),

    CONSTRAINT fk_plan_features_plan
        FOREIGN KEY (plan_id) REFERENCES pricing_plans (plan_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;


/*
===============================================================================
13. API PRICING                                       (strong entity)
===============================================================================
"priced by":  apis          1 ---- N api_pricing   (total for api_pricing)
"defines":    pricing_plans 1 ---- N api_pricing   (total for api_pricing)
===============================================================================
*/

CREATE TABLE api_pricing (
    api_pricing_id    BIGINT        NOT NULL AUTO_INCREMENT,
    api_id            BIGINT        NOT NULL,
    plan_id           BIGINT        NOT NULL,
    price_per_request DECIMAL(12,4) NOT NULL,
    effective_from    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_until   DATETIME      NULL,

    PRIMARY KEY (api_pricing_id),

    CONSTRAINT fk_api_pricing_api
        FOREIGN KEY (api_id) REFERENCES apis (api_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_api_pricing_plan
        FOREIGN KEY (plan_id) REFERENCES pricing_plans (plan_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_price_per_request CHECK (price_per_request >= 0),

    CONSTRAINT chk_pricing_dates
        CHECK (effective_until IS NULL OR effective_until > effective_from)
) ENGINE = InnoDB;


/*
===============================================================================
14. SUBSCRIPTIONS                                     (strong entity)
===============================================================================
"subscribes":  organizations  1 ---- N subscriptions  (total for subscriptions)
"selected in": pricing_plans  1 ---- N subscriptions  (total for subscriptions)
===============================================================================
*/

CREATE TABLE subscriptions (
    subscription_id BIGINT      NOT NULL AUTO_INCREMENT,
    organization_id BIGINT      NOT NULL,
    plan_id         BIGINT      NOT NULL,
    start_date      DATE        NOT NULL,
    end_date        DATE        NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (subscription_id),

    CONSTRAINT fk_subscription_org
        FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_subscription_plan
        FOREIGN KEY (plan_id) REFERENCES pricing_plans (plan_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_subscription_status
        CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED')),

    CONSTRAINT chk_subscription_dates
        CHECK (end_date IS NULL OR end_date >= start_date)
) ENGINE = InnoDB;


/*
===============================================================================
15. API KEYS                                          (strong entity)
===============================================================================
"issues": organizations 1 ---- N api_keys (total for api_keys).
Only the hash of a key is stored, never the key itself.
===============================================================================
*/

CREATE TABLE api_keys (
    api_key_id      BIGINT       NOT NULL AUTO_INCREMENT,
    organization_id BIGINT       NOT NULL,
    key_prefix      VARCHAR(20)  NOT NULL,
    key_hash        VARCHAR(255) NOT NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at      DATETIME     NULL,
    revoked_at      DATETIME     NULL,

    PRIMARY KEY (api_key_id),
    UNIQUE KEY uq_api_keys_hash (key_hash),

    CONSTRAINT fk_api_key_org
        FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_key_expiry
        CHECK (expires_at IS NULL OR expires_at > created_at)
) ENGINE = InnoDB;


/*
===============================================================================
16. API KEY SCOPES                 (multivalued attribute of API_KEYS)
===============================================================================
A key can be limited to several scopes (e.g. 'read', 'write', 'billing').
===============================================================================
*/

CREATE TABLE api_key_scopes (
    api_key_id BIGINT      NOT NULL,
    scope      VARCHAR(50) NOT NULL,

    PRIMARY KEY (api_key_id, scope),

    CONSTRAINT fk_key_scopes_key
        FOREIGN KEY (api_key_id) REFERENCES api_keys (api_key_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB;


/*
===============================================================================
17. API ACCESS            (M:N relationship "has access to" with attributes)
===============================================================================
organizations M ---- N apis.  Both sides are partial participation.
Relationship attributes: granted_at, revoked_at, status.
===============================================================================
*/

CREATE TABLE api_access (
    organization_id BIGINT      NOT NULL,
    api_id          BIGINT      NOT NULL,
    granted_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at      DATETIME    NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    PRIMARY KEY (organization_id, api_id),

    CONSTRAINT fk_api_access_org
        FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_api_access_api
        FOREIGN KEY (api_id) REFERENCES apis (api_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT chk_access_status
        CHECK (status IN ('ACTIVE', 'REVOKED')),

    CONSTRAINT chk_access_dates
        CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
) ENGINE = InnoDB;


/*
===============================================================================
18. USAGE RECORDS                                     (strong entity)
===============================================================================
Three total-participation relationships:
    "incurs"        organizations 1 ---- N usage_records
    "consumed in"   apis          1 ---- N usage_records
    "metered under" subscriptions 1 ---- N usage_records
===============================================================================
*/

CREATE TABLE usage_records (
    usage_id          BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id   BIGINT        NOT NULL,
    api_id            BIGINT        NOT NULL,
    subscription_id   BIGINT        NOT NULL,
    usage_date        DATE          NOT NULL,
    request_count     BIGINT        NOT NULL DEFAULT 0,
    billable_requests BIGINT        NOT NULL DEFAULT 0,
    amount            DECIMAL(12,2) NOT NULL DEFAULT 0,
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (usage_id),

    CONSTRAINT uq_daily_usage
        UNIQUE (organization_id, api_id, subscription_id, usage_date),

    CONSTRAINT fk_usage_org
        FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_usage_api
        FOREIGN KEY (api_id) REFERENCES apis (api_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_usage_subscription
        FOREIGN KEY (subscription_id) REFERENCES subscriptions (subscription_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_request_count CHECK (request_count >= 0),

    CONSTRAINT chk_billable_requests
        CHECK (billable_requests >= 0 AND billable_requests <= request_count),

    CONSTRAINT chk_usage_amount CHECK (amount >= 0)
) ENGINE = InnoDB;


/*
===============================================================================
19. INVOICES                                          (strong entity)
===============================================================================
"billed to":  organizations 1 ---- N invoices  (total for invoices)
"generates":  subscriptions 1 ---- N invoices  (total for invoices)
===============================================================================
*/

CREATE TABLE invoices (
    invoice_id           BIGINT        NOT NULL AUTO_INCREMENT,
    organization_id      BIGINT        NOT NULL,
    subscription_id      BIGINT        NOT NULL,
    billing_period_start DATE          NOT NULL,
    billing_period_end   DATE          NOT NULL,
    subtotal             DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax                  DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount         DECIMAL(12,2) NOT NULL DEFAULT 0,
    status               VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',
    generated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    due_date             DATE          NULL,
    paid_at              DATETIME      NULL,

    PRIMARY KEY (invoice_id),

    CONSTRAINT fk_invoice_org
        FOREIGN KEY (organization_id) REFERENCES organizations (organization_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_invoice_subscription
        FOREIGN KEY (subscription_id) REFERENCES subscriptions (subscription_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_invoice_period   CHECK (billing_period_end >= billing_period_start),
    CONSTRAINT chk_invoice_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_invoice_tax      CHECK (tax >= 0),
    CONSTRAINT chk_invoice_total    CHECK (total_amount >= 0),

    CONSTRAINT chk_invoice_status
        CHECK (status IN ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELLED'))
) ENGINE = InnoDB;


/*
===============================================================================
20. INVOICE ITEMS       (WEAK ENTITY, owner = INVOICES, "contains")
===============================================================================
Identifying relationship: invoices 1 ---- N invoice_items.

    Primary key  = owner PK  +  partial key
                 = invoice_id +  invoice_item_id

invoice_item_id is the line number inside ONE invoice (1, 2, 3 ...). It is
generated per invoice by the trigger trg_invoice_item_number below; if you
insert 0 (the default) the next free line number of that invoice is used.

"billed for": apis 1 ---- N invoice_items (total for invoice_items)
              -> api_id NOT NULL (an ordinary foreign key, not part of the PK).
===============================================================================
*/

CREATE TABLE invoice_items (
    invoice_id      BIGINT        NOT NULL,             -- owner PK (part of PK + FK)
    invoice_item_id INT           NOT NULL DEFAULT 0,   -- partial key (line no.)
    api_id          BIGINT        NOT NULL,
    request_count   BIGINT        NOT NULL,
    unit_price      DECIMAL(12,4) NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,

    PRIMARY KEY (invoice_id, invoice_item_id),

    CONSTRAINT fk_invoice_item_invoice
        FOREIGN KEY (invoice_id) REFERENCES invoices (invoice_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_invoice_item_api
        FOREIGN KEY (api_id) REFERENCES apis (api_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT chk_invoice_item_requests CHECK (request_count >= 0),
    CONSTRAINT chk_invoice_item_price    CHECK (unit_price >= 0),
    CONSTRAINT chk_invoice_item_amount   CHECK (amount >= 0)
) ENGINE = InnoDB;


/*
===============================================================================
21. API KEY AUDIT                                     (strong entity)
===============================================================================
"logged in": api_keys 1 ---- N api_key_audit.
PARTIAL participation of the audit row: api_key_id is nullable and the
foreign key is ON DELETE SET NULL, so the audit history survives even when a
key row is deleted.
===============================================================================
*/

CREATE TABLE api_key_audit (
    audit_id    BIGINT      NOT NULL AUTO_INCREMENT,
    api_key_id  BIGINT      NULL,
    action      VARCHAR(30) NOT NULL,
    action_time DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details     TEXT,

    PRIMARY KEY (audit_id),

    CONSTRAINT fk_audit_api_key
        FOREIGN KEY (api_key_id) REFERENCES api_keys (api_key_id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB;


/*
===============================================================================
22. INDEXES
===============================================================================
Primary keys, UNIQUE constraints and foreign keys already create indexes in
MySQL. The indexes below are additional ones for common lookups.
===============================================================================
*/

CREATE INDEX idx_users_active          ON users (is_active);
CREATE INDEX idx_org_members_user      ON organization_members (user_id);
CREATE INDEX idx_apis_status           ON apis (status);
CREATE INDEX idx_endpoints_method_path ON api_endpoints (http_method, path);
CREATE INDEX idx_api_pricing_api_plan  ON api_pricing (api_id, plan_id);
CREATE INDEX idx_subscriptions_status  ON subscriptions (status);
CREATE INDEX idx_api_keys_prefix       ON api_keys (key_prefix);
CREATE INDEX idx_api_access_status     ON api_access (status);
CREATE INDEX idx_usage_org_date        ON usage_records (organization_id, usage_date);
CREATE INDEX idx_usage_api_date        ON usage_records (api_id, usage_date);
CREATE INDEX idx_usage_date            ON usage_records (usage_date);
CREATE INDEX idx_invoices_status       ON invoices (status);
CREATE INDEX idx_invoices_period       ON invoices (billing_period_start, billing_period_end);
CREATE INDEX idx_invoice_items_api     ON invoice_items (api_id);
CREATE INDEX idx_api_tags_tag          ON api_tags (tag);
CREATE INDEX idx_key_scopes_scope      ON api_key_scopes (scope);


/*
===============================================================================
23. TRIGGERS AND PROCEDURE
===============================================================================
    - users.updated_at / apis.updated_at use ON UPDATE CURRENT_TIMESTAMP in
      the table definitions (no trigger needed in MySQL).
    - trg_invoice_item_number : numbers the lines of each invoice (weak-entity
                                partial key).
    - refresh_invoice_total   : recomputes subtotal and total of an invoice.
    - trg_invoice_items_*     : call the procedure after INSERT/UPDATE/DELETE.
    - trg_api_key_*           : write CREATED / REVOKED rows to api_key_audit.
===============================================================================
*/

DELIMITER $$

-- 23.1 Partial key generator for the weak entity invoice_items
CREATE TRIGGER trg_invoice_item_number
BEFORE INSERT ON invoice_items
FOR EACH ROW
BEGIN
    IF NEW.invoice_item_id IS NULL OR NEW.invoice_item_id = 0 THEN
        SET NEW.invoice_item_id =
            (SELECT COALESCE(MAX(invoice_item_id), 0) + 1
             FROM invoice_items
             WHERE invoice_id = NEW.invoice_id);
    END IF;
END$$


-- 23.2 Invoice total recalculation
CREATE PROCEDURE refresh_invoice_total(IN p_invoice_id BIGINT)
BEGIN
    UPDATE invoices
    SET subtotal     = (SELECT COALESCE(SUM(amount), 0)
                        FROM invoice_items
                        WHERE invoice_id = p_invoice_id),
        total_amount = (SELECT COALESCE(SUM(amount), 0)
                        FROM invoice_items
                        WHERE invoice_id = p_invoice_id) + tax
    WHERE invoice_id = p_invoice_id;
END$$

CREATE TRIGGER trg_invoice_items_ai
AFTER INSERT ON invoice_items
FOR EACH ROW
BEGIN
    CALL refresh_invoice_total(NEW.invoice_id);
END$$

CREATE TRIGGER trg_invoice_items_au
AFTER UPDATE ON invoice_items
FOR EACH ROW
BEGIN
    CALL refresh_invoice_total(NEW.invoice_id);
    IF OLD.invoice_id <> NEW.invoice_id THEN
        CALL refresh_invoice_total(OLD.invoice_id);
    END IF;
END$$

CREATE TRIGGER trg_invoice_items_ad
AFTER DELETE ON invoice_items
FOR EACH ROW
BEGIN
    CALL refresh_invoice_total(OLD.invoice_id);
END$$


-- 23.3 API key audit
CREATE TRIGGER trg_api_key_ai
AFTER INSERT ON api_keys
FOR EACH ROW
BEGIN
    INSERT INTO api_key_audit (api_key_id, action, details)
    VALUES (NEW.api_key_id, 'CREATED', 'API key created');
END$$

CREATE TRIGGER trg_api_key_au
AFTER UPDATE ON api_keys
FOR EACH ROW
BEGIN
    IF OLD.revoked_at IS NULL AND NEW.revoked_at IS NOT NULL THEN
        INSERT INTO api_key_audit (api_key_id, action, details)
        VALUES (NEW.api_key_id, 'REVOKED', 'API key revoked');
    END IF;
END$$

DELIMITER ;


/*
===============================================================================
24. SAMPLE DATA
===============================================================================
*/

INSERT INTO roles (role_name, description) VALUES
    ('ADMIN',     'Platform administrator'),
    ('DEVELOPER', 'API consumer/developer');

INSERT INTO users (name, email, password_hash, role_id) VALUES
    ('System Administrator', 'admin@example.com',
     '$2b$12$example_admin_hash',
     (SELECT role_id FROM roles WHERE role_name = 'ADMIN')),
    ('John Developer', 'john@example.com',
     '$2b$12$example_developer_hash',
     (SELECT role_id FROM roles WHERE role_name = 'DEVELOPER'));

-- multivalued attribute: phone numbers
INSERT INTO user_phone_numbers (user_id, phone_number) VALUES
    ((SELECT user_id FROM users WHERE email = 'admin@example.com'), '+91-9000000001'),
    ((SELECT user_id FROM users WHERE email = 'admin@example.com'), '+91-9000000002'),
    ((SELECT user_id FROM users WHERE email = 'john@example.com'),  '+91-9000000003');

INSERT INTO organizations (name) VALUES
    ('Acme Technologies'),
    ('DevCloud Solutions');

INSERT INTO organization_members (organization_id, user_id, member_role) VALUES
    ((SELECT organization_id FROM organizations WHERE name = 'Acme Technologies'),
     (SELECT user_id FROM users WHERE email = 'admin@example.com'), 'OWNER'),
    ((SELECT organization_id FROM organizations WHERE name = 'Acme Technologies'),
     (SELECT user_id FROM users WHERE email = 'john@example.com'),  'DEVELOPER');

INSERT INTO apis (organization_id, name, description, base_url) VALUES
    ((SELECT organization_id FROM organizations WHERE name = 'Acme Technologies'),
     'Translation API', 'Text translation service', 'https://api.example.com/translate'),
    ((SELECT organization_id FROM organizations WHERE name = 'Acme Technologies'),
     'Image Processing API', 'Image processing service', 'https://api.example.com/image'),
    ((SELECT organization_id FROM organizations WHERE name = 'Acme Technologies'),
     'Report Generation API', 'Generates PDF reports', 'https://api.example.com/reports');

-- multivalued attribute: tags
INSERT INTO api_tags (api_id, tag) VALUES
    ((SELECT api_id FROM apis WHERE name = 'Translation API'),       'nlp'),
    ((SELECT api_id FROM apis WHERE name = 'Translation API'),       'text'),
    ((SELECT api_id FROM apis WHERE name = 'Image Processing API'),  'vision'),
    ((SELECT api_id FROM apis WHERE name = 'Report Generation API'), 'pdf');

-- weak entity: api_versions (PK = api_id + version_name)
INSERT INTO api_versions (api_id, version_name)
SELECT api_id, 'v1' FROM apis;

-- weak entity: api_endpoints (PK = api_id + version_name + http_method + path)
INSERT INTO api_endpoints (api_id, version_name, http_method, path, description)
SELECT a.api_id, 'v1', 'POST', '/translate', 'Translate text'
FROM apis a WHERE a.name = 'Translation API';

INSERT INTO api_endpoints (api_id, version_name, http_method, path, description)
SELECT a.api_id, 'v1', 'POST', '/process', 'Process an image'
FROM apis a WHERE a.name = 'Image Processing API';

INSERT INTO api_endpoints (api_id, version_name, http_method, path, description)
SELECT a.api_id, 'v1', 'POST', '/generate', 'Generate a report'
FROM apis a WHERE a.name = 'Report Generation API';

INSERT INTO pricing_plans (plan_name, monthly_fee, included_requests, rate_limit_per_minute) VALUES
    ('FREE',        0,    1000,    30),
    ('PRO',         999,  50000,   300),
    ('ENTERPRISE',  4999, 1000000, 3000);

-- multivalued attribute: plan features
INSERT INTO plan_features (plan_id, feature) VALUES
    ((SELECT plan_id FROM pricing_plans WHERE plan_name = 'FREE'),       'Community support'),
    ((SELECT plan_id FROM pricing_plans WHERE plan_name = 'PRO'),        'Email support'),
    ((SELECT plan_id FROM pricing_plans WHERE plan_name = 'PRO'),        'Usage dashboard'),
    ((SELECT plan_id FROM pricing_plans WHERE plan_name = 'ENTERPRISE'), 'Dedicated support'),
    ((SELECT plan_id FROM pricing_plans WHERE plan_name = 'ENTERPRISE'), 'SLA 99.99%');

INSERT INTO api_pricing (api_id, plan_id, price_per_request) VALUES
    ((SELECT api_id FROM apis WHERE name = 'Translation API'),
     (SELECT plan_id FROM pricing_plans WHERE plan_name = 'FREE'), 0.50),
    ((SELECT api_id FROM apis WHERE name = 'Translation API'),
     (SELECT plan_id FROM pricing_plans WHERE plan_name = 'PRO'),  0.30),
    ((SELECT api_id FROM apis WHERE name = 'Image Processing API'),
     (SELECT plan_id FROM pricing_plans WHERE plan_name = 'FREE'), 2.00),
    ((SELECT api_id FROM apis WHERE name = 'Image Processing API'),
     (SELECT plan_id FROM pricing_plans WHERE plan_name = 'PRO'),  1.50),
    ((SELECT api_id FROM apis WHERE name = 'Report Generation API'),
     (SELECT plan_id FROM pricing_plans WHERE plan_name = 'FREE'), 5.00),
    ((SELECT api_id FROM apis WHERE name = 'Report Generation API'),
     (SELECT plan_id FROM pricing_plans WHERE plan_name = 'PRO'),  3.50);

INSERT INTO subscriptions (organization_id, plan_id, start_date, status) VALUES
    ((SELECT organization_id FROM organizations WHERE name = 'Acme Technologies'),
     (SELECT plan_id FROM pricing_plans WHERE plan_name = 'PRO'),
     CURDATE(), 'ACTIVE');

INSERT INTO api_access (organization_id, api_id)
SELECT o.organization_id, a.api_id
FROM organizations o
JOIN apis a ON a.organization_id = o.organization_id
WHERE o.name = 'Acme Technologies';

-- the audit trigger writes a CREATED row automatically
INSERT INTO api_keys (organization_id, key_prefix, key_hash, expires_at) VALUES
    ((SELECT organization_id FROM organizations WHERE name = 'Acme Technologies'),
     'ak_live_abc', 'example_secure_hash_value',
     CURRENT_TIMESTAMP + INTERVAL 1 YEAR);

-- multivalued attribute: key scopes
INSERT INTO api_key_scopes (api_key_id, scope) VALUES
    ((SELECT api_key_id FROM api_keys WHERE key_prefix = 'ak_live_abc'), 'read'),
    ((SELECT api_key_id FROM api_keys WHERE key_prefix = 'ak_live_abc'), 'write');

INSERT INTO usage_records
    (organization_id, api_id, subscription_id, usage_date,
     request_count, billable_requests, amount)
VALUES
    ((SELECT organization_id FROM organizations WHERE name = 'Acme Technologies'),
     (SELECT api_id FROM apis WHERE name = 'Translation API'),
     (SELECT subscription_id FROM subscriptions
      WHERE status = 'ACTIVE'
        AND organization_id = (SELECT organization_id FROM organizations
                               WHERE name = 'Acme Technologies')
      LIMIT 1),
     CURDATE(), 2000, 1000, 300);


/*
===============================================================================
25. VIEWS
===============================================================================
*/

CREATE OR REPLACE VIEW api_usage_summary AS
SELECT
    a.api_id,
    a.name                  AS api_name,
    SUM(u.request_count)    AS total_requests,
    SUM(u.billable_requests) AS total_billable_requests,
    SUM(u.amount)           AS total_amount,
    AVG(u.amount)           AS average_usage_amount
FROM usage_records u
JOIN apis a ON u.api_id = a.api_id
GROUP BY a.api_id, a.name;


CREATE OR REPLACE VIEW monthly_api_usage AS
SELECT
    u.organization_id,
    o.name                   AS organization_name,
    u.api_id,
    a.name                   AS api_name,
    DATE_FORMAT(u.usage_date, '%Y-%m-01') AS month,
    SUM(u.request_count)     AS total_requests,
    SUM(u.billable_requests) AS billable_requests,
    SUM(u.amount)            AS total_amount
FROM usage_records u
JOIN organizations o ON u.organization_id = o.organization_id
JOIN apis a          ON u.api_id = a.api_id
GROUP BY u.organization_id, o.name, u.api_id, a.name,
         DATE_FORMAT(u.usage_date, '%Y-%m-01');


CREATE OR REPLACE VIEW organization_billing_summary AS
SELECT
    o.organization_id,
    o.name                              AS organization_name,
    COUNT(DISTINCT i.invoice_id)        AS invoice_count,
    COALESCE(SUM(i.subtotal), 0)        AS subtotal,
    COALESCE(SUM(i.tax), 0)             AS tax,
    COALESCE(SUM(i.total_amount), 0)    AS total_billed
FROM organizations o
LEFT JOIN invoices i ON o.organization_id = i.organization_id
GROUP BY o.organization_id, o.name;


/*
===============================================================================
26. STORED FUNCTIONS
===============================================================================
calculate_usage_cost:
    active subscription -> plan allowance -> current API price ->
    (requests - included) x price.
calculate_billable_requests:
    requests beyond the plan allowance (never negative).
===============================================================================
*/

DELIMITER $$

CREATE FUNCTION calculate_usage_cost(
    p_organization_id BIGINT,
    p_api_id          BIGINT,
    p_request_count   BIGINT
)
RETURNS DECIMAL(12,2)
READS SQL DATA
BEGIN
    DECLARE v_plan_id           BIGINT        DEFAULT NULL;
    DECLARE v_included_requests BIGINT        DEFAULT NULL;
    DECLARE v_price             DECIMAL(12,4) DEFAULT NULL;
    DECLARE v_billable_requests BIGINT;

    SELECT plan_id INTO v_plan_id
    FROM subscriptions
    WHERE organization_id = p_organization_id
      AND status = 'ACTIVE'
    ORDER BY start_date DESC
    LIMIT 1;

    IF v_plan_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No active subscription found';
    END IF;

    SELECT included_requests INTO v_included_requests
    FROM pricing_plans
    WHERE plan_id = v_plan_id;

    SELECT price_per_request INTO v_price
    FROM api_pricing
    WHERE api_id = p_api_id
      AND plan_id = v_plan_id
      AND effective_from <= CURRENT_TIMESTAMP
      AND (effective_until IS NULL OR effective_until > CURRENT_TIMESTAMP)
    ORDER BY effective_from DESC
    LIMIT 1;

    IF v_price IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No pricing found for this API and plan';
    END IF;

    SET v_billable_requests = GREATEST(0, p_request_count - v_included_requests);

    RETURN ROUND(v_billable_requests * v_price, 2);
END$$


CREATE FUNCTION calculate_billable_requests(
    p_organization_id BIGINT,
    p_request_count   BIGINT
)
RETURNS BIGINT
READS SQL DATA
BEGIN
    DECLARE v_included_requests BIGINT DEFAULT NULL;

    SELECT pp.included_requests INTO v_included_requests
    FROM subscriptions s
    JOIN pricing_plans pp ON s.plan_id = pp.plan_id
    WHERE s.organization_id = p_organization_id
      AND s.status = 'ACTIVE'
    ORDER BY s.start_date DESC
    LIMIT 1;

    IF v_included_requests IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No active subscription found';
    END IF;

    RETURN GREATEST(0, p_request_count - v_included_requests);
END$$

DELIMITER ;


/*
===============================================================================
27. INVOICE + INVOICE ITEMS (transaction, weak-entity numbering, triggers)
===============================================================================
*/

START TRANSACTION;

INSERT INTO invoices
    (organization_id, subscription_id, billing_period_start,
     billing_period_end, tax, status, due_date)
VALUES
    ((SELECT organization_id FROM organizations WHERE name = 'Acme Technologies'),
     (SELECT subscription_id FROM subscriptions
      WHERE status = 'ACTIVE'
        AND organization_id = (SELECT organization_id FROM organizations
                               WHERE name = 'Acme Technologies')
      LIMIT 1),
     DATE_FORMAT(CURDATE(), '%Y-%m-01'),
     LAST_DAY(CURDATE()),
     0,
     'DRAFT',
     CURDATE() + INTERVAL 30 DAY);

COMMIT;

-- MySQL does not allow a statement to read a table (invoices) that a trigger
-- fired by the same statement updates, so the invoice id goes into a variable.
SET @new_invoice_id = (SELECT MAX(invoice_id) FROM invoices);

-- invoice_item_id is omitted (defaults to 0) -> trigger assigns 1, then 2
INSERT INTO invoice_items (invoice_id, api_id, request_count, unit_price, amount)
VALUES
    (@new_invoice_id,
     (SELECT api_id FROM apis WHERE name = 'Translation API'),
     1000, 0.30, 300.00);

INSERT INTO invoice_items (invoice_id, api_id, request_count, unit_price, amount)
VALUES
    (@new_invoice_id,
     (SELECT api_id FROM apis WHERE name = 'Image Processing API'),
     500, 1.50, 750.00);


/*
===============================================================================
28. QUERIES
===============================================================================
*/

-- 28.1 Basic selects
SELECT * FROM roles;
SELECT * FROM users;
SELECT * FROM organizations;
SELECT * FROM apis;
SELECT * FROM pricing_plans;

-- 28.2 Weak entity join: API -> version -> endpoint (composite key join)
SELECT a.name AS api_name,
       av.version_name,
       ae.http_method,
       ae.path,
       ae.description
FROM api_endpoints ae
JOIN api_versions av
     ON  ae.api_id       = av.api_id
     AND ae.version_name = av.version_name
JOIN apis a
     ON av.api_id = a.api_id
ORDER BY a.name;

-- 28.3 Weak entity join: invoice -> numbered items
SELECT i.invoice_id,
       ii.invoice_item_id AS line_no,
       a.name             AS api_name,
       ii.request_count,
       ii.unit_price,
       ii.amount
FROM invoices i
JOIN invoice_items ii ON ii.invoice_id = i.invoice_id
JOIN apis a           ON a.api_id = ii.api_id
ORDER BY i.invoice_id, ii.invoice_item_id;

-- 28.4 Trigger-calculated invoice totals
SELECT invoice_id, subtotal, tax, total_amount, status
FROM invoices
ORDER BY invoice_id DESC;

-- 28.5 Multivalued attributes
SELECT u.name, GROUP_CONCAT(p.phone_number ORDER BY p.phone_number SEPARATOR ', ') AS phone_numbers
FROM users u
LEFT JOIN user_phone_numbers p ON p.user_id = u.user_id
GROUP BY u.user_id, u.name;

SELECT a.name AS api_name, GROUP_CONCAT(t.tag ORDER BY t.tag SEPARATOR ', ') AS tags
FROM apis a
LEFT JOIN api_tags t ON t.api_id = a.api_id
GROUP BY a.api_id, a.name;

SELECT pp.plan_name, GROUP_CONCAT(pf.feature ORDER BY pf.feature SEPARATOR ', ') AS features
FROM pricing_plans pp
LEFT JOIN plan_features pf ON pf.plan_id = pp.plan_id
GROUP BY pp.plan_id, pp.plan_name;

SELECT k.key_prefix, GROUP_CONCAT(s.scope ORDER BY s.scope SEPARATOR ', ') AS scopes
FROM api_keys k
LEFT JOIN api_key_scopes s ON s.api_key_id = k.api_key_id
GROUP BY k.api_key_id, k.key_prefix;

-- 28.6 Organizations, subscriptions and plans
SELECT o.organization_id, o.name AS organization_name,
       p.plan_name, s.start_date, s.end_date, s.status
FROM organizations o
JOIN subscriptions s  ON o.organization_id = s.organization_id
JOIN pricing_plans p  ON s.plan_id = p.plan_id;

-- 28.7 Organization -> API access (M:N)
SELECT o.name AS organization_name, a.name AS api_name, aa.status AS access_status
FROM api_access aa
JOIN organizations o ON aa.organization_id = o.organization_id
JOIN apis a          ON aa.api_id = a.api_id
ORDER BY o.name, a.name;

-- 28.8 GROUP BY / HAVING / aggregates
SELECT a.name AS api_name, SUM(u.request_count) AS total_requests
FROM usage_records u
JOIN apis a ON u.api_id = a.api_id
GROUP BY a.api_id, a.name
ORDER BY total_requests DESC;

SELECT a.name AS api_name, SUM(u.request_count) AS total_requests
FROM usage_records u
JOIN apis a ON u.api_id = a.api_id
GROUP BY a.api_id, a.name
HAVING SUM(u.request_count) > 1000;

SELECT COUNT(*)                 AS total_usage_records,
       SUM(request_count)       AS total_requests,
       SUM(billable_requests)   AS total_billable_requests,
       SUM(amount)              AS total_usage_amount,
       AVG(amount)              AS average_usage_amount,
       MIN(amount)              AS minimum_usage_amount,
       MAX(amount)              AS maximum_usage_amount
FROM usage_records;

-- 28.9 Subqueries
SELECT name
FROM organizations
WHERE organization_id IN (
    SELECT organization_id
    FROM subscriptions
    WHERE plan_id = (SELECT plan_id FROM pricing_plans WHERE plan_name = 'PRO')
);

SELECT a.name AS api_name, ap.price_per_request
FROM api_pricing ap
JOIN apis a ON ap.api_id = a.api_id
WHERE ap.price_per_request > (SELECT AVG(price_per_request) FROM api_pricing);

-- 28.10 ORDER BY + LIMIT
SELECT a.name AS api_name, ap.price_per_request
FROM api_pricing ap
JOIN apis a ON ap.api_id = a.api_id
ORDER BY ap.price_per_request DESC
LIMIT 5;

-- 28.11 API key status
SELECT o.name AS organization_name, ak.key_prefix, ak.created_at,
       ak.expires_at, ak.revoked_at,
       CASE
           WHEN ak.revoked_at IS NOT NULL THEN 'REVOKED'
           WHEN ak.expires_at IS NOT NULL
                AND ak.expires_at < CURRENT_TIMESTAMP THEN 'EXPIRED'
           ELSE 'ACTIVE'
       END AS key_status
FROM api_keys ak
JOIN organizations o ON ak.organization_id = o.organization_id;

-- 28.12 Revenue and billing
SELECT a.name AS api_name, SUM(ii.amount) AS revenue
FROM invoice_items ii
JOIN apis a ON ii.api_id = a.api_id
GROUP BY a.api_id, a.name
ORDER BY revenue DESC;

SELECT DATE_FORMAT(generated_at, '%Y-%m-01') AS month,
       SUM(total_amount) AS revenue
FROM invoices
WHERE status IN ('ISSUED', 'PAID', 'OVERDUE')
GROUP BY DATE_FORMAT(generated_at, '%Y-%m-01')
ORDER BY month DESC;

-- 28.13 NOT EXISTS
SELECT o.organization_id, o.name
FROM organizations o
WHERE NOT EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.organization_id = o.organization_id AND s.status = 'ACTIVE'
);

SELECT a.api_id, a.name
FROM apis a
WHERE NOT EXISTS (
    SELECT 1 FROM api_access aa
    WHERE aa.api_id = a.api_id AND aa.status = 'ACTIVE'
);

-- 28.14 Views
SELECT * FROM api_usage_summary ORDER BY total_requests DESC;
SELECT * FROM monthly_api_usage ORDER BY month DESC;
SELECT * FROM organization_billing_summary ORDER BY total_billed DESC;

-- 28.15 Functions
SELECT calculate_usage_cost(
           (SELECT organization_id FROM organizations WHERE name = 'Acme Technologies'),
           (SELECT api_id FROM apis WHERE name = 'Translation API'),
           5000) AS calculated_cost;

SELECT calculate_billable_requests(
           (SELECT organization_id FROM organizations WHERE name = 'Acme Technologies'),
           5000) AS billable_requests;


/*
===============================================================================
29. UPDATE / DELETE DEMONSTRATIONS
===============================================================================
*/

-- Revoke an API key -> trigger writes a REVOKED audit row
UPDATE api_keys SET revoked_at = CURRENT_TIMESTAMP WHERE key_prefix = 'ak_live_abc';

SELECT audit_id, api_key_id, action, action_time, details
FROM api_key_audit
ORDER BY audit_id DESC;

-- INSERT / UPDATE / DELETE inside a transaction that is rolled back
START TRANSACTION;

INSERT INTO organizations (name) VALUES ('DML Demonstration Organization');

UPDATE organizations
SET name = 'Updated DML Demonstration Organization'
WHERE name = 'DML Demonstration Organization';

DELETE FROM organizations
WHERE name = 'Updated DML Demonstration Organization';

ROLLBACK;

-- Weak-entity cascade demonstration (rolled back): deleting an API removes
-- its versions and endpoints automatically. Rows 2-3 show the cascade.
START TRANSACTION;

SELECT COUNT(*) AS versions_before  FROM api_versions;
SELECT COUNT(*) AS endpoints_before FROM api_endpoints;

DELETE FROM api_pricing;
DELETE FROM api_access;
DELETE FROM api_tags;
DELETE FROM apis WHERE name = 'Report Generation API';

SELECT COUNT(*) AS versions_after   FROM api_versions;
SELECT COUNT(*) AS endpoints_after  FROM api_endpoints;

ROLLBACK;


/*
===============================================================================
30. FINAL DATABASE CHECK
===============================================================================
*/

SELECT 'roles' AS table_name, COUNT(*) AS row_count FROM roles
UNION ALL SELECT 'users',                COUNT(*) FROM users
UNION ALL SELECT 'user_phone_numbers',   COUNT(*) FROM user_phone_numbers
UNION ALL SELECT 'organizations',        COUNT(*) FROM organizations
UNION ALL SELECT 'organization_members', COUNT(*) FROM organization_members
UNION ALL SELECT 'apis',                 COUNT(*) FROM apis
UNION ALL SELECT 'api_tags',             COUNT(*) FROM api_tags
UNION ALL SELECT 'api_versions',         COUNT(*) FROM api_versions
UNION ALL SELECT 'api_endpoints',        COUNT(*) FROM api_endpoints
UNION ALL SELECT 'pricing_plans',        COUNT(*) FROM pricing_plans
UNION ALL SELECT 'plan_features',        COUNT(*) FROM plan_features
UNION ALL SELECT 'api_pricing',          COUNT(*) FROM api_pricing
UNION ALL SELECT 'subscriptions',        COUNT(*) FROM subscriptions
UNION ALL SELECT 'api_keys',             COUNT(*) FROM api_keys
UNION ALL SELECT 'api_key_scopes',       COUNT(*) FROM api_key_scopes
UNION ALL SELECT 'api_access',           COUNT(*) FROM api_access
UNION ALL SELECT 'usage_records',        COUNT(*) FROM usage_records
UNION ALL SELECT 'invoices',             COUNT(*) FROM invoices
UNION ALL SELECT 'invoice_items',        COUNT(*) FROM invoice_items
UNION ALL SELECT 'api_key_audit',        COUNT(*) FROM api_key_audit;

/*
===============================================================================
END OF SQL SCRIPT
===============================================================================
*/
