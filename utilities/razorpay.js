const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  '3months': {
    name: '3 Months Plan',
    amount: 19900, // Amount in paise (₹199)
    currency: 'INR',
    duration: 90
  },
  '6months': {
    name: '6 Months Plan',
    amount: 34900, // Amount in paise (₹349)
    currency: 'INR',
    duration: 180
  },
  '1year': {
    name: '12 Months Plan',
    amount: 59900, // Amount in paise (₹599)
    currency: 'INR',
    duration: 365
  }
};

// Create subscription
const createSubscription = async (planType, vendorId, vendorEmail, vendorName) => {
  try {
    const plan = SUBSCRIPTION_PLANS[planType];
    if (!plan) {
      throw new Error('Invalid plan type');
    }

    const subscription = await razorpay.subscriptions.create({
      plan_id: planType,
      customer_notify: 1,
      total_count: 1,
      notes: {
        vendor_id: vendorId,
        vendor_email: vendorEmail,
        vendor_name: vendorName
      }
    });

    return {
      success: true,
      subscription: subscription,
      plan: plan
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create order for one-time payment
const createOrder = async (amount, currency = 'INR', receipt = null) => {
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        source: 'vendor_subscription'
      }
    });

    return {
      success: true,
      order: order
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Verify payment signature
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generated_signature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
};

// Verify subscription signature
const verifySubscriptionSignature = (subscriptionId, paymentId, signature) => {
  try {
    const text = `${subscriptionId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generated_signature === signature;
  } catch (error) {
    console.error('Error verifying subscription signature:', error);
    return false;
  }
};

// Get subscription details
const getSubscriptionDetails = async (subscriptionId) => {
  try {
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    return {
      success: true,
      subscription: subscription
    };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Cancel subscription
const cancelSubscription = async (subscriptionId, cancelAtCycleEnd = false) => {
  try {
    const subscription = await razorpay.subscriptions.cancel(subscriptionId, {
      cancel_at_cycle_end: cancelAtCycleEnd
    });
    return {
      success: true,
      subscription: subscription
    };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Process refund
const processRefund = async (paymentId, amount, reason = 'Vendor request') => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount * 100, // Convert to paise
      speed: 'normal',
      notes: {
        reason: reason
      }
    });
    return {
      success: true,
      refund: refund
    };
  } catch (error) {
    console.error('Error processing refund:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get payment details
const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return {
      success: true,
      payment: payment
    };
  } catch (error) {
    console.error('Error fetching payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Create plans in Razorpay (run once during setup)
const createPlans = async () => {
  try {
    const plans = [];
    
    for (const [planId, planDetails] of Object.entries(SUBSCRIPTION_PLANS)) {
      try {
        const plan = await razorpay.plans.create({
          period: 'monthly',
          interval: 1,
          item: {
            name: planDetails.name,
            amount: planDetails.amount,
            currency: planDetails.currency,
            description: `${planDetails.name} - Vendor Listing Subscription`
          },
          notes: {
            duration_days: planDetails.duration.toString()
          }
        });
        
        plans.push({
          planId: planId,
          razorpayPlanId: plan.id,
          plan: plan
        });
        
        console.log(`Plan created: ${planId} - ${plan.id}`);
      } catch (error) {
        if (error.error.description.includes('already exists')) {
          console.log(`Plan ${planId} already exists`);
        } else {
          console.error(`Error creating plan ${planId}:`, error);
        }
      }
    }
    
    return {
      success: true,
      plans: plans
    };
  } catch (error) {
    console.error('Error creating plans:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all plans
const getAllPlans = async () => {
  try {
    const plans = await razorpay.plans.all();
    return {
      success: true,
      plans: plans.items
    };
  } catch (error) {
    console.error('Error fetching plans:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  razorpay,
  SUBSCRIPTION_PLANS,
  createSubscription,
  createOrder,
  verifyPaymentSignature,
  verifySubscriptionSignature,
  getSubscriptionDetails,
  cancelSubscription,
  processRefund,
  getPaymentDetails,
  createPlans,
  getAllPlans
}; 