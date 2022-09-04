import { ObjectType, Field, Int, registerEnumType } from "@nestjs/graphql";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

export enum PAYMENT_TRANSACTION_STATUS_ENUM {
  PAYMENT = "PAYMENT",
  CANCELLED = "CANCELLED",
}

registerEnumType(PAYMENT_TRANSACTION_STATUS_ENUM, {
  name: "PAYMENT_TRANSACTION_STATUS_ENUM",
});

@Entity()
@ObjectType()
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;

  @Column()
  @Field(() => String)
  impUid: string;

  @Column({
    type: "int",
    default: 0,
  })
  @Field(() => Int, {
    defaultValue: 0,
  })
  amount: number;

  // @Column()
  // @Field(() => String)
  // method: string;

  @Column({ type: "enum", enum: PAYMENT_TRANSACTION_STATUS_ENUM })
  @Field(() => PAYMENT_TRANSACTION_STATUS_ENUM)
  status: string;

  @ManyToOne(() => User)
  @Field(() => [User])
  user: User[];
}
