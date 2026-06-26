import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  createCompanySchema,
  updateCompanySchema,
  type CompanyResponse,
  type CreateCompanyDto,
  type UpdateCompanyDto,
} from '@urnight/contracts';
import { CurrentUser, type AuthUser } from '../../../../edge/decorators/current-user.decorator';
import { Roles } from '../../../../edge/decorators/roles.decorator';
import { ZodValidationPipe } from '../../../../edge/pipes/zod-validation.pipe';
import { CreateCompanyUseCase } from '../../application/use-cases/create-company.use-case';
import { GetMyCompanyUseCase } from '../../application/use-cases/get-my-company.use-case';
import { ListCompaniesUseCase } from '../../application/use-cases/list-companies.use-case';
import { SetCompanyStatusUseCase } from '../../application/use-cases/set-company-status.use-case';
import { UpdateCompanyUseCase } from '../../application/use-cases/update-company.use-case';
import type { Company } from '../../domain/entities/company.entity';
import { CompanyNotFoundError } from '../../domain/errors/companies.errors';

/** Empresas (COMPANY). /api/v1/companies. */
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly createCompany: CreateCompanyUseCase,
    private readonly getMyCompany: GetMyCompanyUseCase,
    private readonly updateCompany: UpdateCompanyUseCase,
    private readonly listCompanies: ListCompaniesUseCase,
    private readonly setCompanyStatus: SetCompanyStatusUseCase,
  ) {}

  /** Todas las empresas (super_admin, #16). */
  @Roles('super_admin')
  @Get()
  async list(): Promise<CompanyResponse[]> {
    return (await this.listCompanies.execute()).map(toCompanyResponse);
  }

  /** Empresa del actor (admin de empresa, #2/#29). */
  @Roles('admin_local')
  @Get('me')
  async mine(@CurrentUser() actor: AuthUser): Promise<CompanyResponse> {
    return toCompanyResponse(await this.getMyCompany.execute({ companyId: requireCompany(actor) }));
  }

  /** Actualiza el perfil de la propia empresa (#29). */
  @Roles('admin_local')
  @Put('me')
  async updateMine(
    @CurrentUser() actor: AuthUser,
    @Body(new ZodValidationPipe(updateCompanySchema)) dto: UpdateCompanyDto,
  ): Promise<CompanyResponse> {
    return toCompanyResponse(
      await this.updateCompany.execute({ companyId: requireCompany(actor), dto }),
    );
  }

  @Roles('super_admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body(new ZodValidationPipe(createCompanySchema)) dto: CreateCompanyDto,
  ): Promise<CompanyResponse> {
    return toCompanyResponse(await this.createCompany.execute(dto));
  }

  @Roles('super_admin')
  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspend(@Param('id', ParseUUIDPipe) id: string): Promise<CompanyResponse> {
    return toCompanyResponse(
      await this.setCompanyStatus.execute({ companyId: id, action: 'suspend' }),
    );
  }

  @Roles('super_admin')
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<CompanyResponse> {
    return toCompanyResponse(
      await this.setCompanyStatus.execute({ companyId: id, action: 'activate' }),
    );
  }
}

function requireCompany(actor: AuthUser): string {
  if (!actor.companyId) throw new CompanyNotFoundError();
  return actor.companyId;
}

export function toCompanyResponse(c: Company): CompanyResponse {
  return {
    id: c.id,
    legalName: c.legalName,
    ruc: c.ruc,
    commercialName: c.commercialName,
    contactEmail: c.contactEmail,
    contactPhone: c.contactPhone,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
  };
}
