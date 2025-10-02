let nodes = [];
let edges = [];
const nodeMap = {}; // id -> {x,y}
let currentPath = [];

async function loadData() {
  const resNodes = await fetch('/api/nodes');
  nodes = await resNodes.json();
  nodes.forEach(n => nodeMap[n.id] = { x: n.x, y: n.y });

  const resEdges = await fetch('/api/edges');
  edges = await resEdges.json();

  populateDropdowns();
  drawGraph();
}

function populateDropdowns() {
  const s = document.getElementById('source');
  const d = document.getElementById('destination');
  s.innerHTML = ''; d.innerHTML = '';
  nodes.forEach(n => {
    s.add(new Option(n.id, n.id));
    d.add(new Option(n.id, n.id));
  });
}

function drawGraph() {
  const canvas = document.getElementById('map');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // Draw all edges (gray)
  ctx.strokeStyle = "#bbb";
  ctx.lineWidth = 1;
  edges.forEach(e => {
    const p1 = nodeMap[e.source];
    const p2 = nodeMap[e.target];
    if (!p1||!p2) return;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    // draw small weight label
    const midX = (p1.x + p2.x)/2;
    const midY = (p1.y + p2.y)/2;
    ctx.fillStyle = "#555";
    ctx.font = "11px Arial";
    ctx.fillText(e.weight, midX+4, midY-4);
  });

  // Highlight path
  if (currentPath.length > 1) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    for (let i=0;i<currentPath.length-1;i++){
      const a = currentPath[i], b = currentPath[i+1];
      const p1 = nodeMap[a], p2 = nodeMap[b];
      if (!p1 || !p2) continue;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  // Draw nodes
  for (const n of nodes) {
    const p = nodeMap[n.id];
    if (!p) continue;
    ctx.beginPath();
    ctx.fillStyle = "#2b7cff";
    ctx.arc(p.x, p.y, 8, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.fillText(n.id, p.x + 10, p.y + 4);
  }
}

document.getElementById('findBtn').addEventListener('click', async () => {
  const src = document.getElementById('source').value;
  const dst = document.getElementById('destination').value;
  if (!src || !dst) { document.getElementById('output').innerText = 'Select both places.'; return; }
  if (src === dst) { document.getElementById('output').innerText = 'Source and destination are same.'; currentPath = []; drawGraph(); return; }
  const res = await fetch(`/api/shortest-path?source=${encodeURIComponent(src)}&destination=${encodeURIComponent(dst)}`);
  const path = await res.json();
  if (!path || path.length === 0) {
    document.getElementById('output').innerText = 'No path found.';
    currentPath = [];
  } else {
    document.getElementById('output').innerText = 'Shortest Path: ' + path.join(' → ');
    currentPath = path;
  }
  drawGraph();
});

// initial load
loadData().catch(err => {
  console.error(err);
  document.getElementById('output').innerText = 'Failed to load data. Is the backend running?';
});
