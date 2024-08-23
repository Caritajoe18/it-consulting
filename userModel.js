import { DataTypes, Model } from 'sequelize';
import {db} from './db.js';

class User extends Model {};


User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phonenumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
        type: DataTypes.ENUM('Male', 'Female'),
        allowNull: false, 
      },
    city:{
        type: DataTypes.STRING,
        allowNull: false,
    }
  },
  {
    sequelize: db,
    tableName: 'users',
    
  }
);

export default User;
