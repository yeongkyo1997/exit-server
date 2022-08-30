import { ObjectType, Field, Int } from "@nestjs/graphql";
import {
  Column,
  Entity,
  JoinTable,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
@ObjectType()
export class SubComment {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;

  @Column()
  @Field(() => String)
  subComment: string;

  @JoinTable()
  @ManyToOne(() => Comment)
  @Field(() => [Comment])
  commentId: Comment[];
}
