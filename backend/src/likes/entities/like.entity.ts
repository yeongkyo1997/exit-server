import { ObjectType, Field } from "@nestjs/graphql";
import { Board } from "src/boards/entities/board.entity";
import { User } from "src/users/entities/user.entity";
import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
@ObjectType()
export class Like {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;

  @ManyToOne(() => Board)
  @Field(() => Board)
  board: Board;

  @ManyToOne(() => User)
  @Field(() => User)
  user: User;
}
