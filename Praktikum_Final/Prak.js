let nodeIdCounter = 0;
let edgeIdCounter = 0;

const NODE_TYPES = ['start', 'read', 'push', 'pop', 'accept', 'reject'];
const NODE_LABELS = {
    start: 'Start',
    read: 'Read',
    push: 'Push',
    pop: 'Pop',
    accept: 'Accept',
    reject: 'Reject'
};
const NODE_COLORS = {
    start: '#4a90e2',
    read: '#f59e0b',
    push: '#8b5cf6',
    pop: '#ef4444',
    accept: '#22c55e',
    reject: '#6b7280'
};
const NODE_SHAPES = {
    start: 'roundrect',
    read: 'diamond',
    push: 'rect',
    pop: 'diamond',
    accept: 'roundrect',
    reject: 'roundrect'
};

// PDA: a^n b^n
function createAnbnPDA() {
    const nodes = [
        { id: nodeIdCounter++, type: "start", x: 80, y: 220, label: "Start" },
        { id: nodeIdCounter++, type: "read", x: 220, y: 120, label: "Read" },
        { id: nodeIdCounter++, type: "push", x: 420, y: 120, label: "Push a", pushSymbol: "a" },
        { id: nodeIdCounter++, type: "read", x: 220, y: 320, label: "Read" },
        { id: nodeIdCounter++, type: "pop", x: 420, y: 320, label: "Pop" },
        { id: nodeIdCounter++, type: "accept", x: 620, y: 520, label: "Accept" },
        { id: nodeIdCounter++, type: "pop", x: 220, y: 460, label: "Pop" },
        { id: nodeIdCounter++, type: "reject", x: 291, y: 611, label: "Reject" },
        { id: nodeIdCounter++, type: "read", x: 406, y: 481.5, label: "Read" }
    ];

    const edges = [
        { id: edgeIdCounter++, from: 0, to: 1, symbol: "λ" },
        { id: edgeIdCounter++, from: 1, to: 2, symbol: "a" },
        { id: edgeIdCounter++, from: 2, to: 1, symbol: "λ" },
        { id: edgeIdCounter++, from: 1, to: 3, symbol: "λ" },
        { id: edgeIdCounter++, from: 3, to: 4, symbol: "b" },
        { id: edgeIdCounter++, from: 4, to: 3, symbol: "a" },
        { id: edgeIdCounter++, from: 3, to: 6, symbol: "λ" },
        { id: edgeIdCounter++, from: 6, to: 7, symbol: "a" },
        { id: edgeIdCounter++, from: 6, to: 8, symbol: "λ" },
        { id: edgeIdCounter++, from: 8, to: 7, symbol: "a" },
        { id: edgeIdCounter++, from: 8, to: 7, symbol: "b" },
        { id: edgeIdCounter++, from: 8, to: 5, symbol: "λ" }
    ];
    return { nodes, edges };
}

// PDA: aa b^n
function createAabnPDA() {
    const nodes = [
        { id: nodeIdCounter++, type: "start", x: 80, y: 200, label: "Start" },
        { id: nodeIdCounter++, type: "read", x: 220, y: 140, label: "Read" },
        { id: nodeIdCounter++, type: "read", x: 380, y: 140, label: "Read" },
        { id: nodeIdCounter++, type: "read", x: 220, y: 320, label: "Read" },
        { id: nodeIdCounter++, type: "accept", x: 560, y: 230, label: "Accept" },
        { id: nodeIdCounter++, type: "reject", x: 560, y: 370, label: "Reject" },
        { id: nodeIdCounter++, type: "push", x: 256, y: 515.5, label: "Push b", pushSymbol: "b" },
        { id: nodeIdCounter++, type: "pop", x: 378, y: 271.5, label: "Pop" }
    ];
    const edges = [
        { id: edgeIdCounter++, from: 0, to: 1, symbol: "λ" },
        { id: edgeIdCounter++, from: 1, to: 2, symbol: "a" },
        { id: edgeIdCounter++, from: 2, to: 3, symbol: "a" },
        { id: edgeIdCounter++, from: 3, to: 5, symbol: "a" },
        { id: edgeIdCounter++, from: 3, to: 6, symbol: "b" },
        { id: edgeIdCounter++, from: 6, to: 3, symbol: "λ" },
        { id: edgeIdCounter++, from: 7, to: 4, symbol: "b" },
        { id: edgeIdCounter++, from: 3, to: 7, symbol: "λ" }
    ];
    return { nodes, edges };
}

function createEmptyPDA() {
    const nodes = [
        { id: nodeIdCounter++, type: 'start', x: 80, y: 200, label: 'Start' },
        { id: nodeIdCounter++, type: 'accept', x: 300, y: 200, label: 'Accept' },
    ];
    const edges = [
    ];
    return { nodes, edges };
}


let pda = { nodes: [], edges: [] };
let selectedNodeId = null;
let selectedEdgeId = null;
let dragNodeId = null;
let dragOffsetX = 0,
    dragOffsetY = 0;
let hoveredNodeId = null;
let hoveredEdgeId = null;

