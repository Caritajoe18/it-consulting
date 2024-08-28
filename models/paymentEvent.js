import { DataTypes, Model } from "sequelize";
import { db } from "../db.js";

class PaymentEvent extends Model {}

PaymentEvent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    transactionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },

    status: {
        type: DataTypes.STRING,
        defaultValue:"pending",
      },
      payload: {
        type: DataTypes.JSON,
        allowNull: false,
      },
  },
  {
    sequelize: db,
    tableName: "paymentEvent",
  }
);

export default PaymentEvent;
