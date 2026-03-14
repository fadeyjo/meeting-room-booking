export function invitationStatusLabel(status: string): string {
  if (!status) return status;
  if (status === 'Отменено (переполнение)') {
    return 'Отменено из-за переполнения количества гостей в переговорке';
  }
  return status;
}