//  state
let execSteps = [];
let execStepIndex = -1;
let execResult = null; 
let isRunning = false;
let edgeSourceId = null;

const canvas = document.getElementById('pdaCanvas');
const ctx = canvas.getContext('2d');
let canvasW = 0,
    canvasH = 0;

//  HELPERS
function getNode(id) { return pda.nodes.find(n => n.id === id); }

function getEdge(id) { return pda.edges.find(e => e.id === id); }

function getNodeShape(type) { return NODE_SHAPES[type] || 'rect'; }

function getNodeColor(type) { return NODE_COLORS[type] || '#888'; }

function getNodeLabel(type) { return NODE_LABELS[type] || type; }

function nodeSize(type) {
    const s = getNodeShape(type);
    if (s === 'diamond') return { w: 56, h: 56 };
    return { w: 72, h: 44 };
}

function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._hide);
    el._hide = setTimeout(() => el.classList.remove('show'), 2200);
}

function getParallelEdgeInfo(edge) {

    const sameDirection = pda.edges.filter(
        e =>
            e.from === edge.from &&
                e.to === edge.to
    );

    const reverseDirection = pda.edges.filter(
        e =>
            e.from === edge.to &&
                e.to === edge.from
    );

    return {
        sameIndex: sameDirection.findIndex(
            e => e.id === edge.id
        ),
        sameCount: sameDirection.length,
        hasReverse: reverseDirection.length > 0
    };
}

function getEdgeOffset(edge) {

    const info = getParallelEdgeInfo(edge);

    let offset = 0;

    if (info.sameCount > 1) {
        offset += (
            info.sameIndex -
                (info.sameCount - 1) / 2
        ) * 35;
    }

    if (info.hasReverse) {
        offset += 80;
    }

    return offset;
}

//  RENDER
function resizeCanvas() {
    const container = document.getElementById('canvasContainer');
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvasW = rect.width;
    canvasH = rect.height;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = canvasW + 'px';
    canvas.style.height = canvasH + 'px';
    ctx.scale(dpr, dpr);
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvasW, canvasH);
    drawGrid();
    drawEdges();
    drawNodes();
    drawEdgeCreationHint();
    drawSelectionHighlight();
}

function drawGrid() {
    ctx.strokeStyle = '#f0f2f5';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvasW; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasH);
        ctx.stroke();
    }
    for (let y = 0; y < canvasH; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasW, y);
        ctx.stroke();
    }
}

function drawNodes() {
    for (const node of pda.nodes) {
        const { x, y } = node;
        const type = node.type;
        const shape = getNodeShape(type);
        const color = getNodeColor(type);
        const label = node.label || getNodeLabel(type);
        const size = nodeSize(type);
        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNodeId === node.id;
        const isStart = type === 'start';
        const isAccept = type === 'accept';
        const isReject = type === 'reject';

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = color;
        ctx.strokeStyle = isSelected ? '#1e293b' : (isHovered ? '#334155' : '#475569');
        ctx.lineWidth = isSelected ? 3 : (isHovered ? 2 : 1.5);

        if (shape === 'diamond') {
            const hw = size.w / 2,
                hh = size.h / 2;
            ctx.beginPath();
            ctx.moveTo(x, y - hh);
            ctx.lineTo(x + hw, y);
            ctx.lineTo(x, y + hh);
            ctx.lineTo(x - hw, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (shape === 'roundrect') {
            const r = 10;
            const w = size.w,
                h = size.h;
            const rx = x - w / 2,
                ry = y - h / 2;
            ctx.beginPath();
            ctx.moveTo(rx + r, ry);
            ctx.arcTo(rx + w, ry, rx + w, ry + h, r);
            ctx.arcTo(rx + w, ry + h, rx, ry + h, r);
            ctx.arcTo(rx, ry + h, rx, ry, r);
            ctx.arcTo(rx, ry, rx + w, ry, r);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            const w = size.w,
                h = size.h;
            ctx.fillRect(x - w / 2, y - h / 2, w, h);
            ctx.strokeRect(x - w / 2, y - h / 2, w, h);
        }

        ctx.restore();

        // label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 4;
        ctx.fillText(label, x, y - 2);
        ctx.shadowBlur = 0;

        // push symbol
        if (type === 'push' && node.pushSymbol) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)';
            ctx.font = '10px monospace';
            ctx.textBaseline = 'top';
            ctx.fillText('⤷ ' + node.pushSymbol, x + 28, y - 8);
        }

        // type badge
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '8px sans-serif';
        ctx.textBaseline = 'bottom';
        ctx.textAlign = 'right';
        ctx.fillText(type.toUpperCase(), x + size.w / 2 - 4, y + size.h / 2 - 4);

        // start arrow
        if (isStart) {
            ctx.fillStyle = '#1e293b';
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText('▶', x - size.w / 2 - 12, y);
        }
        // accept / reject badge
        if (isAccept) {
            ctx.fillStyle = '#16a34a';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('✓', x + size.w / 2 + 8, y);
        }
        if (isReject) {
            ctx.fillStyle = '#dc2626';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('✗', x + size.w / 2 + 8, y);
        }
    }
}

