# Dependency network layout

layoutNetwork(tasks, validCriticalAnalysis) is a pure display projection. It uses
the domain's deterministic topological IDs and relationships. A node's level is
one beyond its latest dependency level, not an earliest date or duration. Roots
share the first column. Columns are ordered by parent-row barycentres with stable
ID ties to reduce crossings; each column is vertically centred. Fixed 240x132px
nodes, 88px column gaps and 48px row gaps prevent node overlap.

Edges attach to separate input/output ports at joins and fan-outs and follow
orthogonal directed paths. Critical classification comes only from domain analysis.
Nodes/edges use stable task IDs and predecessor/successor pair keys. Reordering
input arrays does not change the deterministic layout. Positions are not saved as
project data. Full task names/IDs remain in accessible labels and inspection;
long visible labels are abbreviated/clipped to the node bounds.

NetworkView displays bold solid critical edges, dashed other edges, explicit
CRITICAL/zero-slack labels, effort, current dates and release waiting where relevant.
It shares selection and TaskInspection with Gantt. WP5.2 adds visible Zoom In/Out,
Fit to View and background panning alongside the zoom selector, Reset position
and Go to selected node. Dragging blank background pans the view; nodes remain
read-only. There is no scheduling by dragging, graph editing, three-point estimate
or probabilistic PERT behavior.

viewport.ts supplies pure fit, anchored zoom, pan, centring, inverse hit testing and
visible-world bounds. One SVG translate/scale group transforms nodes, text, edges,
stroke emphasis and arrowheads uniformly. The outer canvas has fixed viewport
dimensions, replacing the former enormous native-scroll SVG and its 4,000,000px
display cutoff. Graph positions and relationship paths remain unchanged.

Fit includes layout padding plus 24 screen pixels of margin and centres both axes.
It caps scale at 100% for a small graph; manual zoom is 5%-300%. Fit may go below
5% for a large overview. Go to selected node centres its node at at least 75% for
readability. Fit mode responds to resize/layout changes. Manual zoom/pan stays
chosen across unrelated edits, Gantt/Network and top-level tab changes. App supplies
an active flag so a hidden canvas is measured when opened, and remounts the network
on an explicit project load/new action. No viewport state enters persistence.

Pointer capture supports blank-background dragging without starting a pan on nodes
or edges; the click following a pan cannot select an unintended node. Arrow keys
pan a focused canvas and Home fits; buttons are keyboard accessible. No wheel or
Ctrl+wheel handler intercepts page/browser zoom. All pointer and culling coordinates
use the same inverse transform, including the canvas border offset for overview hits.

Only viewport-intersecting nodes and edges, with 48 screen pixels of overscan, are
rendered. If more than 100 nodes are visible, batched SVG outlines preserve the
whole graph overview without mounting thousands of label/control elements. A
selected node retains its normal label/inspection; Go to selected node zooms back
to readable detail. Dense overview edges are also batched by criticality. Layout
still processes all tasks/relationships. The 1000-root component and browser tests
keep network DOM below 300 elements and navigate to an offscreen selection. The
task input table remains fully rendered; these are scoped performance checks,
not an unrestricted graph-size or cross-browser benchmark.
