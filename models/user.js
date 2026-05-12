const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    mediaUrl: {
      type: String,
      required: true,
    },
    dateIST: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    ip: {
      type: String,
      required: true,
      index: true,
    },
    deviceInfo: {
      type: Object,
      default: {},
    },
    activity: {
      type: [activitySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.methods.addActivity = async function addActivity(activity) {
  if (!activity?.mediaUrl) return null;

  const date = new Date();
  const ISToffSet = 330;
  const offset = ISToffSet * 60 * 1000;
  const ISTTime = new Date(date.getTime() + offset);

  return mongoose.model("User").findByIdAndUpdate(
    this._id,
    {
      $push: {
        activity: {
          $each: [
            {
              mediaUrl: activity.mediaUrl,
              dateIST: ISTTime,
            },
          ],
          $slice: -50,
        },
      },
    },
    {
      new: true,
      runValidators: false,
    }
  );
};

module.exports = mongoose.model("User", userSchema);