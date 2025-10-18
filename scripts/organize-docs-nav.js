/**
 * Post-process JSDoc HTML to organize navigation by modules
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Define module organization
const modules = {
  'Core Infrastructure': ['BaseService', 'BaseRepository', 'BaseEntity', 'RawBaseService'],
  'Cursor Pagination': ['CursorEncoder', 'withCursorPagination', 'cursorPaginate', 'RawIconRepository'],
  'Caching Layer': ['CacheService', 'RedisCacheAdapter', 'NodeCacheAdapter', 'CacheAdapter'],
  'Event System': ['EventBus', 'Event', 'BaseEventBusAdapter', 'MemoryEventBusAdapter', 'RedisEventBusAdapter'],
  'Access Control': ['AccessControlService'],
  'AWS Integration': ['S3Service', 'SNSService', 'SQSService'],
  'Products Domain': [
    'IconService', 'IllustrationService', 'SetService', 'FamilyService',
    'CategoryService', 'TagService', 'StyleEntity', 'ProductTypeEntity',
    'ProductTypeService', 'ProductTypeRepository', 'SubscriptionPlanService',
    'SubscriptionPlanRepository'
  ],
  'Images Domain': ['ImageService', 'ImageTypeService', 'ImageProcessorService', 'PreviewService'],
  'Carts Domain': ['CartService', 'CartEntity', 'CartRepository', 'CartItemService', 'CartItemEntity', 'CartItemRepository'],
  'Orders Domain': ['OrderService', 'OrderEntity', 'OrderRepository', 'OrderItemService', 'OrderItemEntity', 'OrderItemRepository'],
  'Transactions Domain': [
    'TransactionService', 'TransactionRepository', 'TransactionEntity',
    'PaymentTypeRepository', 'TransactionCategoryService', 'TransactionCategoryRepository',
    'TransactionItemService', 'TransactionItemRepository', 'TransactionTypeService',
    'TransactionTypeRepository', 'TransactionsViewService', 'TransactionsViewRepository'
  ],
  'Downloads Domain': ['DownloadService', 'DownloadEntity', 'DownloadRepository'],
  'Favorites Domain': ['FavoriteService', 'FavoriteRepository', 'FavoriteEntity']
};

function organizeNavigation(htmlContent) {
  // Find the navigation section
  const navMatch = htmlContent.match(/<nav>([\s\S]*?)<\/nav>/);
  if (!navMatch) {
    console.log('Could not find nav element');
    return htmlContent;
  }

  const navContent = navMatch[1];

  // Extract all class links
  const classLinkRegex = /<li><a href="([^"]+)">([^<]+)<\/a><\/li>/g;
  const allLinks = [];
  let match;
  while ((match = classLinkRegex.exec(navContent)) !== null) {
    allLinks.push({ href: match[1], name: match[2] });
  }

  // Organize links by module
  const organizedHTML = [];
  organizedHTML.push('<nav>');
  organizedHTML.push('<h2><a href="index.html">Documentation</a></h2>');

  // Add Architecture & Design section
  organizedHTML.push('<h3>Architecture & Design</h3>');
  organizedHTML.push('<ul>');
  organizedHTML.push('<li><a href="ECOSYSTEM.html">System Architecture</a></li>');
  organizedHTML.push('<li><a href="decisions/ADR-001-service-oriented-architecture.html">ADR-001: Service-Oriented Architecture</a></li>');
  organizedHTML.push('<li><a href="decisions/ADR-002-mixin-pattern.html">ADR-002: Mixin Pattern</a></li>');
  organizedHTML.push('<li><a href="decisions/ADR-003-event-driven-architecture.html">ADR-003: Event-Driven Architecture</a></li>');
  organizedHTML.push('<li><a href="decisions/ADR-004-contract-based-testing.html">ADR-004: Contract-Based Testing</a></li>');
  organizedHTML.push('<li><a href="decisions/ADR-005-entity-immutability.html">ADR-005: Entity Immutability</a></li>');
  organizedHTML.push('</ul>');

  // Add each module section
  for (const [moduleName, classNames] of Object.entries(modules)) {
    const moduleLinks = allLinks.filter(link => classNames.includes(link.name));
    if (moduleLinks.length === 0) continue;

    organizedHTML.push(`<h3>${moduleName}</h3>`);
    organizedHTML.push('<ul>');
    moduleLinks.forEach(link => {
      organizedHTML.push(`<li><a href="${link.href}">${link.name}</a></li>`);
    });
    organizedHTML.push('</ul>');
  }

  // Add "Other" section for remaining classes
  const usedNames = new Set(Object.values(modules).flat());
  const otherLinks = allLinks.filter(link => !usedNames.has(link.name) && !link.href.startsWith('global.html'));
  if (otherLinks.length > 0) {
    organizedHTML.push('<h3>Other</h3>');
    organizedHTML.push('<ul>');
    otherLinks.forEach(link => {
      organizedHTML.push(`<li><a href="${link.href}">${link.name}</a></li>`);
    });
    organizedHTML.push('</ul>');
  }

  organizedHTML.push('</nav>');

  // Replace nav in HTML
  return htmlContent.replace(/<nav>[\s\S]*?<\/nav>/, organizedHTML.join('\n'));
}

// Extract all class links from a JSDoc-generated class file (not index.html which we overwrite)
// We use BaseEntity.html since it's always generated and has the full navigation
const baseEntityPath = path.join(__dirname, '..', 'docs', 'BaseEntity.html');
const baseEntityContent = fs.readFileSync(baseEntityPath, 'utf8');
const navMatch = baseEntityContent.match(/<nav>([\s\S]*?)<\/nav>/);

let masterLinks = [];
if (navMatch) {
  const navContent = navMatch[1];
  const classLinkRegex = /<li><a href="([^"]+)">([^<]+)<\/a><\/li>/g;
  let match;
  while ((match = classLinkRegex.exec(navContent)) !== null) {
    masterLinks.push({ href: match[1], name: match[2] });
  }
}

// Function to build full navigation HTML with depth awareness for relative paths
function buildFullNavigation(depth = 0) {
  const organizedHTML = [];

  // Adjust paths based on directory depth
  const prefix = depth > 0 ? '../' : '';
  const decisionsPrefix = depth > 0 ? '' : 'decisions/';

  organizedHTML.push('<nav>');
  organizedHTML.push(`<h2><a href="${prefix}index.html">Documentation</a></h2>`);

  // Add Architecture & Design section
  organizedHTML.push('<h3>Architecture & Design</h3>');
  organizedHTML.push('<ul>');
  organizedHTML.push(`<li><a href="${prefix}ECOSYSTEM.html">System Architecture</a></li>`);
  organizedHTML.push(`<li><a href="${decisionsPrefix}ADR-001-service-oriented-architecture.html">ADR-001: Service-Oriented Architecture</a></li>`);
  organizedHTML.push(`<li><a href="${decisionsPrefix}ADR-002-mixin-pattern.html">ADR-002: Mixin Pattern</a></li>`);
  organizedHTML.push(`<li><a href="${decisionsPrefix}ADR-003-event-driven-architecture.html">ADR-003: Event-Driven Architecture</a></li>`);
  organizedHTML.push(`<li><a href="${decisionsPrefix}ADR-004-contract-based-testing.html">ADR-004: Contract-Based Testing</a></li>`);
  organizedHTML.push(`<li><a href="${decisionsPrefix}ADR-005-entity-immutability.html">ADR-005: Entity Immutability</a></li>`);
  organizedHTML.push('</ul>');

  // Add each module section
  for (const [moduleName, classNames] of Object.entries(modules)) {
    const moduleLinks = masterLinks.filter(link => classNames.includes(link.name));
    if (moduleLinks.length === 0) continue;

    organizedHTML.push(`<h3>${moduleName}</h3>`);
    organizedHTML.push('<ul>');
    moduleLinks.forEach(link => {
      organizedHTML.push(`<li><a href="${prefix}${link.href}">${link.name}</a></li>`);
    });
    organizedHTML.push('</ul>');
  }

  // Add "Other" section for remaining classes
  const usedNames = new Set(Object.values(modules).flat());
  const otherLinks = masterLinks.filter(link => !usedNames.has(link.name) && !link.href.startsWith('global.html'));
  if (otherLinks.length > 0) {
    organizedHTML.push('<h3>Other</h3>');
    organizedHTML.push('<ul>');
    otherLinks.forEach(link => {
      organizedHTML.push(`<li><a href="${prefix}${link.href}">${link.name}</a></li>`);
    });
    organizedHTML.push('</ul>');
  }

  organizedHTML.push('</nav>');
  return organizedHTML.join('\n');
}

// Process all HTML files
const htmlFiles = glob.sync('docs/**/*.html');
console.log(`Processing ${htmlFiles.length} HTML files...`);

htmlFiles.forEach(file => {
  // Determine depth: files in decisions/ subdirectory are depth 1, root files are depth 0
  const depth = file.includes('/decisions/') ? 1 : 0;
  const navigation = buildFullNavigation(depth);

  const content = fs.readFileSync(file, 'utf8');
  const navMatch = content.match(/<nav>[\s\S]*?<\/nav>/);
  if (!navMatch) {
    console.log(`Could not find nav element in ${file}`);
    return;
  }

  const organized = content.replace(/<nav>[\s\S]*?<\/nav>/, navigation);
  fs.writeFileSync(file, organized, 'utf8');
});

console.log('✅ Documentation navigation reorganized by modules!');
