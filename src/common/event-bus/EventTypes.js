/**
 * @module event-bus/event-types
 * @description Event types for the event bus.
 * This module defines a set of constants representing different event types
 * that can be emitted and listened to in the event bus system.
 * @example
 * const { EventBus, EventTypes } = require('./event-bus');
 * EventBus.on(EventTypes.USER_SIGNUP, (event) => {...});
 * EventBus.emit(EventTypes.USER_SIGNUP, { userId: 123 });
 */
const EventTypes = Object.freeze({
    APP_START                   : 'app.start',
    APP_ERROR                   : 'app.error',
    USER_SIGNUP                 : 'user.signup',
    USER_SIGNUP_ERROR           : 'user.signup.error',
    USER_LOGIN                  : 'user.login',
    USER_LOGOUT                 : 'user.logout',
    USER_DELETE                 : 'user.delete',
    USER_UPDATE_PROFILE         : 'user.update-profile',
    USER_UPDATE_EMAIL           : 'user.update-email',
    USER_VERIFY_EMAIL           : 'user.verify-email',
    USER_UPDATE_PASSWORD        : 'user.update-password',
    USER_PASSWORD_CHANGED       : 'user.password-changed',
    USER_FORGOT_PASSWORD        : 'user.forgot-password',
    USER_RESET_PASSWORD         : 'user.reset-password',
    ORDER_CONFIRMATION          : 'order.confirmation',
    ORDER_CANCEL_SUBSCRIPTION   : 'order.cancel-subscription',
    ORDER_PURCHASE_CREDITS      : 'order.credits.purchase',
    ORDER_REFUND                : 'order.refund',
    ORDER_ADD_FAILED            : 'order.add.failed',
    NOTIFY_EMAIL                : 'notify-email',
    NOTIFY_SLACK                : 'notify-slack',
});

module.exports = EventTypes;