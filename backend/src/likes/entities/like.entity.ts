import { ObjectType, Field } from "@nestjs/graphql";
import { Board } from "src/boards/entities/board.entity";
import { User } from "src/users/entities/user.entity";
import { Entity, JoinTable, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
@ObjectType()
export class Like {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;

  @JoinTable()
  @ManyToOne(() => Board)
  @Field(() => [Board])
  boards: Board[];

  @JoinTable()
  @ManyToOne(() => User)
  @Field(() => [User])
  users: User[];
}
