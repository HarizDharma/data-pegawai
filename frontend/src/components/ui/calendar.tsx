import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import 'react-day-picker/dist/style.css';

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  holidayDates?: Set<string>;
};

function Calendar({ className, classNames, holidayDates, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col space-y-4',
        month: 'space-y-2',
        caption: 'flex items-center justify-between px-1',
        caption_label: 'text-sm font-medium capitalize text-slate-700',
        nav: 'flex items-center gap-2',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 p-0 text-slate-600 hover:bg-slate-100'
        ),
        table: 'w-full border-collapse',
        head_row: 'flex',
        head_cell: 'w-9 text-center text-[0.7rem] font-medium text-slate-500',
        row: 'mt-1 flex w-full',
        cell: 'relative h-9 w-9 text-center text-sm',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal text-slate-700 hover:bg-slate-100 focus:outline-none'
        ),
        day_selected:
          'bg-slate-900 text-white hover:bg-slate-900 hover:text-white focus:bg-slate-900 focus:text-white',
        day_today: 'text-slate-900 font-semibold',
        day_outside: 'text-slate-400 opacity-50',
        day_disabled: 'text-slate-400 opacity-50',
        day_hidden: 'invisible',
        ...classNames,
      }}
      modifiers={{
        holiday: (date) => !!holidayDates?.has(date.toISOString().slice(0, 10)),
        weekend: (date) => [0, 6].includes(date.getDay()) && !holidayDates?.has(date.toISOString().slice(0, 10)),
      }}
      modifiersClassNames={{
        holiday: 'calendar-holiday',
        weekend: 'calendar-weekend',
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
