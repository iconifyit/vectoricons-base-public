# VectorIcons Infrastructure Overview

> **Note:** This is a curated subset of the service-oriented architecture backend for VectorIcons, a multi-vendor marketplace for SVG icons & illustrations, shared for portfolio purposes. It is not runnable as-is due to removed infrastructure dependencies (authentication layers, payment processing, deployment configurations, and proprietary database connections). This repository demonstrates architecture, code quality, testing practices, and systems thinking.

## Overview

VectorIcons is a production multi-vendor marketplace for vector icons and illustrations, built as a distributed system across multiple specialized services. This portfolio showcases the service-oriented architecture (SOA) backend layer, demonstrating Staff/Principal Engineer capabilities in systems design, performance engineering, and cloud-native architecture.

**Key Highlights:**
- **750,000+** vector assets managed
- **14M+** database records
- **90%+** test coverage with contract-based testing
- **16x performance improvement** in batch processing (45 minutes vs 11.5 days estimated)
- Production-ready with comprehensive observability and error handling

## Table of Contents

- [VectorIcons Infrastructure Overview](#vectoricons-infrastructure-overview)
  - [Overview](#overview)
  - [Table of Contents](#table-of-contents)
  - [Documentation Sections](#documentation-sections)
    - [Architecture \& Design](#architecture--design)
    - [Core Infrastructure](#core-infrastructure)
    - [Cursor Pagination](#cursor-pagination)
    - [Caching Layer](#caching-layer)
    - [Event System](#event-system)
    - [Access Control](#access-control)
    - [AWS Integration](#aws-integration)
    - [Products Domain](#products-domain)
    - [Images Domain](#images-domain)
    - [Carts Domain](#carts-domain)
    - [Orders Domain](#orders-domain)
    - [Transactions Domain](#transactions-domain)
    - [Downloads Domain](#downloads-domain)
    - [Favorites Domain](#favorites-domain)
    - [HTTP API Layer](#http-api-layer)
  - [Additional Resources](#additional-resources)
    - [Related Documentation](#related-documentation)
    - [Blog Posts](#blog-posts)
    - [Professional Profile](#professional-profile)

## Documentation Sections

### Architecture & Design

Comprehensive architectural documentation including the complete system architecture and key architectural decision records (ADRs).

- **[System Architecture](ECOSYSTEM.html)** - Complete multi-service ecosystem overview with architecture diagrams
- **[ADR-001: Service-Oriented Architecture](decisions/ADR-001-service-oriented-architecture.html)** - Why SOA, trade-offs, and implementation patterns
- **[ADR-002: Mixin Pattern](decisions/ADR-002-mixin-pattern.html)** - Capability composition without inheritance
- **[ADR-003: Event-Driven Architecture](decisions/ADR-003-event-driven-architecture.html)** - Decoupling through events
- **[ADR-004: Contract-Based Testing](decisions/ADR-004-contract-based-testing.html)** - Ensuring consistency across 78 modules
- **[ADR-005: Entity Immutability](decisions/ADR-005-entity-immutability.html)** - Preventing accidental mutations

### Core Infrastructure

Foundation classes that all services extend. Demonstrates DRY principles and template pattern implementation.

- **BaseService** - Abstract service with shared CRUD operations, caching, events, and observability
- **BaseRepository** - Database abstraction with Objection.js ORM
- **BaseEntity** - Immutable domain entities with validation

### Cursor Pagination

High-performance pagination for large datasets using cursor-based approach instead of offset-based.

- **CursorEncoder** - Encodes/decodes pagination cursors
- **withCursorPagination** - Repository mixin for cursor support
- **cursorPaginate** - Helper function for paginated queries

### Caching Layer

Pluggable caching with multiple backend adapters (Redis, in-memory) and automatic cache invalidation.

- **CacheService** - Abstract cache interface
- **RedisCacheAdapter** - Production Redis implementation
- **NodeCacheAdapter** - Development in-memory cache

### Event System

Domain events for observability, audit trails, and decoupled side effects. Supports in-memory and Redis pub/sub.

- **EventBus** - Central event dispatcher
- **Event** - Event value objects
- **Adapters** - Memory and Redis implementations

### Access Control

Role-based access control (RBAC) with fine-grained permissions.

- **AccessControlService** - Permission checking and enforcement

### AWS Integration

AWS service integrations for cloud-native operations.

- **S3Service** - Object storage operations
- **SNSService** - Pub/sub notifications
- **SQSService** - Queue management

### Products Domain

Core product management including icons, illustrations, sets, families, and taxonomies.

**Entities:** Icons, Illustrations, Sets, Families, Categories, Tags, Styles, Product Types, Subscription Plans

### Images Domain

Image processing, storage, and metadata management with multiple format support (PNG, WebP, SVG).

**Services:** ImageService, ImageTypeService, ImageProcessorService, PreviewService

### Carts Domain

Shopping cart management with atomic operations and transaction safety.

**Entities:** Cart, CartItem

### Orders Domain

Order processing and fulfillment tracking.

**Entities:** Order, OrderItem

### Transactions Domain

Financial transaction tracking with comprehensive audit trail and multiple payment types.

**Entities:** Transaction, TransactionItem, TransactionType, TransactionCategory, PaymentType

### Downloads Domain

Download tracking and analytics for user activity monitoring.

**Entities:** Download

### Favorites Domain

User favorites/wishlist management.

**Entities:** Favorite

### HTTP API Layer

RESTful API built on Fastify with factory pattern for rapid endpoint creation, schema validation, and consistent error handling.

**Components:**
- **Plugins** - Route implementations for each domain (Icons, Families, Sets, Categories, Tags, Images)
- **Factory Methods** - Reusable route generators (list, getItem, createItem, patchItem, deleteItem)
- **Schemas** - JSON Schema validation for all endpoints

## Additional Resources

### Related Documentation

- **[Complete README](README.md)** - Detailed technical implementation guide
- **[GitHub Repository](https://github.com/iconifyit/vectoricons-base-public)** - Full source code

### Blog Posts

- **[Building a Multi-Vendor Marketplace: Architecture Lessons](https://sketchandbuild.com/posts/aws-cloud-architecture-for-multivendor-marketplace)** - Systems design insights
- **[16x Performance Improvement with Go Concurrency](https://sketchandbuild.com/posts/concurrency-model-comparison)** - Real-world optimization case study
- **Contract-Based Testing at Scale** - (Coming Soon) Maintaining consistency across 78 modules

### Professional Profile

- **[LinkedIn](https://www.linkedin.com/in/scott-lewis-full-stack)** - Connect with me professionally
- **[GitHub](https://github.com/iconifyit)** - More open source projects

---

**Developer:** Scott Lewis
**Technology Stack:** Node.js, Express.js, PostgreSQL, AWS, Go, React/Next.js
**Documentation Generated:** 2025-10-18
