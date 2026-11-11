import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { RoleType } from '@prisma/client';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessService, AuthUser } from '../../common/access/access.service';

// Moliya (xarajatlar, sof foyda) — faqat markaz admini va faqat o'z markazi bo'yicha
@Roles(RoleType.admin)
@Controller('expenses')
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly access: AccessService,
  ) {}

  @Get('summary')
  getSummary(@CurrentUser() user: AuthUser, @Query('centerId') centerId?: string) {
    return this.expensesService.getSummary(this.access.scopeCenter(user, centerId));
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('centerId') centerId?: string,
    @Query('category') category?: string,
  ) {
    return this.expensesService.findAll(this.access.scopeCenter(user, centerId), category);
  }

  @Post()
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: AuthUser) {
    dto.centerId = this.access.centerForCreate(user, dto.centerId);
    return this.expensesService.create(dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    await this.access.expense(user, id);
    return this.expensesService.delete(id);
  }
}
