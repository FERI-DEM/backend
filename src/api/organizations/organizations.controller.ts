import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AddMemberDto, CreateOrganizationDto } from './dto';
import { OrganizationsService } from './organizations.service';
import { User } from '../../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  async findOrganizationByUser(@User('id') userId: string) {
    return await this.organizationsService.findOrganizationByUser(userId);
  }

  @Post()
  async create(
    @Body() dto: CreateOrganizationDto,
    @User('id') adminId: string,
  ) {
    return await this.organizationsService.create({ ...dto, adminId });
  }

  @Patch('invite/:organizationId')
  async addMember(
    @Body() { memberId }: AddMemberDto,
    @Param('organizationId') organizationId: string,
  ) {
    return await this.organizationsService.addMember(memberId, organizationId);
  }

  @Delete('remove/:organizationId/:memberId')
  async deleteMember(
    @Param('memberId') memberId: string,
    @Param('organizationId') organizationId: string,
  ) {
    return await this.organizationsService.removeMember(
      memberId,
      organizationId,
    );
  }

  @Delete(':organizationId')
  async delete(
    @Param('organizationId') organizationId: string,
    @User('id') adminId: string,
  ) {
    return await this.organizationsService.delete(organizationId, adminId);
  }
}
