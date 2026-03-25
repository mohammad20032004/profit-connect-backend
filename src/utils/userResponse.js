const formatUserResponse = (user) => {
  const userObject = typeof user.toObject === 'function' ? user.toObject() : { ...user };

  return {
    id: userObject._id || userObject.id,
    email: userObject.email,
    username: userObject.username,
    role: userObject.role,
    profile: userObject.profile,
    professional: userObject.professional,
    isActive: userObject.isActive,
    isVerified: userObject.isVerified,
    createdAt: userObject.createdAt,
    updatedAt: userObject.updatedAt,
  };
};

module.exports = {
  formatUserResponse,
};
