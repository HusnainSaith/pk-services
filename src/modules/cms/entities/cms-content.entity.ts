import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('cms_content')
export class CmsContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  type: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ length: 255, nullable: true, unique: true })
  slug: string;

  @Column({ length: 20, default: 'draft' })
  status: string;

  @Column({ name: 'author_id', nullable: true })
  authorId: string;

  @ManyToOne(() => User, (user) => user.authoredContent)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ nullable: true, name: 'published_at' })
  publishedAt: Date;

  @Column({ type: 'int', default: 0 })
  views: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
