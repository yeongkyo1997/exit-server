import { ObjectType, Field, Int } from "@nestjs/graphql";
import { Board } from "src/boards/entities/board.entity";
import { Category } from "src/categories/entities/category.entity";
import { User } from "src/users/entities/user.entity";
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
@ObjectType()
export class Tag {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;

  @Column()
  @Field(() => String)
  name: string;

  @ManyToOne(() => Category)
  @Field(() => Category)
  CategoryId: Category;

  @JoinTable()
  @ManyToMany(() => User, (users) => users.tags)
  @Field(() => [User])
  users: User[];

  @JoinTable()
  @ManyToMany(() => Board, (boards) => boards.tags)
  @Field(() => [Board])
  boards: Board[];
}
