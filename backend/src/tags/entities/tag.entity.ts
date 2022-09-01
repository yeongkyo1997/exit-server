import { ObjectType, Field, Int } from "@nestjs/graphql";
import { Board } from "src/boards/entities/board.entity";
import { Category } from "src/categories/entities/category.entity";
import { User } from "src/users/entities/user.entity";
import {
  Column,
  DeleteDateColumn,
  Entity,
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

  @DeleteDateColumn()
  deleteAt: Date;

  @ManyToOne(() => Category)
  @Field(() => Category)
  CategoryId: Category;

  @ManyToMany(() => User, (users) => users.tags)
  @Field(() => [User])
  users: User[];

  @ManyToMany(() => Board, (boards) => boards.tags)
  @Field(() => [Board])
  boards: Board[];
}
