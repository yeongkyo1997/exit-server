import { ObjectType, Field } from "@nestjs/graphql";
import { Board } from "src/boards/entities/board.entity";
import { TagImage } from "src/tag-images/entities/tag-image.entity";
import { User } from "src/users/entities/user.entity";
import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToMany,
  OneToOne,
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

  @JoinColumn()
  @OneToOne(() => TagImage)
  @Field(() => TagImage)
  tagImage: TagImage;

  @ManyToMany(() => User, (users) => users.tags)
  @Field(() => [User])
  users: User[];

  @ManyToMany(() => Board, (boards) => boards.tags)
  @Field(() => [Board])
  boards: Board[];
}
