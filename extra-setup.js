function applyExtraSetup(sequelize) {
	const { users, Subscription } = sequelize.models;

    console.log(users);

	// User.hasMany(Subscription);
	// Subscription.belongsTo(User);
}

module.exports = { applyExtraSetup };