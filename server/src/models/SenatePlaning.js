import mongoose from 'mongoose';

const SenatePlaningSchema = new mongoose.Schema({
	noOfDisbursement: { type: Number, required: true },
	amountToClients: { type: Number, required: true },
	disbursementAmount: { type: Number, required: true },
	notes: { type: String, required: true },
	createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
	branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
	createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('SenatePlaning', SenatePlaningSchema);