function drawEdges() {

    for (const edge of pda.edges) {

        const from = getNode(edge.from);
        const to = getNode(edge.to);

        if (!from || !to) continue;

        const pts = getEdgeConnectionPoints(
            from,
            to
        );

        if (!pts) continue;

        const isSelected =
            selectedEdgeId === edge.id;

        const isHovered =
            hoveredEdgeId === edge.id;

        const dx =
            pts.to.x - pts.from.x;

        const dy =
            pts.to.y - pts.from.y;

        const len =
        Math.hypot(dx, dy);

        if (len < 1) continue;

        const ux = dx / len;
        const uy = dy / len;

        const nx = -uy;
        const ny = ux;

        const offset =
        getEdgeOffset(edge);

        const mx =
            (pts.from.x + pts.to.x) / 2;

        const my =
            (pts.from.y + pts.to.y) / 2;

        const cx =
            mx + nx * offset;

        const cy =
            my + ny * offset;

        ctx.save();

        ctx.strokeStyle =
            isSelected
                ? '#1e293b'
                : (
                    isHovered
                        ? '#334155'
                        : '#64748b'
                );

        ctx.lineWidth =
            isSelected
                ? 3
                : (
                    isHovered
                        ? 2.5
                        : 1.8
                );

        ctx.shadowColor =
            'rgba(0,0,0,0.06)';

        ctx.shadowBlur = 4;

        ctx.beginPath();

        ctx.moveTo(
            pts.from.x,
            pts.from.y
        );

        ctx.quadraticCurveTo(
            cx,
            cy,
            pts.to.x,
            pts.to.y
        );

        ctx.stroke();

        // arrow position
        const t = 0.93;

        const ax =
            (1 - t) * (1 - t) * pts.from.x +
                2 * (1 - t) * t * cx +
                t * t * pts.to.x;

        const ay =
            (1 - t) * (1 - t) * pts.from.y +
                2 * (1 - t) * t * cy +
                t * t * pts.to.y;

        const tx =
            2 * (1 - t) *
                (cx - pts.from.x) +
                2 * t *
                    (pts.to.x - cx);

        const ty =
            2 * (1 - t) *
                (cy - pts.from.y) +
                2 * t *
                    (pts.to.y - cy);

        const tangentLen =
        Math.hypot(tx, ty);

        const tux =
            tx / tangentLen;

        const tuy =
            ty / tangentLen;

        const arrowSize = 10;

        ctx.fillStyle =
            ctx.strokeStyle;

        ctx.beginPath();

        ctx.moveTo(ax, ay);

        ctx.lineTo(
            ax - tux * arrowSize + tuy * 4,
            ay - tuy * arrowSize - tux * 4
        );

        ctx.lineTo(
            ax - tux * arrowSize - tuy * 4,
            ay - tuy * arrowSize + tux * 4
        );

        ctx.closePath();

        ctx.fill();

        // label
        const txt =
            edge.symbol || 'λ';

        const tw =
            ctx.measureText(txt).width + 14;

        const th = 24;

        ctx.shadowBlur = 0;

        ctx.fillStyle =
            'rgba(255,255,255,0.95)';

        ctx.beginPath();

        ctx.roundRect(
            cx - tw / 2,
            cy - th / 2,
            tw,
            th,
            6
        );

        ctx.fill();

        ctx.fillStyle =
            '#1e293b';

        ctx.font =
            'bold 13px "Cascadia Code", monospace';

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(
            txt,
            cx,
            cy
        );

        ctx.restore();
    }
}

function drawEdgeCreationHint() {
    if (edgeSourceId === null) return;
    const src = getNode(edgeSourceId);
    if (!src) return;

}

function drawSelectionHighlight() {
}

function getEdgeConnectionPoints(from, to) {
    const s1 = nodeSize(from.type);
    const s2 = nodeSize(to.type);
    const shape1 = getNodeShape(from.type);
    const shape2 = getNodeShape(to.type);

    const p1 = { x: from.x, y: from.y };
    const p2 = { x: to.x, y: to.y };

    const pt1 = getBoundaryPoint(p1, p2, shape1, s1);
    const pt2 = getBoundaryPoint(p2, p1, shape2, s2);
    if (!pt1 || !pt2) return null;
    return { from: pt1, to: pt2 };
}

function getBoundaryPoint(center, target, shape, size) {
    const dx = target.x - center.x;
    const dy = target.y - center.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) return { x: center.x, y: center.y };

    const ux = dx / len,
        uy = dy / len;

    if (shape === 'diamond') {
        const hw = size.w / 2,
            hh = size.h / 2;

        for (let t = 0.1; t <= 1.0; t += 0.001) {
            const px = center.x + t * dx;
            const py = center.y + t * dy;
            const val = Math.abs(px - center.x) / hw + Math.abs(py - center.y) / hh;
            if (val >= 0.98) {
                return { x: px, y: py };
            }
        }
        return { x: center.x + ux * hw * 0.7, y: center.y + uy * hh * 0.7 };
    } else {
        const hw = size.w / 2,
            hh = size.h / 2;
        const tx = (dx !== 0) ? (hw / Math.abs(dx)) : Infinity;
        const ty = (dy !== 0) ? (hh / Math.abs(dy)) : Infinity;
        const t = Math.min(tx, ty) * 0.95;
        return { x: center.x + dx * t, y: center.y + dy * t };
    }
}

