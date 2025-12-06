const Employee = require('../models/employee.model');
const EmployeeCommission = require('../models/employeeCommission.model');
const User = require('../models/user.model');
const Subscription = require('../models/subscription.model');

/**
 * Calculate and create employee commission for a subscription
 * @param {string} subscriptionId - The subscription ID
 * @param {string} vendorId - The vendor ID
 * @returns {Promise<Object>} - Commission creation result
 */
const createEmployeeCommission = async (subscriptionId, vendorId) => {
  try {
    // Get vendor details
    const vendor = await User.findById(vendorId);
    if (!vendor || !vendor.assignedEmployee) {
      return {
        success: false,
        message: 'Vendor not assigned to any employee'
      };
    }

    // Get subscription details
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return {
        success: false,
        message: 'Subscription not found'
      };
    }

    // Get employee details
    const employee = await Employee.findById(vendor.assignedEmployee);
    if (!employee || employee.role !== 'super_employee' || !employee.commissionSettings.isActive) {
      return {
        success: false,
        message: 'Employee not eligible for commission'
      };
    }

    // Calculate commission
    const commissionPercentage = employee.commissionSettings.percentage;
    const commissionAmount = (subscription.amount * commissionPercentage) / 100;

    // Check if commission already exists
    const existingCommission = await EmployeeCommission.findOne({
      employee: employee._id,
      seller: vendor._id,
      subscription: subscription._id
    });

    if (existingCommission) {
      return {
        success: false,
        message: 'Commission already exists for this subscription'
      };
    }

    // Create commission record
    const employeeCommission = new EmployeeCommission({
      employee: employee._id,
      seller: vendor._id,
      subscription: subscription._id,
      commission: {
        percentage: commissionPercentage,
        amount: commissionAmount,
        subscriptionAmount: subscription.amount
      },
      district: {
        name: vendor.vendorDetails.vendorAddress?.city || 'Unknown',
        state: vendor.vendorDetails.vendorAddress?.state || 'Unknown'
      },
      period: {
        startDate: subscription.startDate,
        endDate: subscription.endDate
      },
      status: 'pending'
    });

    await employeeCommission.save();

    // Update employee statistics
    employee.statistics.totalSellersAssigned += 1;
    await employee.save();

    return {
      success: true,
      message: 'Employee commission created successfully',
      data: {
        commissionId: employeeCommission._id,
        employeeId: employee.employeeId,
        employeeName: employee.name,
        commissionAmount,
        commissionPercentage
      }
    };
  } catch (error) {
    console.error('Create employee commission error:', error);
    return {
      success: false,
      message: 'Failed to create employee commission',
      error: error.message
    };
  }
};

/**
 * Approve and pay employee commission
 * @param {string} commissionId - The commission ID
 * @param {string} adminId - The admin ID who approved
 * @param {string} notes - Admin notes
 * @returns {Promise<Object>} - Approval result
 */
const approveEmployeeCommission = async (commissionId, adminId, notes = null) => {
  try {
    const commission = await EmployeeCommission.findById(commissionId)
      .populate('employee', 'name email wallet role')
      .populate('seller', 'name vendorDetails.shopName');

    if (!commission) {
      return {
        success: false,
        message: 'Commission not found'
      };
    }

    if (commission.status !== 'pending') {
      return {
        success: false,
        message: 'Commission has already been processed'
      };
    }

    // Approve commission
    await commission.approve(adminId, notes);

    // Add commission to employee's wallet
    const employee = await Employee.findById(commission.employee._id);
    if (employee && employee.role === 'super_employee') {
      await employee.addCommission(
        commission.commission.amount,
        `Commission for seller: ${commission.seller.name} (${commission.seller.vendorDetails.shopName})`,
        commissionId
      );
    }

    return {
      success: true,
      message: 'Employee commission approved and paid successfully',
      data: {
        commissionId: commission._id,
        amount: commission.commission.amount,
        employeeName: employee.name,
        newWalletBalance: employee.wallet.balance
      }
    };
  } catch (error) {
    console.error('Approve employee commission error:', error);
    return {
      success: false,
      message: 'Failed to approve employee commission',
      error: error.message
    };
  }
};

/**
 * Get employee commission statistics
 * @param {string} employeeId - The employee ID
 * @param {string} period - Time period (month, quarter, year)
 * @returns {Promise<Object>} - Commission statistics
 */
