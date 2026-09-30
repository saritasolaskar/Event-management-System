const crypto = require("crypto");

const userRepository =
require("../repositories/user.repository");

const {
generateAccessToken,
generateRefreshToken,
verifyRefreshToken,
} = require("../utils/jwt.utils");

const {
calculateExpiry,
} = require("../utils/token.utils");

const AppError =
require("../utils/AppError");

const {
STATUS,
} = require("../constants/status");

const {
ROLES,
} = require("../constants/roles");

const register = async (userData) => {
const existingEmail =
await userRepository.findByEmail(
userData.email
);

```
if (existingEmail) {
    throw new AppError(
        "Email already exists.",
        409
    );
}

const existingPhone =
    await userRepository.findByPhone(
        userData.phone
    );

if (existingPhone) {
    throw new AppError(
        "Phone number already exists.",
        409
    );
}

const user =
    await userRepository.create({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        avatar: userData.avatar || null,
        role: ROLES.CLIENT,
        status: STATUS.ACTIVE,
        isEmailVerified: false,
        failedLoginAttempts: 0,
        lockUntil: null,
        isDeleted: false,
    });

const accessToken =
    generateAccessToken(user);

const refreshToken =
    generateRefreshToken(user);

await userRepository.addRefreshToken(
    user._id,
    refreshToken,
    calculateExpiry(7)
);

const userObject =
    user.toObject();

delete userObject.password;

return {
    user: userObject,
    accessToken,
    refreshToken,
};
```

};

const login = async ({
email,
password,
}) => {
const user =
await userRepository.findByEmailWithPassword(
email
);

```
if (!user) {
    throw new AppError(
        "Invalid email or password.",
        401
    );
}

if (
    user.lockUntil &&
    user.lockUntil > new Date()
) {
    throw new AppError(
        "Too many failed login attempts. Please try again later.",
        429
    );
}

if (
    user.lockUntil &&
    user.lockUntil <= new Date()
) {
    await userRepository.resetLoginAttempts(
        user._id
    );
}

const isPasswordValid =
    await user.comparePassword(password);

if (!isPasswordValid) {
    await userRepository.recordFailedLoginAttempt(
        user._id
    );

    throw new AppError(
        "Invalid email or password.",
        401
    );
}

if (
    user.status !== STATUS.ACTIVE ||
    user.isDeleted
) {
    throw new AppError(
        "Your account is inactive.",
        403
    );
}

await userRepository.resetLoginAttempts(
    user._id
);

const accessToken =
    generateAccessToken(user);

const refreshToken =
    generateRefreshToken(user);

await userRepository.addRefreshToken(
    user._id,
    refreshToken,
    calculateExpiry(7)
);

await userRepository.updateLastLogin(
    user._id
);

const userObject =
    user.toObject();

delete userObject.password;

return {
    user: userObject,
    accessToken,
    refreshToken,
};
```

};

/**

* Create Password Setup Token
*
* Optional session allows Driver creation
* to keep token creation inside the same
* MongoDB transaction.
  */
  const createPasswordSetupToken = async (
  userId,
  session = null
  ) => {
  const user =
  await userRepository.findById(
  userId,
  session
  );

  if (!user) {
  throw new AppError(
  "User not found.",
  404
  );
  }

  const rawToken =
  crypto
  .randomBytes(32)
  .toString("hex");

  const hashedToken =
  crypto
  .createHash("sha256")
  .update(rawToken)
  .digest("hex");

  const expiresAt =
  new Date(
  Date.now() +
  30 * 60 * 1000
  );

  const updatedUser =
  await userRepository.updateById(
  userId,
  {
  passwordResetToken:
  hashedToken,

  ```
           passwordResetExpires:
               expiresAt,
       },
       session
   );
  ```

  if (!updatedUser) {
  throw new AppError(
  "Failed to create password setup token.",
  500
  );
  }

  return rawToken;
  };

const setPassword = async (
token,
password
) => {
const hashedToken =
crypto
.createHash("sha256")
.update(token)
.digest("hex");

```
const user =
    await userRepository.findByPasswordResetToken(
        hashedToken
    );

if (!user) {
    throw new AppError(
        "Invalid or expired password setup token.",
        400
    );
}

if (
    !user.passwordResetExpires ||
    user.passwordResetExpires < new Date()
) {
    throw new AppError(
        "Invalid or expired password setup token.",
        400
    );
}

if (
    user.status !== STATUS.ACTIVE ||
    user.isDeleted
) {
    throw new AppError(
        "Your account is inactive.",
        403
    );
}

user.password = password;
user.passwordResetToken = undefined;
user.passwordResetExpires = undefined;
user.refreshTokens = [];
user.failedLoginAttempts = 0;
user.lockUntil = null;

await user.save();

return {
    message:
        "Password set successfully. You can now log in.",
};
```

};

/**

* Verify refresh token safely.
*
* JWT verification throws when the token is
* malformed, expired, or signed with the
* wrong secret. Convert that into our normal
* application-level 401 error.
  */
  const verifyRefreshTokenSafely = (token) => {
  if (!token) {
  throw new AppError(
  "Refresh token is required.",
  401
  );
  }

  try {
  return verifyRefreshToken(token);
  } catch (error) {
  throw new AppError(
  "Invalid or expired refresh token.",
  401
  );
  }
  };

const refreshToken = async (token) => {
verifyRefreshTokenSafely(token);

```
const user =
    await userRepository.findByRefreshToken(
        token
    );

if (!user) {
    throw new AppError(
        "Invalid refresh token.",
        401
    );
}

if (
    user.status !== STATUS.ACTIVE ||
    user.isDeleted
) {
    throw new AppError(
        "Your account is inactive.",
        403
    );
}

await userRepository.removeRefreshToken(
    user._id,
    token
);

const accessToken =
    generateAccessToken(user);

const newRefreshToken =
    generateRefreshToken(user);

await userRepository.addRefreshToken(
    user._id,
    newRefreshToken,
    calculateExpiry(7)
);

return {
    accessToken,
    refreshToken:
        newRefreshToken,
};
```

};

const logout = async (refreshToken) => {
verifyRefreshTokenSafely(refreshToken);

```
const user =
    await userRepository.findByRefreshToken(
        refreshToken
    );

if (!user) {
    throw new AppError(
        "Invalid refresh token.",
        401
    );
}

await userRepository.removeRefreshToken(
    user._id,
    refreshToken
);

return {
    message:
        "Logged out successfully.",
};
```

};

const logoutAllDevices = async (userId) => {
await userRepository.removeAllRefreshTokens(
userId
);

```
return {
    message:
        "Logged out from all devices.",
};
```

};

module.exports = {
register,
login,
createPasswordSetupToken,
setPassword,
refreshToken,
logout,
logoutAllDevices,
};
