const entityType = {
    Icon            : 'icon',
    Illustration    : 'illustration',
    Family          : 'family',
    Set             : 'set',
    Credit          : 'credit',
    Subscription    : 'subscription',
    User            : 'user',
    Cart            : 'cart',
    CartItem        : 'cartItem',
    CouponCode      : 'couponCode',
    Order           : 'order',
    Transaction     : 'transaction',
    TransactionItem : 'transactionItem',
    Plugin          : 'plugin',
    Team            : 'team',
    TeamMember      : 'teamMember',
    CashoutRequest  : 'cashoutRequest',
    PaymentMethod   : 'paymentMethod',
    PaymentType     : 'paymentType',
    Account         : 'account',
    AccountType     : 'accountType',
}
module.exports.entityType = entityType;

const productType = {
    PRODUCT_TYPE_ICON           : 'PRODUCT_TYPE_ICON',
    PRODUCT_TYPE_ILLUSTRATION   : 'PRODUCT_TYPE_ILLUSTRATION'
}

/**
 * Get product type by matching some part of value.
 * @param {string} value
 * @returns {string|null}
 * @example
 * productType.match('icon') // PRODUCT_TYPE_ICON
 * productType.match('illust') // PRODUCT_TYPE_ILLUSTRATION
 * productType.match('foo') // null
 */
productType.match = (value) => {
    const keys = Object.keys(productType);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
            return productType[key];
        }
    }
    return null;
}
module.exports.productType = productType;

const ProductTypeMap = {
    'PRODUCT_TYPE_ICON'           : 'icon',
    'PRODUCT_TYPE_ILLUSTRATION'   : 'illustration',
    'icon'                        : 'PRODUCT_TYPE_ICON',
    'illustration'                : 'PRODUCT_TYPE_ILLUSTRATION',
}
module.exports.ProductTypeMap = ProductTypeMap;

// ['family', 'icon', 'illustration', 'set', 'user', 'team', 'category']
const ImageEntityTypes = {
    Family        : 'family',
    Icon          : 'icon',
    Illustration  : 'illustration',
    Set           : 'set',
    User          : 'user',
    Team          : 'team',
    Category      : 'category',
}
module.exports.ImageEntityTypes = ImageEntityTypes;

const ImageAccessTypes = {
    Admin       : 'admin',
    Owner       : 'owner',
    Customer    : 'customer',
    Purchaser   : 'purchaser',
    User        : 'user',
    All         : 'all',
    Subscriber  : 'subscriber'
}
module.exports.ImageAccessTypes = ImageAccessTypes;

const ImageVisibilityTypes = {
    Public    : 'public',
    Private   : 'private',
    Hidden    : 'hidden'
}
module.exports.ImageVisibilityTypes = ImageVisibilityTypes;

const ImageFileTypes = {
    PNG   : 'png',
    SVG   : 'svg',
    WEBP  : 'webp',
}
module.exports.ImageFileTypes = ImageFileTypes;

const ProductTypeIds = {
    PRODUCT_TYPE_ICON            : 1,
    PRODUCT_TYPE_ILLUSTRATION    : 2,
    PRODUCT_TYPE_ANIMATION       : 3,
    PRODUCT_TYPE_3D              : 4,
    PRODUCT_TYPE_AI_ART          : 5
}

ProductTypeIds.get = (value) => {
    const keys = Object.keys(ProductTypeIds);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
            return ProductTypeIds[key];
        }
    }
    return null;
}
module.exports.ProductTypeIds = ProductTypeIds;

const imageType = {
    Preview   : 'preview',
    Thumbnail : 'thumbnail',
    Primary   : 'primary',
    Download  : 'download',
    Base64    : 'base64'
}
module.exports.imageType = imageType;

const visibility = {
    public    : 'public',
    private   : 'private',
    hidden    : 'hidden'
}
module.exports.visibility = visibility;

const cartStatus = {
    NotProcessed    : 'Not processed',
    Processing      : 'Processing',
    Shipped         : 'Shipped',
    Delivered       : 'Delivered',
    Cancelled       : 'Cancelled'
}
module.exports.cartStatus = cartStatus;

const PER_SEAT_PRICE = 20
module.exports.PER_SEAT_PRICE = PER_SEAT_PRICE;

const BILLING_CYCLE = {
    MONTHLY   : 'month',
    YEARLY    : 'year'
}
module.exports.BILLING_CYCLE = BILLING_CYCLE;

const transactionType = {
    Credit        : 'credit',
    Debit         : 'debit',
    Adjustment    : 'adjustment',
    Refund        : 'refund'
}
module.exports.transactionType = transactionType;

const transactionMode = {
    Download    : 'download',
    Purchase    : 'purchase',
    Payment     : 'payment',
}
module.exports.transactionMode = transactionMode;

