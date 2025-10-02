let nodes = [];
let edges = [];
const nodeMap = {}; // id -> {x, y}
let currentPath = [];

// Replace with your Render backend URL
const BACKEND_URL = "https://navigator-project.onrender.com";

async function loadData() {
  try {
    console.log("Fetching nodes...");
    const resNodes = await fetch(`${BACKEND_URL}/api/nodes`);
    if (!resNodes.ok) throw new Error(`Failed to fetch nodes: ${resNodes.status}`);
    nodes = await resNodes.json();
    nodes.forEach(n => nodeMap[n.id] = { x: n.x, y: n.y });
    console.log("Nodes loaded:", nodes);

    console.log("Fetching edges...");
    const resEdges = await fetch(`${BACKEND_URL}/api/edges`);
    if (!resEdges.ok) throw new Error(`Failed to fetch edges: ${resEdges.status}`);
    edges = await resEdges.json();
    console.log("Edges loaded:", edges);

    populateDropdowns();
    drawGraph();
    document.getElementById('output').innerText = "Data loaded successfully!";
  } catch (err) {
    console.error(err);
    document.getElementById('output').innerText = 'Failed to load data. Is the backend running?';
  }
}

function populateDropdowns() {
  const s = document.getElementById('source');
  const d = document.getElementById('destination');
  s.innerHTML = '';
  d.innerHTML = '';
  nodes.forEach(n => {
    s.add(new Option(n.id, n.id));
    d.add(new Option(n.id, n.id));
  });
}

function drawGraph() {
  const canvas = document.getElementById('map');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw all edges (gray)
  ctx.strokeStyle = "#bbb";
  ctx.lineWidth = 1;
  edges.forEach(e => {
    const p1 = nodeMap[e.source];
    const p2 = nodeMap[e.target];
    if (!p1 || !p2) return;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    // Draw weight label
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    ctx.fillStyle = "#555";
    ctx.font = "11px Arial";
    ctx.fillText(e.weight, midX + 4, midY - 4);
  });

  // Highlight current path
  if (currentPath.length > 1) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    for (let i = 0; i < currentPath.length - 1; i++) {
      const a = currentPath[i];
      const b = currentPath[i + 1];
      const p1 = nodeMap[a];
      const p2 = nodeMap[b];
      if (!p1 || !p2) continue;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  // Draw nodes
  nodes.forEach(n => {
    const p = nodeMap[n.id];
    if (!p) return;
    ctx.beginPath();
    ctx.fillStyle = "#2b7cff";
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.fillText(n.id, p.x + 10, p.y + 4);
  });
}

document.getElementById('findBtn').addEventListener('click', async () => {
  const src = document.getElementById('source').value;
  const dst = document.getElementById('destination').value;

  if (!src || !dst) {
    document.getElementById('output').innerText = 'Select both source and destination.';
    return;
  }
  if (src === dst) {
    document.getElementById('output').innerText = 'Source and destination are the same.';
    currentPath = [];
    drawGraph();
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/shortest-path?source=${encodeURIComponent(src)}&destination=${encodeURIComponent(dst)}`);
    if (!res.ok) throw new Error(`Failed to fetch path: ${res.status}`);
    const path = await res.json();

    if (!path || path.length === 0) {
      document.getElementById('output').innerText = 'No path found.';
      currentPath = [];
    } else {
      document.getElementById('output').innerText = 'Shortest Path: ' + path.join(' → ');
      currentPath = path;
    }
    drawGraph();
  } catch (err) {
    console.error(err);
    document.getElementById('output').innerText = 'Failed to fetch path. Is the backend running?';
  }
});

// Initial load
loadData();
