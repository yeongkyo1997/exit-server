import { ObjectType, Field } from "@nestjs/graphql";
import { Board } from "src/boards/entities/board.entity";
import { User } from "src/users/entities/user.entity";
import {
  Column,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
@ObjectType()
export class Category {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;

  @Column({ unique: true })
  @Field(() => String)
  name: string;

  @DeleteDateColumn()
  deleteAt: Date;

  @ManyToMany(() => Board, (boards) => boards.categories)
  @Field(() => [Board])
  boards: Board[];

  @ManyToMany(() => User, (users) => users.categories)
  @Field(() => [User])
  users: User[];
}
