# Timeline projection

This pure TypeScript layer maps an already valid WP1 schedule into display units.
It imports WP1 date-only ordinal helpers and types, never React. It does not call
calculateSchedule, decide dependencies, alter inputs, or calculate new task dates.
The chart is fed the same WP1 result as the WP2 table and summary.

## Exact coordinate conventions

Expanded units are calendar days. For an ordinal date d, axis origin o, H daily
hours, start slot h and exclusive finish boundary afterHour f:

```text
start x = (d - o) + (h - 1) / H
finish x = (d - o) + f / H
```

WP1 defines numbered work slots without a wall-clock start time. Accordingly a
selected calendar day is divided into H equal visual sectors. We do not invent
a 09:00 start, a 24-hour workday, lunch breaks or off-duty overnight clock hours.
Nonworking dates are full calendar-width gaps. A task's outline spans continuously
from its exact start to finish; selected-day intersections within that interval
are solid and intervening nonworking-day intersections are hatched. Unused slots
before start and after finish are excluded. There are no other unused working
slots inside a continuous WP1 task because it consumes consecutive available slots.

For Monday/Thursday H=2 and duration=3, the bar is [0,3.5): solid [0,1), hatched
[1,3), solid [3,3.5). Thursday's second half is not occupied by that task.

Compressed units are working slots. Count selected weekdays strictly before d,
multiply by H, and add h-1 or f. Nonworking dates have zero width. The same example
is [0,3), a single solid segment with no gaps. WP1's day-end finish and the next
working-day start share an x coordinate in Compressed, but remain separate real
dates. No source date or schedule field is rewritten.

The axis begins at project start (or the earliest scheduled start if an explicitly
allowed earlier-date policy is used) and ends two calendar days beyond the later
of target/completion, clamped at 9999-12-31. Compressed omits unschedulable dates
within that range. All dates remain strict date-only strings and ordinals.

## Projection API

- createTimelineAxis(project, scheduledTasks, mode): calendar/working coordinate
  mapping, inverse visible-position lookup, and axis extent.
- projectTimeline(axis, taskInputs, scheduledTasks): task rows in input-list order,
  plus finish-to-start endpoints keyed by predecessor/successor IDs.
- visibleDays and visibleHourTicks: only labels/grid positions in a visible range.
- taskSegments: classifications of the existing task span, clipped to visible dates.
- pixelsPerUnit: Hour/Day/Week presentation scales, leaving fractional coordinates intact.
- timelineWindow: maps a bounded native scroll surface to logical time positions.
- connectorPath: orthogonal arrow routing from bar finish to successor start.

Task keys use stable IDs; connector keys encode both IDs. Reordering rows changes
y positions, not schedule references or x coordinates. Multiple relationships can
share final line segments; each remains an independently focusable named path.

## Rendering and limits

The chart renders SVG for visible dates, visible task rows with two-row overscan,
and connectors intersecting that viewport. Sticky HTML labels share the same
52px row metric; sticky headers occupy 72px. Hour labels are sampled when dense,
with no more than 100 ticks per visible day. Day/Week scales aggregate labels
while keeping fractional bar endpoints and hatching.

The horizontal scroll surface is capped at 4,000,000px to avoid browser element
size limits on extremely long calendars. Beyond that width, scroll position maps
proportionally to logical units; the SVG draws viewport-relative coordinates.
Ordinary project ranges use their natural pixel scale. Go to selected task maps
the selected start back to the same scroll surface.

Ranges whose compressed slot count exceeds Number.MAX_SAFE_INTEGER produce an
explicit display-limit message instead of inaccurate bars. This does not change
or invalidate the underlying WP1 schedule. A native scroll viewport has a minimum
200px drawing area plus a 220px sticky label area; ordinary desktop widths are the
intended layout. The WP2 task table still renders its full input list.

Unit/component checks exercise a 1000-row chart and a 0001-9999 date range with
bounded DOM allocation. Chromium exercises a 100-hour, multiweek project, 3000px
horizontal scroll, zoom/mode changes and a 900px browser width. These are scoped
checks, not a guarantee for arbitrary graph sizes or a cross-browser benchmark.

WP4 supplies domain critical classifications to the chart component without
changing this projection geometry. Critical path, slack, network layout and
persistence live in their separate modules. Resource levelling and dragging to
reschedule remain outside the release.
