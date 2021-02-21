module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define("User", {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false
        },
        team: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    });

    User.associate = (models) => {
        User.hasMany(models.Subscription, {
            onDelete: "CASCADE"
        });
    }

    // console.log(sequelize.models)

    return User
} 