if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (r > w / 2) r = w / 2;
        if (r > h / 2) r = h / 2;
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        return this;
    };
}

//  HIT TEST
function hitTestNode(mx, my) {
    for (const node of pda.nodes) {
        const size = nodeSize(node.type);
        const shape = getNodeShape(node.type);
        const hw = size.w / 2,
            hh = size.h / 2;
        if (shape === 'diamond') {
            const dx = Math.abs(mx - node.x),
                dy = Math.abs(my - node.y);
            if (dx / hw + dy / hh <= 1.0) return node.id;
        } else {
            if (mx >= node.x - hw && mx <= node.x + hw &&
                my >= node.y - hh && my <= node.y + hh) {
                return node.id;
            }
        }
    }
    return null;
}

function hitTestEdge(mx, my) {

    const threshold = 12;

    for (const edge of pda.edges) {

        const from = getNode(edge.from);
        const to = getNode(edge.to);

        if (!from || !to) continue;

        const pts =
        getEdgeConnectionPoints(from, to);

        if (!pts) continue;

        const dx =
            pts.to.x - pts.from.x;

        const dy =
            pts.to.y - pts.from.y;

        const len =
        Math.hypot(dx, dy);

        if (len < 1) continue;

        const ux = dx / len;
        const uy = dy / len;

        const nx = -uy;
        const ny = ux;

        const offset =
        getEdgeOffset(edge);

        const mxCurve =
            (pts.from.x + pts.to.x) / 2;

        const myCurve =
            (pts.from.y + pts.to.y) / 2;

        const cx =
            mxCurve + nx * offset;

        const cy =
            myCurve + ny * offset;

        let minDist = Infinity;

        for (let t = 0; t <= 1; t += 0.025) {

            const x =
                (1 - t) * (1 - t) * pts.from.x +
                    2 * (1 - t) * t * cx +
                    t * t * pts.to.x;

            const y =
                (1 - t) * (1 - t) * pts.from.y +
                    2 * (1 - t) * t * cy +
                    t * t * pts.to.y;

            const dist =
            Math.hypot(mx - x, my - y);

            if (dist < minDist) {
                minDist = dist;
            }
        }

        if (minDist < threshold) {
            return edge.id;
        }
    }

    return null;
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1,
        dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t * dx,
        cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
}

//  MOUSE / CANVAS EVENTS
let mouseX = 0,
    mouseY = 0;

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvasW / rect.width;
    const scaleY = canvasH / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    const nodeId = hitTestNode(pos.x, pos.y);
    const edgeId = hitTestEdge(pos.x, pos.y);

    if (e.button === 0) {
        if (nodeId !== null) {
            if (edgeSourceId !== null) {
                if (edgeSourceId !== nodeId) {
                    const exists = pda.edges.some(ed => ed.from === edgeSourceId && ed.to === nodeId);
                    const symbol = prompt(
                        'Edge symbol?',
                        'λ'
                    );
                    pda.edges.push({
                        id: edgeIdCounter++,
                        from: edgeSourceId,
                        to: nodeId,
                        symbol: symbol ? symbol.trim() : 'λ'
                    });
                    toast('Edge dibuat');
                    draw();
                }
                edgeSourceId = null;
                draw();
                return;
            }
            selectedNodeId = nodeId;
            selectedEdgeId = null;
            dragNodeId = nodeId;
            const n = getNode(nodeId);
            dragOffsetX = pos.x - n.x;
            dragOffsetY = pos.y - n.y;
            draw();
            updateUI();
            return;
        }
        if (edgeId !== null) {
            selectedEdgeId = edgeId;
            selectedNodeId = null;
            edgeSourceId = null;
            draw();
            updateUI();
            return;
        }
        selectedNodeId = null;
        selectedEdgeId = null;
        edgeSourceId = null;
        draw();
        updateUI();
    }
});

