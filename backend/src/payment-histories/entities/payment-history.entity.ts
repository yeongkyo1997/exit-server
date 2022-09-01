import { ObjectType, Field } from "@nestjs/graphql";
import { Board } from "src/boards/entities/board.entity";
import { User } from "src/users/entities/user.entity";
import { Entity, JoinTable, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
@ObjectType()
export class PaymentHistory {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;

  @ManyToOne(() => User)
  @Field(() => [User])
  user: User[];

  @JoinTable()
  @ManyToOne(() => Board)
  @Field(() => [Board])
  board: Board[];
}
