const mongoose = require('mongoose');

const { Schema } = mongoose;

const TokenSchema = new Schema(
  {
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
  },
  { _id: false } 
);

const UserSchema = new Schema(
  {
    airtableUserId: {
      type: String,
      required: true,
      unique: true, 
      index: true,
    },

    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: false,
      trim: true,
    },
    avatarUrl: {
      type: String,
      required: false,
      trim: true,
    },

    tokens: {
      type: TokenSchema,
      required: true,
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true, 
  }
);

UserSchema.methods.updateTokens = function ({ accessToken, refreshToken, expiresAt }) {
  if (accessToken) this.tokens.accessToken = accessToken;
  if (refreshToken) this.tokens.refreshToken = refreshToken;
  if (expiresAt) this.tokens.expiresAt = expiresAt;
  return this.save();
};

UserSchema.methods.updateProfile = function ({ email, name, avatarUrl }) {
  if (email !== undefined) this.email = email;
  if (name !== undefined) this.name = name;
  if (avatarUrl !== undefined) this.avatarUrl = avatarUrl;
  return this.save();
};

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();

  if (obj.tokens) {
    delete obj.tokens.accessToken;
    delete obj.tokens.refreshToken;
  }

  return obj;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
