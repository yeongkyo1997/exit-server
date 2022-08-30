import { ObjectType, Field, Int } from "@nestjs/graphql";
import { Board } from "src/boards/entities/board.entity";
import {
  Column,
  Entity,
  JoinTable,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
@ObjectType()
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;

  @Column()
  @Field(() => String)
  comment: string;

  @JoinTable()
  @ManyToOne(() => Board)
  @Field(() => [Board])
  boardId: Board[];
}
