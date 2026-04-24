import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.ensureSeedAdmin();
  }

  async ensureSeedAdmin(): Promise<void> {
    const email = this.configService.get<string>('app.adminEmail')!;
    const password = this.configService.get<string>('app.adminPassword')!;
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) return;
    const passwordHash = await bcrypt.hash(password, 10);
    await this.userModel.create({ email, passwordHash });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }
}
