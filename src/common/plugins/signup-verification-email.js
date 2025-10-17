const { EventBus, EventTypes } = require('../event-bus');
const mailService = require('../mail-service');
const jwt = require('jsonwebtoken');

/**
 * Handler for sending verification email on user signup.
 * @param {Object} event - The event object containing user data.
 * @param {Object} event.data - The user data.
 * @returns {Promise<void>} - A promise that resolves when the email is sent.
 * @throws {Error} - Throws an error if the user is not found or if the email cannot be sent.
 */
const handler = async (event) => {    
    // ===========================================================================
    // Create Coupon Code & Send welcome offer email
    // ===========================================================================
    const { data: user } = event;

    console.log('Verification Email event triggered:', user);

    if (!user?.email) {
        console.log('Verification Email not sent. User not found.');
        throw new Error('Verification Email not sent. User not found.');
    }

    console.log('Sending welcome offer email...');

    // ===========================================================================
    // Send verification email
    // ===========================================================================
    // ============================================================================
    // Send verification email
    // ============================================================================
    if (! user) {
        throw new Error('User not found');
    }

    if (! user?.email) {
        throw new Error('User email not found');
    }

    if (user?.is_deleted) {
        throw new Error('User not found');
    }

    if (user?.is_verified) {
        throw new Error('User already verified');
    }

    // ============================================================================
    // Get Email Verification token
    // ============================================================================
    console.log('token values', { 
        userId    : user?.id,
        email     : user?.email,
        timestamp : Date.now()
    })

    const emailVerificationToken = jwt.sign(
        { 
            userId    : user?.id,
            email     : user?.email,
            timestamp : Date.now()
        }, 
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    const verifyEmailURL = `${process.env.VECTORICONS_SERVER_URL}/verify-email?token=${emailVerificationToken}`;

    console.log('Verification email values', { 
        name                : user?.first_name,
        SUBJECT             : 'Welcome to VectorIcons',
        VERIFY_EMAIL_URL    : verifyEmailURL,
    })

    // ============================================================================
    // Send verification email
    // ============================================================================
    await mailService.sendEmail(
        user?.email, 
        'verify-email', { 
            name                : user?.first_name || 'User',
            SUBJECT             : 'Welcome to VectorIcons',
            VERIFY_EMAIL_URL    : verifyEmailURL,
        }
    );  

    console.log('Verification Email email sent successfully.');
};

// Register the plugin with the event bus
EventBus.on(EventTypes.USER_SIGNUP, handler, {
    onError: {
        notify: ['slack', 'email']
    }
});

module.exports = {
    handler,
    meta: {
        onError: {
            notify: ['slack', 'email']
        }
    }
};