const teamType = {
    CONTRIBUTOR   : 'TEAM_TYPE_CONTRIBUTOR',
    CUSTOMER      : 'TEAM_TYPE_CUSTOMER',
}
module.exports.teamType = teamType;

const paymentType = {
    PREPAID_CREDITS       : 'prepaid_credits',
    SUBSCRIBER_CREDITS    : 'subscriber_credits',
    PAY_AS_YOU_GO         : 'pay_as_you_go',
    CASHOUT               : 'cashout'
}
module.exports.paymentType = paymentType;

const accountType = {
    LIABILITY                 : 'Liability',
    REVENUE                   : 'Revenue',
    EXPENSE                   : 'Expense',
    USER_LIABILITY            : 'User:Liability',
    USER_PAY_AS_YOU_GO        : 'User:PayAsYouGo',
    USER_SUBSCRIBER_CREDITS   : 'User:SubscriberCredits',
    USER_PREPAID_CREDITS      : 'User:PrepaidCredits',
    ASSET                     : 'Asset'
}
module.exports.accountType = accountType;

const accountStatus = {
    ACTIVE      : 'active',
    INACTIVE    : 'inactive',
    SUSPENDED   : 'suspended',
    CLOSED      : 'closed',
}
module.exports.accountStatus = accountStatus;

const productPrice = {
    PRODUCT_PRICE_ICON: 2,
    PRODUCT_PRICE_ILLUSTRATION: 5,
}
module.exports.productPrice = productPrice;

const stripePayoutEvents = {
    CREATED   : 'payout.created',
    UPDATED   : 'payout.updated',
    PAID      : 'payout.paid',
    FAILED    : 'payout.failed',
}
module.exports.stripePayoutEvents = stripePayoutEvents;

const cashOutRequestStatus = {
    APPROVED         : 'Approved',
    PENDING          : 'Pending',
    CANCELLED         : 'Cancelled',
    DENY             : 'Deny',
    COMPLETED        : 'Completed',
    FAILED           : 'Failed',
    REQ_CANCELLATION : 'Cancellation_Requested'
}
module.exports.cashOutRequestStatus = cashOutRequestStatus;

const stripeEvents = {
    CheckoutComplete                      : 'checkout.session.completed',
    PaymentIntentCreated                  : 'payment_intent.created',
    PaymentIntentRequiresPaymentMethod    : 'payment_intent.requires_payment_method',
    PaymentIntentRequiresConfirmation     : 'payment_intent.requires_confirmation',
    PaymentIntentProcessing               : 'payment_intent.processing',
    PaymentIntentCanceled                 : 'payment_intent.canceled',
    PaymentIntentPaymentFailed            : 'payment_intent.payment_failed',
    PaymentIntentSucceeded                : 'payment_intent.succeeded',
}
module.exports.stripeEvents = stripeEvents;

const UserRoles = {
    Admin                 : 'ROLE_ADMIN',
    Contributor           : 'ROLE_CONTRIBUTOR',
    Customer              : 'ROLE_CUSTOMER',
    DenyAll               : 'ROLE_DENY_ALL',
    Subscriber            : 'ROLE_SUBSCRIBER',
    SuperAdmin            : 'ROLE_SUPER_ADMIN',
    TeamMember            : 'ROLE_TEAM_MEMBER',
    TeamOwner             : 'ROLE_TEAM_OWNER',
    ContributorPending    : 'ROLE_CONTRIBUTOR_PENDING',
    ContributorDeclined   : 'ROLE_CONTRIBUTOR_DECLINED',
    Guest                 : 'ROLE_GUEST',
    Self                  : 'ROLE_SELF',
}
module.exports.UserRoles = UserRoles;

const EventStatus = {
    SUCCESS : 'SUCCESS',
    FAILED  : 'FAILED',
}
module.exports.EventStatus = EventStatus;

const EventTypes = {
    Login                 : 'login',
    Logout                : 'logout',
    SignUp                : 'signup',
    PasswordReset         : 'password_reset',
    PasswordChange        : 'password_change',
    EmailChange           : 'email_change',
    ProfileUpdate         : 'profile_update',
    AccountDelete         : 'account_delete',
    CashoutRequest        : 'cashout_request',
    Purchase              : 'purchase',
    Subscription          : 'subscription',
    SubscriptionCancel    : 'subscription_cancel',
    SubscriptionUpgrade   : 'subscription_upgrade',
    SubscriptionDowngrade : 'subscription_downgrade',
    SubscriptionRenew     : 'subscription_renew',
    SubscriptionPayment   : 'subscription_payment',
}
module.exports.EventTypes = EventTypes;

const OrderStatus = {
    PENDING       : 'pending',
    PROCESSING    : 'processing',
    COMPLETED     : 'completed',
    FAILED        : 'failed',
    CANCELLED     : 'cancelled',
    REFUNDED      : 'refunded'
}
module.exports.OrderStatus = OrderStatus;

