module.exports = (sequelize, DataTypes) => {
    const Subscription = sequelize.define("Subscription", {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        endDate: {
            type: DataTypes.DATEONLY, 
            allowNull: false
        },
    });

    Subscription.associate = (models) => {
        console.log(models)
        Subscription.belongsTo(models.User, {
            foreignKey: {
                allowNull: false
            },
            onDelete: "CASCADE"
        });
    }

    // console.log(sequelize.models)

    return Subscription
} 