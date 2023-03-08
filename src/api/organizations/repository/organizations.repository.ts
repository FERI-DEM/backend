import { Injectable } from '@nestjs/common';
import {
  Organization,
  OrganizationDocument,
} from '../schemas/organization.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EntityRepository } from '../../../common/repository/entity.repository';

@Injectable()
export class OrganizationsRepository extends EntityRepository<OrganizationDocument> {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
  ) {
    super(organizationModel);
  }
}
