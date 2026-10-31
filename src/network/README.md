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
It shares selection and TaskInspection with Gantt, and provides native scrolling,
50%-150% zoom, Reset position and Go to selected node. It is read-only: no graph
dragging or editing, no three-point estimates and no probabilistic PERT claims.

Only viewport-intersecting nodes and edges, with a node-sized overscan, are mounted
in SVG. Graph/layout calculation still processes all tasks and relationships. A
1000-root component test keeps mounted DOM below 300 elements and navigates to an
offscreen selection. Dimensions over 4,000,000px at the selected zoom show a clear
display-limit message; reducing zoom can restore rendering. The WP2 input table
remains fully rendered. These scoped checks are not a general graph-size benchmark.
