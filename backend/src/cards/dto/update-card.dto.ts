import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateCardDto } from './create-card.dto';

// Editable fields only — moving a card (columnId/position) goes through the
// dedicated /move endpoint, not the generic update.
export class UpdateCardDto extends PartialType(
  OmitType(CreateCardDto, ['columnId', 'position'] as const),
) {}