const EmailTemplates = {
    RESET_PASSWORD                            : 'reset-password',
    RESET_CONFIRMATION                        : 'reset-confirmation',
    USER_SIGN_UP                              : 'user-sign-up',
    VERIFY_EMAIL                              : 'verify-email',
    CONTRIBUTOR_SIGNUP                        : 'contributor-signup',
    CONTRIBUTOR_SIGNUP_FOR_ADMIN              : 'contributor-signup-for-admin',
    CREDITS_ADDED                             : 'credits-added',
    ORDER_CONFIRMATION                        : 'order-confirmation',
    CONTACT_FORM                              : 'contact-form',
    SUBSCRIPTION_CONFIRMATION                 : 'subscription-confirmation',
    CASHOUT_PAYMENT                           : 'cashout-payment',
    SET_PUBLISHED                             : 'set-published',
    SALES_SETTLEMENT                          : 'sales-settlement',
    CONTRIBUTOR_CASHOUT_FOR_ADMIN             : 'contributor-cashout-for-admin',
    CASHOUT_REQUEST_CANCELLATION_FOR_ADMIN    : 'cashout-request-cancellation-for-admin',
    CASHOUT_REQUEST_APPROVED                  : 'cashout-request-approved',
    CASHOUT_REQUEST_DENY                      : 'cashout-request-deny',
    CASHOUT_REQUEST_CANCEL                    : 'cashout-request-cancel',
    CASHOUT_TRANSACTION_FAILED                : 'cashout-transaction-failed',
}
module.exports.EmailTemplates = EmailTemplates;

const ValidUserColumns = Object.freeze([
    'id',
    'uuid',
    'username',
    'email',
    'display_name',
    'first_name',
    'last_name',
    'provider',
    'image',
    'is_deleted',
    'is_active',
    'is_verified',
    'created_at',
    'updated_at',
    'deleted_at',
    'verified_at',
])
module.exports.ValidUserColumns = ValidUserColumns;

const CouponCodeScopes = {
    Global          : 'global',
    Seller          : 'seller',
    Buyer           : 'buyer',
    Subscription    : 'subscription',
    Family          : 'family',
    Set             : 'set',
    Item            : 'item',
    Icon            : 'icon',
    Illustration    : 'illustration',
}
module.exports.CouponCodeScopes = CouponCodeScopes;

const CouponCodeTypes = {
    Fixed         : 'fixed',
    Percentage    : 'percentage'
}
module.exports.CouponCodeTypes = CouponCodeTypes;

const CouponCodesStatus = {
    Pending: 'pending',
    Redeemed: 'redeemed',
}
module.exports.CouponCodesStatus = CouponCodesStatus;

const CouponVerificationCodes = Object.freeze({
    COUPON_REQUIRED                     : "COUPON_REQUIRED",
    COUPON_NOT_FOUND                    : "COUPON_NOT_FOUND",
    INVALID_COUPON                      : "INVALID_COUPON",
    COUPON_INACTIVE                     : "COUPON_INACTIVE",
    COUPON_EXPIRED                      : "COUPON_EXPIRED",
    MAX_USES_REACHED                    : "MAX_USES_REACHED",
    ORDER_REQUIRED                      : "ORDER_REQUIRED",
    CART_REQUIRED                       : "CART_REQUIRED",
    ENTITY_TYPE_REQUIRED                : "ENTITY_TYPE_REQUIRED",
    ENTITY_ID_REQUIRED                  : "ENTITY_ID_REQUIRED",
    COUPON_ALREADY_USED_BY_USER         : "COUPON_ALREADY_USED_BY_USER",
    COUPON_ALREADY_USED_BY_ORDER        : "COUPON_ALREADY_USED_BY_ORDER",
    COUPON_ALREADY_USED_BY_CART         : "COUPON_ALREADY_USED_BY_CART",
    COUPON_ALREADY_USED_BY_ENTITY       : "COUPON_ALREADY_USED_BY_ENTITY",
    MIN_PURCHASE_NOT_MET                : "MIN_PURCHASE_NOT_MET",
    INVALID_COUPON_TYPE                 : "INVALID_COUPON_TYPE",
    ORDER_HAS_NO_ITEMS                  : "ORDER_HAS_NO_ITEMS",
    COUPON_NOT_APPLICABLE               : "COUPON_NOT_APPLICABLE",
    BUYER_REQUIRED                      : "BUYER_REQUIRED",
    INVALID_BUYER                       : "INVALID_BUYER",
    ORDER_BUYER_MISMATCH                : "ORDER_BUYER_MISMATCH",
    SELLER_VALIDATION_NOT_IMPLEMENTED   : "SELLER_VALIDATION_NOT_IMPLEMENTED",
    UNKNOWN_COUPON_SCOPE                : "UNKNOWN_COUPON_SCOPE",
    UNEXPECTED_ERROR                    : "UNEXPECTED_ERROR",
})
module.exports.CouponVerificationCodes = CouponVerificationCodes;