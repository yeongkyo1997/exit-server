import { ObjectType, Field, Int } from "@nestjs/graphql";
import { Board } from "src/boards/entities/board.entity";
import { User } from "src/users/entities/user.entity";
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
@ObjectType()
export class Keyword {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;

  @Column()
  @Field(() => String)
  name: string;

  @JoinTable()
  @ManyToMany(() => User, (users) => users.keywords)
  @Field(() => [User])
  users: User[];

  @JoinTable()
  @ManyToMany(() => Board, (boards) => boards.keywords)
  @Field(() => [Board])
  boards: Board[];
}
