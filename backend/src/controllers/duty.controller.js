const dutyService = require("../services/duty.service");

const asyncHandler = require("../utils/asyncHandler");

const {
    successResponse,
} = require("../utils/response.utils");

/**
 * Start Duty
 */
const startDuty = asyncHandler(async (req, res) => {

    const duty = await dutyService.startDuty(
        req.body,
        req.user._id
    );

    return successResponse(
        res,
        201,
        "Duty started successfully.",
        duty
    );
});

/**
 * Get Duty
 */
const getDuty = asyncHandler(async (req, res) => {

    const duty = await dutyService.getDuty(
        req.params.id
    );

    return successResponse(
        res,
        200,
        "Duty fetched successfully.",
        duty
    );
});

/**
 * Complete Duty
 */
const completeDuty = asyncHandler(async (req, res) => {

    const duty =
        await dutyService.completeDuty(
            req.params.id,
            req.body,
            req.user._id
        );

    return successResponse(
        res,
        200,
        "Duty completed successfully.",
        duty
    );
});

/**
 * Update Expenses
 */
const updateExpenses = asyncHandler(async (req, res) => {

    const duty =
        await dutyService.updateExpenses(
            req.params.id,
            req.body,
            req.user._id
        );

    return successResponse(
        res,
        200,
        "Expenses updated successfully.",
        duty
    );
});

module.exports = {
    startDuty,
    getDuty,
    completeDuty,
    updateExpenses,
};