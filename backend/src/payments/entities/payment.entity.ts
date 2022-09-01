import { ObjectType, Field, Int } from "@nestjs/graphql";
import { User } from "src/users/entities/user.entity";
import { Column, Entity, JoinTable, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

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

  @JoinTable()
  @ManyToOne(() => User)
  @Field(() => [User])
  user: User[];

  @JoinTable()
  @ManyToOne(() => Comment)
  @Field(() => [Comment])
  comment: Comment[];
}
