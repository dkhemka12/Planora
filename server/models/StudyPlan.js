import mongoose from 'mongoose';

const dayPlanSchema = new mongoose.Schema({
  day: {
    type: Number,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  duration: {
    type: Number, // In minutes
    required: true,
  },
  tasks: {
    type: [String],
    default: [],
  },
});

const studyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
    },
    days: {
      type: Number,
      required: true,
    },
    plan: {
      type: [dayPlanSchema],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);
