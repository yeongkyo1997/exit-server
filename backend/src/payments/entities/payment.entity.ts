import { ObjectType, Field, Int } from "@nestjs/graphql";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
@ObjectType()
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;

  @Column()
  @Field(() => Int)
  amount: number;

  @Column()
  @Field(() => String)
  method: string;

  @Column()
  @Field(() => Boolean)
  isCancel: boolean;

  @ManyToOne(() => User)
  @Field(() => [User])
  user: User[];

  @ManyToOne(() => Comment)
  @Field(() => [Comment])
  comment: Comment[];
}
