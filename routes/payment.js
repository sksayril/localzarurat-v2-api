const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');
const ReferralCommission = require('../models/referralCommission.model');
const SystemSettings = require('../models/systemSettings.model');
const Employee = require('../models/employee.model');
const EmployeeCommission = require('../models/employeeCommission.model');
const { verifyToken } = require('../middleware/auth');
const { verifySubscriptionSignature, verifyPaymentSignature, getSubscriptionDetails, getPaymentDetails } = require('../utilities/razorpay');

// ==================== RAZORPAY WEBHOOKS ====================

// Verify Razorpay webhook signature
const verifyWebhookSignature = (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!signature || !webhookSecret) {
      return res.status(400).json({
        success: false,
        message: 'Missing webhook signature or secret'
      });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    next();
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    res.status(400).json({
      success: false,
      message: 'Webhook signature verification failed'
    });
  }
};

// Handle subscription activated webhook
router.post('/webhook/subscription.activated', verifyWebhookSignature, async (req, res) => {
  try {
    const { payload } = req.body;
    const { subscription } = payload;

    console.log('Subscription activated webhook received:', subscription.id);

    // Find subscription in database
    const dbSubscription = await Subscription.findOne({
      'razorpay.subscriptionId': subscription.id
    });

    if (!dbSubscription) {
      console.error('Subscription not found in database:', subscription.id);
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update subscription status
    dbSubscription.status = 'active';
    dbSubscription.startDate = new Date(subscription.start_at * 1000);
    dbSubscription.endDate = new Date(subscription.end_at * 1000);
    dbSubscription.razorpay.paymentId = subscription.latest_invoice?.payment_id;

    await dbSubscription.save();

    // Update vendor subscription status
    await User.findByIdAndUpdate(dbSubscription.vendor, {
      'vendorDetails.subscription.isActive': true,
      'vendorDetails.subscription.startDate': dbSubscription.startDate,
      'vendorDetails.subscription.endDate': dbSubscription.endDate,
      'vendorDetails.subscription.razorpaySubscriptionId': subscription.id,
      'vendorDetails.subscription.razorpayPaymentId': subscription.latest_invoice?.payment_id
    });

    // Process referral commission if applicable
    const vendor = await User.findById(dbSubscription.vendor);
    if (vendor.vendorDetails.referredBy) {
      const referrer = await User.findById(vendor.vendorDetails.referredBy);
      if (referrer) {
        // Get system settings for commission percentage
        const settings = await SystemSettings.getSettings();
        
        if (settings.referralCommission.isActive && 
            dbSubscription.amount >= settings.referralCommission.minimumSubscriptionAmount) {
          
          // Calculate commission amount
          let commissionAmount = (dbSubscription.amount * settings.referralCommission.percentage) / 100;
          
          // Apply maximum commission limit
          if (commissionAmount > settings.referralCommission.maximumCommissionPerReferral) {
            commissionAmount = settings.referralCommission.maximumCommissionPerReferral;
          }

          // Create referral commission record
          const referralCommission = new ReferralCommission({
            referrer: referrer._id,
            referredVendor: vendor._id,
            referralCode: vendor.vendorDetails.referralCode,
            commission: {
              percentage: settings.referralCommission.percentage,
              amount: commissionAmount,
              currency: 'INR'
            },
            subscription: {
              plan: dbSubscription.plan,
              amount: dbSubscription.amount,
              subscriptionId: dbSubscription._id
            },
            status: 'pending' // Admin needs to approve
          });

          await referralCommission.save();

          console.log(`Referral commission created: ${commissionAmount} for referrer ${referrer.name}`);
        }
      }
    }

    // Process employee commission if vendor is assigned to an employee
    if (vendor.assignedEmployee) {
      const assignedEmployee = await Employee.findById(vendor.assignedEmployee);
      
      if (assignedEmployee) {
        let targetEmployee = null;
        let commissionPercentage = 0;
        
        if (assignedEmployee.role === 'super_employee' && assignedEmployee.commissionSettings.isActive) {
          // Direct super employee assignment
          targetEmployee = assignedEmployee;
          commissionPercentage = assignedEmployee.commissionSettings.percentage;
        } else if (assignedEmployee.role === 'employee' && assignedEmployee.superEmployee) {
          // Regular employee assignment - commission goes to super employee
          const superEmployee = await Employee.findById(assignedEmployee.superEmployee);
          if (superEmployee && superEmployee.commissionSettings.isActive) {
            targetEmployee = superEmployee;
            // Use the regular employee's commission percentage
            commissionPercentage = assignedEmployee.employeeCommissionPercentage || 0;
          }
        }

        if (targetEmployee && commissionPercentage > 0) {
          const commissionAmount = (dbSubscription.amount * commissionPercentage) / 100;

          // Create employee commission record
          const employeeCommission = new EmployeeCommission({
            employee: targetEmployee._id,
            seller: vendor._id,
            subscription: dbSubscription._id,
            commission: {
              percentage: commissionPercentage,
              amount: commissionAmount,
              subscriptionAmount: dbSubscription.amount
            },
            district: {
              name: vendor.vendorDetails.vendorAddress?.city || 'Unknown',
              state: vendor.vendorDetails.vendorAddress?.state || 'Unknown'
            },
            period: {
              startDate: dbSubscription.startDate,
              endDate: dbSubscription.endDate
            },
            status: 'pending' // Admin needs to approve
          });

          await employeeCommission.save();

          // Update employee statistics
          if (assignedEmployee.role === 'employee') {
            assignedEmployee.statistics.totalSellersAssigned += 1;
            await assignedEmployee.save();
          }
          
          targetEmployee.statistics.totalSellersAssigned += 1;
          await targetEmployee.save();

          console.log(`Employee commission created: ${commissionAmount} for ${targetEmployee.role} ${targetEmployee.name} (${targetEmployee.employeeId}) from seller assigned to ${assignedEmployee.employeeId}`);
        }
      }
    }

    console.log('Subscription activated successfully:', subscription.id);

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Subscription activated webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Handle subscription cancelled webhook
router.post('/webhook/subscription.cancelled', verifyWebhookSignature, async (req, res) => {
  try {
    const { payload } = req.body;
    const { subscription } = payload;

    console.log('Subscription cancelled webhook received:', subscription.id);

    // Find subscription in database
    const dbSubscription = await Subscription.findOne({
      'razorpay.subscriptionId': subscription.id
    });

    if (!dbSubscription) {
      console.error('Subscription not found in database:', subscription.id);
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update subscription status
    dbSubscription.status = 'cancelled';
    dbSubscription.cancelledAt = new Date();

    await dbSubscription.save();

    // Update vendor subscription status
    await User.findByIdAndUpdate(dbSubscription.vendor, {
      'vendorDetails.subscription.isActive': false
    });

    console.log('Subscription cancelled successfully:', subscription.id);

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Subscription cancelled webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Handle payment captured webhook
router.post('/webhook/payment.captured', verifyWebhookSignature, async (req, res) => {
  try {
    const { payload } = req.body;
    const { payment } = payload;

    console.log('Payment captured webhook received:', payment.id);

    // Find subscription by payment ID
    const dbSubscription = await Subscription.findOne({
      'razorpay.paymentId': payment.id
    });

    if (dbSubscription) {
      // Update subscription payment details
      dbSubscription.razorpay.paymentId = payment.id;
      dbSubscription.razorpay.signature = req.headers['x-razorpay-signature'];

      // Add to payment history
      dbSubscription.paymentHistory.push({
        amount: payment.amount / 100, // Convert from paise to rupees
        date: new Date(),
        status: 'success',
        razorpayPaymentId: payment.id,
        description: 'Subscription payment'
      });

      await dbSubscription.save();
    }

    console.log('Payment captured successfully:', payment.id);

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Payment captured webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Handle payment failed webhook
router.post('/webhook/payment.failed', verifyWebhookSignature, async (req, res) => {
  try {
    const { payload } = req.body;
    const { payment } = payload;

    console.log('Payment failed webhook received:', payment.id);

    // Find subscription by payment ID
    const dbSubscription = await Subscription.findOne({
      'razorpay.paymentId': payment.id
    });

    if (dbSubscription) {
      // Update subscription status
      dbSubscription.status = 'failed';

      // Add to payment history
      dbSubscription.paymentHistory.push({
        amount: payment.amount / 100,
        date: new Date(),
        status: 'failed',
        razorpayPaymentId: payment.id,
        description: 'Payment failed'
      });

      await dbSubscription.save();

      // Update vendor subscription status
      await User.findByIdAndUpdate(dbSubscription.vendor, {
        'vendorDetails.subscription.isActive': false
      });
    }

    console.log('Payment failed processed:', payment.id);

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Payment failed webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== PAYMENT VERIFICATION ====================

// Verify subscription payment
router.post('/verify-subscription', async (req, res) => {
  try {
    const { subscriptionId, paymentId, signature } = req.body;

    if (!subscriptionId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Verify signature
    const isValidSignature = verifySubscriptionSignature(subscriptionId, paymentId, signature);
    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Get subscription details from Razorpay
    const razorpayResult = await getSubscriptionDetails(subscriptionId);
    if (!razorpayResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to get subscription details',
        error: razorpayResult.error
      });
    }

    // Find subscription in database
    const dbSubscription = await Subscription.findOne({
      'razorpay.subscriptionId': subscriptionId
    });

    if (!dbSubscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update subscription with payment details
    dbSubscription.razorpay.paymentId = paymentId;
    dbSubscription.razorpay.signature = signature;

    // Add to payment history
    dbSubscription.paymentHistory.push({
      amount: dbSubscription.amount,
      date: new Date(),
      status: 'success',
      razorpayPaymentId: paymentId,
      description: 'Subscription payment verified'
    });

    await dbSubscription.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        subscription: dbSubscription,
        razorpaySubscription: razorpayResult.subscription
      }
    });
  } catch (error) {
    console.error('Verify subscription payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Verify one-time payment
router.post('/verify-payment', async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    // Verify signature
    const isValidSignature = verifyPaymentSignature(orderId, paymentId, signature);
    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Get payment details from Razorpay
    const paymentResult = await getPaymentDetails(paymentId);
    if (!paymentResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to get payment details',
        error: paymentResult.error
      });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        payment: paymentResult.payment
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== PAYMENT STATUS ====================

// Get payment status
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    const paymentResult = await getPaymentDetails(paymentId);
    if (!paymentResult.success) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
        error: paymentResult.error
      });
    }

    res.json({
      success: true,
      data: paymentResult.payment
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get subscription status
router.get('/subscription/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscriptionResult = await getSubscriptionDetails(subscriptionId);
    if (!subscriptionResult.success) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
        error: subscriptionResult.error
      });
    }

    res.json({
      success: true,
      data: subscriptionResult.subscription
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router; 