const getEmployeeCommissionStats = async (employeeId, period = 'all') => {
  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return {
        success: false,
        message: 'Employee not found'
      };
    }

    // Build date filter
    let dateFilter = {};
    if (period === 'month') {
      const now = new Date();
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        }
      };
    } else if (period === 'quarter') {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), quarter * 3, 1),
          $lte: new Date(now.getFullYear(), (quarter + 1) * 3, 0)
        }
      };
    } else if (period === 'year') {
      const now = new Date();
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lte: new Date(now.getFullYear(), 11, 31)
        }
      };
    }

    const query = { employee: employeeId, ...dateFilter };

    // Get commission statistics
    const stats = await EmployeeCommission.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$commission.amount' },
          averageAmount: { $avg: '$commission.amount' }
        }
      }
    ]);

    // Get total assigned sellers
    const assignedSellers = await User.countDocuments({
      assignedEmployee: employeeId,
      role: 'vendor',
      isActive: true
    });

    // Get monthly commission trends
    const monthlyTrends = await EmployeeCommission.aggregate([
      { $match: { employee: employeeId, status: 'paid' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$commission.amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    const summary = {
      pending: { count: 0, amount: 0, averageAmount: 0 },
      paid: { count: 0, amount: 0, averageAmount: 0 },
      cancelled: { count: 0, amount: 0, averageAmount: 0 }
    };

    stats.forEach(stat => {
      summary[stat._id] = {
        count: stat.count,
        amount: stat.totalAmount,
        averageAmount: stat.averageAmount
      };
    });

    return {
      success: true,
      data: {
        employee: {
          _id: employee._id,
          employeeId: employee.employeeId,
          name: employee.name,
          role: employee.role,
          commissionSettings: employee.commissionSettings,
          wallet: employee.wallet,
          statistics: employee.statistics
        },
        summary,
        assignedSellers,
        monthlyTrends,
        period
      }
    };
  } catch (error) {
    console.error('Get employee commission stats error:', error);
    return {
      success: false,
      message: 'Failed to get commission statistics',
      error: error.message
    };
  }
};

/**
 * Process bulk commission approvals
 * @param {Array} commissionIds - Array of commission IDs
 * @param {string} adminId - The admin ID
 * @param {string} notes - Admin notes
 * @returns {Promise<Object>} - Bulk approval result
 */
const bulkApproveEmployeeCommissions = async (commissionIds, adminId, notes = null) => {
  try {
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    for (const commissionId of commissionIds) {
      try {
        const result = await approveEmployeeCommission(commissionId, adminId, notes);
        results.push({
          commissionId,
          success: result.success,
          message: result.message,
          data: result.data
        });

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        results.push({
          commissionId,
          success: false,
          message: error.message
        });
        failureCount++;
      }
    }

    return {
      success: true,
      message: `Bulk approval completed: ${successCount} successful, ${failureCount} failed`,
      data: {
        totalProcessed: commissionIds.length,
        successCount,
        failureCount,
        results
      }
    };
  } catch (error) {
    console.error('Bulk approve employee commissions error:', error);
    return {
      success: false,
      message: 'Failed to process bulk approvals',
      error: error.message
    };
  }
};

/**
 * Get employee wallet summary
 * @param {string} employeeId - The employee ID
 * @returns {Promise<Object>} - Wallet summary
 */
const getEmployeeWalletSummary = async (employeeId) => {
  try {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return {
        success: false,
        message: 'Employee not found'
      };
    }

    if (employee.role !== 'super_employee') {
      return {
        success: false,
        message: 'Only super employees have wallets'
      };
    }

    // Get recent transactions
    const recentTransactions = employee.wallet.transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Get transaction statistics
    const creditTransactions = employee.wallet.transactions.filter(t => t.type === 'credit');
    const debitTransactions = employee.wallet.transactions.filter(t => t.type === 'debit');

    const totalCredits = creditTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = debitTransactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      success: true,
      data: {
        balance: employee.wallet.balance,
        totalCredits,
        totalDebits,
        transactionCount: employee.wallet.transactions.length,
        recentTransactions,
        statistics: employee.statistics
      }
    };
  } catch (error) {
    console.error('Get employee wallet summary error:', error);
    return {
      success: false,
      message: 'Failed to get wallet summary',
      error: error.message
    };
  }
};

module.exports = {
  createEmployeeCommission,
  approveEmployeeCommission,
  getEmployeeCommissionStats,
  bulkApproveEmployeeCommissions,
  getEmployeeWalletSummary
};
