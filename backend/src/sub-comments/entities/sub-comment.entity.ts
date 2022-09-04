import { ObjectType, Field } from "@nestjs/graphql";
import { Comment } from "src/comments/entities/comment.entity";
import { User } from "src/users/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @ManyToOne(() => Comment)
  @Field(() => Comment)
  comment: Comment;

  @ManyToOne(() => User)
  @Field(() => User)
  user: User;
}
