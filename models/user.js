const mongoose = require("mongoose");
const validate = require("validator");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "a name is required"],
    minlength: 3,
    maxlength: 15,
  },
  email: {
    type: String,
    required: true,
    unique: [true, "email already taken"],
    lowercase: true,
    validate: [validate.isEmail, "please provide valid email"],
  },
  password: {
    type: String,
    required: true,
    select: false,
  },

  passwordChanged: Date,

  // role: { type: String, enum: ["user", "admin", "mod"], default: "user" },
  profileImg: {
    type: String,
    default: "default-img.png",
  },
  People_I_follow: [
    { type: mongoose.SchemaTypes.ObjectId, ref: "User", default: [] },
  ],
  People_that_follow_me: [
    { type: mongoose.SchemaTypes.ObjectId, ref: "User", default: [] },
  ],
  threads: [
    { type: mongoose.SchemaTypes.ObjectId, ref: "Thread", default: [] },
  ],

  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    // still needs work here
    type: Date,
    default: Date.now(),
  },
  passwordResetToken: String,
  passwordResetTime: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// userSchema.pre("save", async function (next) {
//   // if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 14);
//   next();
// });

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  // some times the DB is slower then the jwt token so we take one seconde to not run into problemes in login
  this.passwordChanged = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// userSchema.pre(/^find/, function (next) {
//   this.populate("posts");
//   next();
// });

userSchema.methods.checkPassChanged = async function (tokenDate) {
  if (this.passwordChanged) {
    const changedAt = parseInt(this.passwordChanged.getTime() / 1000, 10);
    return tokenDate < changedAt;
  }
  return false;
};

// userSchema.methods.resetToken = function () {
//   const resetToken = crypto.randomBytes(32).toString("hex");

//   this.passwordResetToken = crypto
//     .createHash("sha256")
//     .update(resetToken)
//     .digest("hex");

//   this.passwordResetTime = Date.now() + 30 * 60 * 1000;
//   return resetToken;
// };

module.exports = mongoose.model("User", userSchema);
