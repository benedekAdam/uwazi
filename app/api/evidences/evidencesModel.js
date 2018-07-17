import mongoose from 'mongoose';
import instanceModel from 'api/odm';

const evidenceSchema = new mongoose.Schema({
  property: {type: mongoose.Schema.Types.ObjectId},
  value: String,
  document: String,
  language: String,
  probability: Number,
  isEvidence: Boolean,
  options: mongoose.Schema.Types.Mixed,
  evidence: {
    text: String
  }
});

let Model = mongoose.model('evidences', evidenceSchema);
export default instanceModel(Model);