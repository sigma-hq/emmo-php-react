<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('inspections:create-scheduled')->everyMinute()->withoutOverlapping();
Schedule::command('operators:check-performance')->daily()->at('08:00')->withoutOverlapping();
Schedule::command('handout-notes:archive')->weekly()->sundays()->at('01:00')->withoutOverlapping();