canvas.addEventListener('mousemove', (e) => {
    const pos = getMousePos(e);
    mouseX = pos.x;
    mouseY = pos.y;

    if (dragNodeId !== null) {
        const node = getNode(dragNodeId);
        if (node) {
            node.x = Math.max(20, Math.min(canvasW - 20, pos.x - dragOffsetX));
            node.y = Math.max(20, Math.min(canvasH - 20, pos.y - dragOffsetY));
            draw();
        }
        return;
    }

    // hover
    const nodeId = hitTestNode(pos.x, pos.y);
    const edgeId = hitTestEdge(pos.x, pos.y);
    if (nodeId !== hoveredNodeId || edgeId !== hoveredEdgeId) {
        hoveredNodeId = nodeId;
        hoveredEdgeId = edgeId;
        canvas.style.cursor = (nodeId !== null || edgeId !== null) ? 'pointer' : 'default';
        draw();
    }

    if (edgeSourceId !== null) {
        draw();
        ctx.save();
        const src = getNode(edgeSourceId);
        if (src) {
            ctx.setLineDash([6, 6]);
            ctx.strokeStyle = '#4a90e2';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(src.x, src.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            ctx.restore();
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        dragNodeId = null;
    }
});

canvas.addEventListener('mouseleave', () => {
    dragNodeId = null;
    hoveredNodeId = null;
    hoveredEdgeId = null;
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const pos = getMousePos(e);
    const nodeId = hitTestNode(pos.x, pos.y);
    const edgeId = hitTestEdge(pos.x, pos.y);
    showContextMenu(e.clientX, e.clientY, nodeId, edgeId);
});

//  CONTEXT MENU
function showContextMenu(clientX, clientY, nodeId, edgeId) {
    const menu = document.getElementById('contextMenu');
    menu.innerHTML = '';
    menu.style.display = 'block';
    menu.style.left = clientX + 'px';
    menu.style.top = clientY + 'px';

    if (nodeId !== null) {
        const node = getNode(nodeId);
        if (!node) return;

        const itemLabel = document.createElement('button');
        itemLabel.className = 'menu-item';
        itemLabel.textContent = '✏️ Edit label';
        itemLabel.onclick = () => {
            const newLabel = prompt('Label node:', node.label || '');
            if (newLabel !== null) {
                node.label = newLabel.trim() || undefined;
                draw();
                updateUI();
                toast('Label diupdate');
            }
            closeMenu();
        };
        menu.appendChild(itemLabel);

        if (node.type === 'push') {
            const itemPush = document.createElement('button');
            itemPush.className = 'menu-item';
            itemPush.textContent = '📦 Edit push symbol (now: ' + (node.pushSymbol || 'λ') + ')';
            itemPush.onclick = () => {
                const val = prompt('Symbol yang di-push:', node.pushSymbol || 'a');
                if (val !== null) {
                    node.pushSymbol = val.trim() || 'λ';
                    draw();
                    updateUI();
                    toast('Push symbol diupdate');
                }
                closeMenu();
            };
            menu.appendChild(itemPush);
        }

        const itemEdge = document.createElement('button');
        itemEdge.className = 'menu-item';
        itemEdge.textContent = '🔗 Tambah edge dari sini';
        itemEdge.onclick = () => {
            edgeSourceId = nodeId;
            selectedNodeId = nodeId;
            selectedEdgeId = null;
            draw();
            toast('Klik node tujuan');
            closeMenu();
        };
        menu.appendChild(itemEdge);

        const itemDel = document.createElement('button');
        itemDel.className = 'menu-item danger';
        itemDel.textContent = '🗑️ Hapus node';
        itemDel.onclick = () => {
            if (confirm('Hapus node "' + (node.label || node.type) + '" dan edge terkait?')) {
                pda.nodes = pda.nodes.filter(n => n.id !== nodeId);
                pda.edges = pda.edges.filter(e => e.from !== nodeId && e.to !== nodeId);
                if (selectedNodeId === nodeId) selectedNodeId = null;
                if (edgeSourceId === nodeId) edgeSourceId = null;
                draw();
                updateUI();
                toast('Node dihapus');
            }
            closeMenu();
        };
        menu.appendChild(itemDel);

    } else if (edgeId !== null) {
        const edge = getEdge(edgeId);
        if (!edge) return;

        const itemSym = document.createElement('button');
        itemSym.className = 'menu-item';
        itemSym.textContent = '✏️ Edit symbol (now: ' + (edge.symbol || 'λ') + ')';
        itemSym.onclick = () => {
            const val = prompt('Symbol edge:', edge.symbol || 'λ');
            if (val !== null) {
                edge.symbol = val.trim() || 'λ';
                draw();
                updateUI();
                toast('Symbol diupdate');
            }
            closeMenu();
        };
        menu.appendChild(itemSym);

        const itemDel = document.createElement('button');
        itemDel.className = 'menu-item danger';
        itemDel.textContent = '🗑️ Hapus edge';
        itemDel.onclick = () => {
            pda.edges = pda.edges.filter(e => e.id !== edgeId);
            if (selectedEdgeId === edgeId) selectedEdgeId = null;
            draw();
            updateUI();
            toast('Edge dihapus');
            closeMenu();
        };
        menu.appendChild(itemDel);

    } else {
        // Empty space
        for (const t of NODE_TYPES) {
            const btn = document.createElement('button');
            btn.className = 'menu-item';
            const label = t.charAt(0).toUpperCase() + t.slice(1);
            const color = NODE_COLORS[t] || '#888';
            btn.innerHTML = `<span class="badge" style="background:${color}"></span> Tambah ${label}`;
            btn.onclick = () => {
                const pos = getMousePosFromEvent();
                const id = nodeIdCounter++;
                const newNode = {
                    id,
                    type: t,
                    x: pos.x || 200,
                    y: pos.y || 200,
                    label: getNodeLabel(t),
                };
                if (t === 'push') newNode.pushSymbol = 'a';
                pda.nodes.push(newNode);
                draw();
                updateUI();
                toast('Node ' + label + ' ditambahkan');
                closeMenu();
            };
            menu.appendChild(btn);
        }

        const div = document.createElement('div');
        div.className = 'menu-divider';
        menu.appendChild(div);

        const itemClear = document.createElement('button');
        itemClear.className = 'menu-item danger';
        itemClear.textContent = '🧹 Hapus semua';
        itemClear.onclick = () => {
            if (confirm('Hapus semua node dan edge?')) {
                pda.nodes = [];
                pda.edges = [];
                selectedNodeId = null;
                selectedEdgeId = null;
                edgeSourceId = null;
                draw();
                updateUI();
                toast('Semua dihapus');
            }
            closeMenu();
        };
        menu.appendChild(itemClear);
    }

    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
        menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
    }
}

function getMousePosFromEvent() {
    return { x: mouseX || 200, y: mouseY || 200 };
}

function closeMenu() {
    document.getElementById('contextMenu').style.display = 'none';
}
document.addEventListener('click', closeMenu);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

//  EXECUTION ENGINE
function runPDA(inputStr) {
    const startNode = pda.nodes.find(n => n.type === 'start');
    if (!startNode) {
        toast('Tidak ada node START!');
        return { steps: [], result: 'error', reason: 'No start node' };
    }

    const steps = [];
    const stack = ['λ'];
    let currentId = startNode.id;
    let inputPos = 0;
    const input = inputStr.split('');
    let result = null;
    let reason = '';
    let maxSteps = 500;
    let stepCount = 0;

    // Find accept/reject nodes
    const acceptNodes = pda.nodes.filter(n => n.type === 'accept');
    const rejectNodes = pda.nodes.filter(n => n.type === 'reject');

    while (stepCount < maxSteps) {
        stepCount++;
        const node = getNode(currentId);
        if (!node) {
            result = 'reject';
            reason = 'Node tidak ditemukan';
            break;
        }

        // Check if accept/reject
        if (node.type === 'accept') {
            result = 'accept';
            reason = 'Mencapai ACCEPT';
            steps.push({
                nodeId: currentId,
                stack: [...stack],
                inputPos,
                operation: 'accept',
                description: '✅ ACCEPT'
            });
            break;
        }
        if (node.type === 'reject') {
            result = 'reject';
            reason = 'Mencapai REJECT';
            steps.push({
                nodeId: currentId,
                stack: [...stack],
                inputPos,
                operation: 'reject',
                description: '❌ REJECT'
            });
            break;
        }

        const outgoing = pda.edges.filter(e => e.from === currentId);
        if (outgoing.length === 0) {
            result = 'reject';
            reason = 'Tidak ada edge keluar dari ' + (node.label || node.type);
            steps.push({
                nodeId: currentId,
                stack: [...stack],
                inputPos,
                operation: 'error',
                description: '❌ Dead end'
            });
            break;
        }

        let matched = false;
        let nextId = null;
        let opDesc = '';

        for (const edge of outgoing) {
            const target = getNode(edge.to);
            if (!target) continue;
            const sym = edge.symbol || 'λ';

            if (node.type === 'read') {
                if (inputPos < input.length) {
                    const ch = input[inputPos];
                    if (sym === ch || sym === 'λ') {
                        const consumed = sym === 'λ' ? '' : ch;
                        nextId = edge.to;
                        matched = true;
                        opDesc = `Read "${consumed || 'λ'}" → go to ${target.label || target.type}`;
                        if (sym !== 'λ') inputPos++;
                        steps.push({
                            nodeId: currentId,
                            stack: [...stack],
                            inputPos,
                            operation: 'read',
                            description: opDesc,
                            edgeSymbol: sym,
                            consumed: sym === 'λ' ? 'λ' : ch
                        });
                        break;
                    }
                } else {
                    if (sym === 'λ') {
                        nextId = edge.to;
                        matched = true;
                        opDesc = `Read λ (no input) → go to ${target.label || target.type}`;
                        steps.push({
                            nodeId: currentId,
                            stack: [...stack],
                            inputPos,
                            operation: 'read',
                            description: opDesc,
                            edgeSymbol: 'λ'
                        });
                        break;
                    }
                }
            } else if (node.type === 'push') {
                const pushSym = node.pushSymbol || 'a';
                if (pushSym !== 'λ') {
                    stack.push(pushSym);
                }
                nextId = edge.to;
                matched = true;
                opDesc = `Push "${pushSym}" → go to ${target.label || target.type}`;
                steps.push({
                    nodeId: currentId,
                    stack: [...stack],
                    inputPos,
                    operation: 'push',
                    description: opDesc,
                    pushSymbol: pushSym
                });
                break;
            } else if (node.type === 'pop') {
                const top = stack[stack.length - 1] || 'λ';
                if (sym === top || (sym === 'λ' && top !== 'λ')) {
                    const popped = stack.pop();
                    nextId = edge.to;
                    matched = true;
                    opDesc = `Pop "${popped}" (matched "${sym}") → go to ${target.label || target.type}`;
                    steps.push({
                        nodeId: currentId,
                        stack: [...stack],
                        inputPos,
                        operation: 'pop',
                        description: opDesc,
                        popSymbol: popped
                    });
                    break;
                }
            } else if (node.type === 'start') {
                nextId = edge.to;
                matched = true;
                opDesc = `Start → go to ${target.label || target.type}`;
                steps.push({
                    nodeId: currentId,
                    stack: [...stack],
                    inputPos,
                    operation: 'start',
                    description: opDesc,
                    edgeSymbol: sym
                });
                break;
            }
        }

        if (!matched) {
            result = 'reject';
            reason = 'Tidak ada transisi yang cocok di ' + (node.label || node.type);
            steps.push({
                nodeId: currentId,
                stack: [...stack],
                inputPos,
                operation: 'error',
                description: '❌ No matching transition'
            });
            break;
        }

        currentId = nextId;
        if (currentId === undefined || currentId === null) {
            result = 'reject';
            reason = 'Transisi ke node invalid';
            break;
        }
    }

    if (result === null) {
        result = 'reject';
        reason = 'Maksimum step tercapai';
    }

    // Tidak ditermuka hasil,tapi ada input dan stack kosong , accept
    if (result === null && inputPos >= input.length && stack.length === 1 && stack[0] === 'λ') {
        result = 'accept';
        reason = 'Input habis dan stack kosong';
        steps.push({
            nodeId: currentId,
            stack: [...stack],
            inputPos,
            operation: 'accept',
            description: '✅ ACCEPT (stack empty)'
        });
    }

    if (result === null) {
        result = 'reject';
        reason = 'Tidak mencapai accept';
        steps.push({
            nodeId: currentId,
            stack: [...stack],
            inputPos,
            operation: 'reject',
            description: '❌ REJECT'
        });
    }

    return { steps, result, reason };
}

//  UI UPDATES
function updateUI() {
    // update result display
    const resultText = document.getElementById('resultText');
    if (execResult === 'accept') {
        resultText.textContent = '✅ ACCEPTED';
        resultText.className = 'accept';
    } else if (execResult === 'reject') {
        resultText.textContent = '❌ REJECTED';
        resultText.className = 'reject';
    } else {
        resultText.textContent = 'Belum dicek';
        resultText.className = '';
    }

    const stackView = document.getElementById('stackView');
    if (execSteps.length > 0 && execStepIndex >= 0 && execStepIndex < execSteps.length) {
        const step = execSteps[execStepIndex];
        const st = step.stack || ['λ'];
        stackView.innerHTML = '';
        const displayStack = [...st];
        for (let i = displayStack.length - 1; i >= 0; i--) {
            const el = document.createElement('div');
            el.className = 'stack-item';
            if (i === 0 && displayStack[i] === 'λ') el.classList.add('bottom');
            if (step.operation === 'pop' && i === displayStack.length - 1) el.classList.add('pop');
            if (step.operation === 'push' && i === displayStack.length - 1) el.classList.add('push');
            el.textContent = displayStack[i] || 'λ';
            stackView.appendChild(el);
        }
        if (displayStack.length === 0) {
            const el = document.createElement('div');
            el.className = 'stack-item bottom';
            el.textContent = 'λ (empty)';
            stackView.appendChild(el);
        }
    } else {
        stackView.innerHTML = '<div class="stack-item bottom">λ (bottom)</div>';
    }

    document.getElementById('stepIndicator').textContent =
        execSteps.length > 0 ? `${execStepIndex + 1} / ${execSteps.length}` : '0 / 0';
    document.getElementById('stepBackBtn').disabled = execStepIndex <= 0;
    document.getElementById('stepForwardBtn').disabled = execStepIndex >= execSteps.length - 1;

    const log = document.getElementById('execLog');
    if (execSteps.length > 0) {
        log.innerHTML = execSteps.map((s, i) => {
            const cls = i === execStepIndex ? 'log-entry current' : 'log-entry';
            const op = s.operation || '—';
            const desc = s.description || '';
            return `<div class="${cls}">[${i + 1}] ${op.toUpperCase()} ${desc}</div>`;
        }).join('');
        if (execStepIndex >= 0) {
            const items = log.querySelectorAll('.log-entry');
            if (items[execStepIndex]) items[execStepIndex].scrollIntoView({ block: 'nearest' });
        }
    } else {
        log.innerHTML = 'Belum ada eksekusi.';
    }
}

//  RUN / RESET / STEP
function runExecution() {
    const input = document.getElementById('inputString').value.trim();
    if (!input) {
        toast('Masukkan string input!');
        return;
    }

    const result = runPDA(input);
    execSteps = result.steps;
    execStepIndex = execSteps.length > 0 ? 0 : -1;
    execResult = result.result;

    if (execSteps.length > 0) {
        draw();
        const first = execSteps[0];
        if (first) {
            highlightNode(first.nodeId);
        }
    }

    updateUI();
    draw();
    toast('Eksekusi selesai: ' + (execResult === 'accept' ? '✅ ACCEPT' : '❌ REJECT'));
}

function highlightNode(nodeId) {
    selectedNodeId = nodeId;
    draw();
}

function stepForward() {
    if (execStepIndex < execSteps.length - 1) {
        execStepIndex++;
        const step = execSteps[execStepIndex];
        if (step) highlightNode(step.nodeId);
        updateUI();
        draw();
    }
}

function stepBack() {
    if (execStepIndex > 0) {
        execStepIndex--;
        const step = execSteps[execStepIndex];
        if (step) highlightNode(step.nodeId);
        updateUI();
        draw();
    }
}

function resetExecution() {
    execSteps = [];
    execStepIndex = -1;
    execResult = null;
    selectedNodeId = null;
    selectedEdgeId = null;
    edgeSourceId = null;
    updateUI();
    draw();
    toast('Reset');
}

//  PRESETS
function loadPreset(name) {
    let data;
    nodeIdCounter = 0;
    edgeIdCounter = 0;
    switch (name) {
        case 'anbn':
            data = createAnbnPDA();
            break;
        case 'aabn':
            data = createAabnPDA();
            break;
        case 'empty':
        default:
            data = createEmptyPDA();
            break;
    }
    pda.nodes = data.nodes;
    pda.edges = data.edges;
    selectedNodeId = null;
    selectedEdgeId = null;
    edgeSourceId = null;
    resetExecution();
    draw();
    updateUI();
    toast('Preset dimuat: ' + name);
}

//  JSON EDITOR
function syncJSONToPDA() {
    try {
        const data = JSON.parse(document.getElementById('jsonEditor').value);
        if (data.nodes && data.edges) {
            pda.nodes = data.nodes;
            pda.edges = data.edges;
            for (const n of pda.nodes) nodeIdCounter = Math.max(nodeIdCounter, n.id + 1);
            for (const e of pda.edges) edgeIdCounter = Math.max(edgeIdCounter, e.id + 1);
            resetExecution();
            draw();
            updateUI();
            toast('JSON dimuat');
        } else {
            toast('JSON harus memiliki nodes dan edges');
        }
    } catch (e) {
        toast('JSON tidak valid: ' + e.message);
    }
}

function updateJSONEditor() {
    const data = { nodes: pda.nodes, edges: pda.edges };
    document.getElementById('jsonEditor').value = JSON.stringify(data, null, 2);
}

//  TABS
function switchTab(tab) {
    const canvasContainer = document.getElementById('canvasContainer');
    const jsonContainer = document.getElementById('jsonContainer');
    const tabs = document.querySelectorAll('#tabBar button');
    tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    if (tab === 'visual') {
        canvasContainer.style.display = 'block';
        jsonContainer.style.display = 'none';
        setTimeout(resizeCanvas, 50);
    } else {
        canvasContainer.style.display = 'none';
        jsonContainer.style.display = 'flex';
        updateJSONEditor();
    }
}

//  INIT
function init() {
    loadPreset('anbn');

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    document.querySelectorAll('#tabBar button').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('runBtn').addEventListener('click', runExecution);
    document.getElementById('resetBtn').addEventListener('click', resetExecution);

    document.getElementById('stepForwardBtn').addEventListener('click', stepForward);
    document.getElementById('stepBackBtn').addEventListener('click', stepBack);
    document.getElementById('stepResetBtn').addEventListener('click', resetExecution);

    document.getElementById('presetSelect').addEventListener('change', (e) => {
        loadPreset(e.target.value);
    });

    document.getElementById('jsonEditor').addEventListener('blur', syncJSONToPDA);
    document.getElementById('jsonEditor').addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            syncJSONToPDA();
        }
    });

    document.getElementById('inputString').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') runExecution();
    });

    updateUI();

    document.addEventListener('scroll', closeMenu);

    canvas.addEventListener('dblclick', (e) => {
        const pos = getMousePos(e);
        const nodeId = hitTestNode(pos.x, pos.y);
        if (nodeId !== null) {
            const node = getNode(nodeId);
            if (node) {
                const newLabel = prompt('Edit label:', node.label || '');
                if (newLabel !== null) {
                    node.label = newLabel.trim() || undefined;
                    draw();
                    updateUI();
                    toast('Label diupdate');
                }
            }
        }
    });

    document.addEventListener('keydown', (e) => {

        if (e.key !== 'Backspace' && e.key !== 'Delete') {
            return;
        }

        const tag = document.activeElement.tagName;

        if (
            tag === 'INPUT' ||
                tag === 'TEXTAREA' ||
                document.activeElement.isContentEditable
        ) {
            return;
        }

        e.preventDefault();

        if (selectedNodeId !== null) {

            pda.nodes = pda.nodes.filter(
                n => n.id !== selectedNodeId
            );

            pda.edges = pda.edges.filter(
                e =>
                    e.from !== selectedNodeId &&
                        e.to !== selectedNodeId
            );

            toast('Node dihapus');

            selectedNodeId = null;
            selectedEdgeId = null;

            updateUI();
            draw();

            return;
        }

        if (selectedEdgeId !== null) {

            pda.edges = pda.edges.filter(
                e => e.id !== selectedEdgeId
            );

            toast('Edge dihapus');

            selectedEdgeId = null;

            updateUI();
            draw();
        }
    });

    console.log('PDA Visualizer ready!');
}

document.addEventListener('DOMContentLoaded', init);