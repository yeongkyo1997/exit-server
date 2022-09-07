import { ObjectType, Field } from "@nestjs/graphql";
import { Board } from "src/boards/entities/board.entity";
import { User } from "src/users/entities/user.entity";
import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
@ObjectType()
export class UserBoard {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;

  @Column({ default: false })
  @Field(() => Boolean)
  isAccepted: boolean;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Board)
  @Field(() => Board)
  board: Board;

  @ManyToOne(() => User)
  @Field(() => User)
  user: User;
}
