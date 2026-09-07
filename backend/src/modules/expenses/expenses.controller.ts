import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('summary')
  getSummary(@Query('centerId') centerId?: string) {
    return this.expensesService.getSummary(centerId);
  }

  @Get()
  findAll(
    @Query('centerId') centerId?: string,
    @Query('category') category?: any,
  ) {
    return this.expensesService.findAll(centerId, category);
  }

  @Post()
  create(@Body() dto: CreateExpenseDto) {
    return this.expensesService.create(dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.expensesService.delete(id);
  }
}
