import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ServiceTypesService } from './service-types.service';
import { CreateServiceTypeDto } from './dto/create-service-type.dto';
import { UpdateServiceTypeDto } from './dto/update-service-type.dto';
import { HttpCacheInterceptor } from '../../common/interceptors/http-cache.interceptor';

@ApiTags('Service Types')
@Controller('service-types')
@UseInterceptors(HttpCacheInterceptor)
export class ServiceTypesController {
  constructor(private readonly serviceTypesService: ServiceTypesService) {}

  // Public/Customer Routes
  @Get()
  @ApiOperation({ summary: '[Public] List active service types' })
  findActive() {
    return this.serviceTypesService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: '[Public] Get service type details' })
  findOne(@Param('id') id: string) {
    return this.serviceTypesService.findOne(id);
  }

  @Get(':id/schema')
  @ApiOperation({ summary: '[Public] Get form schema' })
  getSchema(@Param('id') id: string) {
    return this.serviceTypesService.getSchema(id);
  }

  // Admin Routes
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('service_types:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Create service type' })
  create(@Body() dto: CreateServiceTypeDto) {
    return this.serviceTypesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('service_types:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Update service type' })
  update(@Param('id') id: string, @Body() dto: UpdateServiceTypeDto) {
    return this.serviceTypesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('service_types:delete')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Delete service type' })
  remove(@Param('id') id: string) {
    return this.serviceTypesService.remove(id);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('service_types:write')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '[Admin] Activate service type' })
  activate(@Param('id') id: string) {
    return this.serviceTypesService.activate(id);
  }
}
