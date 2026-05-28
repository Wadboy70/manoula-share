import { Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth'

import {
  formatExceptionLabel,
  formatWeeklyRuleLabel,
  todayDateInputValue,
} from './availability-format'
import { ISO_WEEKDAY_OPTIONS, AVAILABILITY_HORIZON_DAYS } from './availability.types'
import { useAvailabilityEditor } from './use-availability-editor'

const fieldClass = 'border-white/10 bg-white/5'

export function DashboardAvailabilityPage() {
  const { appUser } = useAuth()
  const professionalId = appUser?.id
  const {
    loading,
    saving,
    error,
    success,
    rules,
    exceptions,
    previewSlotCount,
    weeklyDraft,
    setWeeklyDraft,
    exceptionDraft,
    setExceptionDraft,
    addWeeklyRule,
    removeWeeklyRule,
    addException,
    removeException,
  } = useAvailabilityEditor(professionalId)

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading availability…</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-heading text-2xl text-white md:text-3xl">Availability</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          Set your regular weekly hours and add date exceptions. Clients request times from the
          open slots you generate—no calendar sync required.
        </p>
      </header>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Regular weekly availability</CardTitle>
          <CardDescription>
            Add the days and hours you are usually available for consultations.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            className="grid gap-3 sm:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault()
              void addWeeklyRule()
            }}
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Day</span>
              <select
                className={`${fieldClass} h-9 rounded-md px-3 text-sm`}
                value={weeklyDraft.dayOfWeek}
                onChange={(event) => {
                  setWeeklyDraft((prev) => ({
                    ...prev,
                    dayOfWeek: Number(event.target.value),
                  }))
                }}
              >
                {ISO_WEEKDAY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Start</span>
              <Input
                type="time"
                required
                className={fieldClass}
                value={weeklyDraft.startTime}
                onChange={(event) => {
                  setWeeklyDraft((prev) => ({ ...prev, startTime: event.target.value }))
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">End</span>
              <Input
                type="time"
                required
                className={fieldClass}
                value={weeklyDraft.endTime}
                onChange={(event) => {
                  setWeeklyDraft((prev) => ({ ...prev, endTime: event.target.value }))
                }}
              />
            </label>
            <div className="flex items-end">
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                Add window
              </Button>
            </div>
          </form>

          {rules.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Add the days and hours you&apos;re usually available.
            </p>
          ) : (
            <ul className="divide-y divide-white/10 rounded-md border border-white/10">
              {rules.map((rule) => (
                <li
                  key={rule.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span>{formatWeeklyRuleLabel(rule)}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    aria-label={`Remove ${formatWeeklyRuleLabel(rule)}`}
                    onClick={() => {
                      void removeWeeklyRule(rule.id)
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Date exceptions</CardTitle>
          <CardDescription>
            Block vacation days or add one-off availability outside your usual hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form
            className="grid gap-3 lg:grid-cols-5"
            onSubmit={(event) => {
              event.preventDefault()
              void addException()
            }}
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Date</span>
              <Input
                type="date"
                required
                min={todayDateInputValue()}
                className={fieldClass}
                value={exceptionDraft.exceptionDate}
                onChange={(event) => {
                  setExceptionDraft((prev) => ({
                    ...prev,
                    exceptionDate: event.target.value,
                  }))
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Type</span>
              <select
                className={`${fieldClass} h-9 rounded-md px-3 text-sm`}
                value={exceptionDraft.kind}
                onChange={(event) => {
                  setExceptionDraft((prev) => ({
                    ...prev,
                    kind: event.target.value as typeof prev.kind,
                  }))
                }}
              >
                <option value="unavailable">Unavailable</option>
                <option value="available">Extra hours</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Start (optional)</span>
              <Input
                type="time"
                className={fieldClass}
                value={exceptionDraft.startTime}
                onChange={(event) => {
                  setExceptionDraft((prev) => ({ ...prev, startTime: event.target.value }))
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">End (optional)</span>
              <Input
                type="time"
                className={fieldClass}
                value={exceptionDraft.endTime}
                onChange={(event) => {
                  setExceptionDraft((prev) => ({ ...prev, endTime: event.target.value }))
                }}
              />
            </label>
            <div className="flex items-end">
              <Button type="submit" disabled={saving} className="w-full lg:w-auto">
                Add exception
              </Button>
            </div>
          </form>
          <p className="text-muted-foreground text-xs">
            Leave start and end blank for an all-day block or all-day extra availability.
          </p>

          {exceptions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No date exceptions yet.</p>
          ) : (
            <ul className="divide-y divide-white/10 rounded-md border border-white/10">
              {exceptions.map((exception) => (
                <li
                  key={exception.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <span>{formatExceptionLabel(exception)}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={saving}
                    aria-label={`Remove exception on ${exception.exception_date}`}
                    onClick={() => {
                      void removeException(exception.id)
                    }}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client preview</CardTitle>
          <CardDescription>
            Based on a 60-minute session length over the next {AVAILABILITY_HORIZON_DAYS} days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground text-sm">
            {previewSlotCount > 0
              ? `${previewSlotCount} bookable time${previewSlotCount === 1 ? '' : 's'} available for client requests.`
              : 'No bookable times yet—add weekly hours or extra availability.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
