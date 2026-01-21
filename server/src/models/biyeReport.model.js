import { number } from 'joi';
import mongoose from 'mongoose';

const biyeReportSchema = new mongoose.Schema({
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: [true, 'Branch is required']
    },
    disbursementNo: {
        type: Number,
        required: [true, 'Disbursement number is required'],
        min: [0, 'Disbursement number cannot be negative']
    },
    disbursementAmount: {
        type: Number,
        required: [true, 'Disbursement amount is required'],
        min: [0, 'Disbursement amount cannot be negative']
    },
    amountToClients: {
        type: Number,
        required: [true, 'Amount to clients is required'],
        min: [0, 'Amount to clients cannot be negative']
    },
    ajoWithdrawalAmount: {
        type: Number,
        required: [true, 'Ajo withdrawal amount is required'],
        min: [0, 'Ajo withdrawal amount cannot be negative']
    },
    totalClients: {
        type: Number,
        required: [true, 'Total clients is required'],
        min: [0, 'Total clients cannot be negative']
    },
    ldSolvedToday: {
        type: Number,
        required: [true, 'LD solved today is required'],
        min: [0, 'LD solved today cannot be negative']
    },
    clientsThatPaidToday: {
        type: Number,
        required: [true, 'Clients that paid today is required'],
        min: [0, 'Clients that paid today cannot be negative']
    },
    ldResolutionMethods: {
        type: [String],
        enum: {
            values: ['closed', 'properties', 'promise_undertaking', 'police'],
            message: '{VALUE} is not a valid LD resolution method'
        }
    },
    totalNoOfNewClientTomorrow: {
        type: Number,
        default: 0
    },
    totalNoOfOldClientTomorrow: {
        type: Number,
        default: 0
    },
    totalPreviousSoOwn: {
        type: Number,
        default: 0

    },
    reportDate: {
        type: Date,
        default: () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
        }
    },
    // System-calculated fields
    totalAmountNeeded: {
        type: Number,
        required: true
    },
    currentLDNo: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Index to prevent duplicate daily reports per branch
biyeReportSchema.index({ branch: 1, reportDate: 1 }, { unique: true });

const BiyeReport = mongoose.model('BiyeReport', biyeReportSchema);

export default BiyeReport;
